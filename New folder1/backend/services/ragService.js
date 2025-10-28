/**
 * RAG Service: Retrieval-Augmented Generation for Political Data
 * Uses pgvector for similarity search + Gemini for generation
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');
require('dotenv').config();

class RAGService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Initialize embeddings table (run once)
   */
  async initializeEmbeddingsTable() {
    try {
      console.log('📊 Initializing embeddings table...');

      // Enable pgvector extension
      await db.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create embeddings table
      await db.query(`
        CREATE TABLE IF NOT EXISTS politician_embeddings (
          id SERIAL PRIMARY KEY,
          official_id INTEGER REFERENCES officials(id),
          content TEXT NOT NULL,
          metadata JSONB,
          embedding vector(768),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for fast similarity search
      await db.query(`
        CREATE INDEX IF NOT EXISTS politician_embeddings_embedding_idx 
        ON politician_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
      `);

      console.log('✅ Embeddings table initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing embeddings:', error.message);
      return false;
    }
  }

  /**
   * Generate embeddings using Gemini Embedding API
   */
  async generateEmbedding(text) {
    try {
      // Use Gemini's text embedding model
      const embeddingModel = this.genAI.getGenerativeModel({ 
        model: 'text-embedding-004' 
      });

      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('❌ Embedding generation error:', error.message);
      
      // Fallback: Use simpler approach - TF-IDF or sentence transformers
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * Simple embedding fallback (hash-based for testing)
   */
  generateSimpleEmbedding(text) {
    // For testing: Create a simple 768-dim vector based on text
    const vector = new Array(768).fill(0);
    
    // Simple hash to create embedding
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      vector[i % 768] += charCode / 1000;
    }
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(v => v / magnitude);
  }

  /**
   * Ingest official's data into vector database
   */
  async ingestOfficialData(official) {
    try {
      console.log(`📥 Ingesting data for: ${official.name}`);

      // Create text chunks from official's data
      const chunks = this.createTextChunks(official);

      let ingestedCount = 0;

      for (const chunk of chunks) {
        // Generate embedding
        const embedding = await this.generateEmbedding(chunk.content);

        // Store in database
        await db.query(
          `INSERT INTO politician_embeddings 
           (official_id, content, metadata, embedding) 
           VALUES ($1, $2, $3, $4)`,
          [
            official.id,
            chunk.content,
            JSON.stringify(chunk.metadata),
            JSON.stringify(embedding)
          ]
        );

        ingestedCount++;
      }

      console.log(`✅ Ingested ${ingestedCount} chunks for ${official.name}`);
      return ingestedCount;

    } catch (error) {
      console.error('❌ Ingestion error:', error.message);
      return 0;
    }
  }

  /**
   * Create text chunks from official data
   */
  createTextChunks(official) {
    const chunks = [];

    // Basic info chunk
    chunks.push({
      content: `${official.name} is a politician from ${official.constituency}, representing ${official.party}. Current position: ${official.current_office || 'MLA'}.`,
      metadata: { type: 'basic_info', source: 'database' }
    });

    // Assets chunk
    if (official.assets) {
      chunks.push({
        content: `${official.name}'s total assets are ${official.assets} as declared in the election affidavit. Source: MyNeta.info.`,
        metadata: { type: 'assets', source: 'MyNeta', verified: true }
      });
    }

    // Liabilities chunk
    if (official.liabilities) {
      chunks.push({
        content: `${official.name} has total liabilities of ${official.liabilities} as per election affidavit. Source: MyNeta.info.`,
        metadata: { type: 'liabilities', source: 'MyNeta', verified: true }
      });
    }

    // Criminal cases chunk
    if (official.criminal_cases) {
      chunks.push({
        content: `${official.name} has ${official.criminal_cases} criminal cases pending as declared in election affidavit. Source: MyNeta.info verified affidavit data.`,
        metadata: { type: 'criminal_cases', source: 'MyNeta', verified: true }
      });
    }

    // Education chunk
    if (official.education) {
      chunks.push({
        content: `${official.name}'s educational qualification is ${official.education}.`,
        metadata: { type: 'education', source: 'affidavit' }
      });
    }

    return chunks;
  }

  /**
   * RAG Query: Retrieve relevant context and generate answer
   */
  async queryWithRAG(question, officialName = null) {
    try {
      console.log(`\n🔍 RAG Query: "${question}"`);

      // Step 1: Generate embedding for question
      const questionEmbedding = await this.generateEmbedding(question);

      // Step 2: Retrieve similar chunks from vector database
      let query = `
        SELECT 
          pe.content,
          pe.metadata,
          o.name as official_name,
          1 - (pe.embedding <=> $1::vector) as similarity
        FROM politician_embeddings pe
        JOIN officials o ON pe.official_id = o.id
      `;

      const params = [JSON.stringify(questionEmbedding)];

      if (officialName) {
        query += ` WHERE o.name ILIKE $2`;
        params.push(`%${officialName}%`);
      }

      query += ` ORDER BY pe.embedding <=> $1::vector LIMIT 5`;

      const result = await db.query(query, params);

      if (result.rows.length === 0) {
        return {
          answer: 'No relevant information found in the database.',
          sources: [],
          confidence: 'low'
        };
      }

      console.log(`   ✅ Retrieved ${result.rows.length} relevant chunks`);

      // Step 3: Prepare context from retrieved chunks
      const context = result.rows
        .map((row, i) => {
          const meta = typeof row.metadata === 'string' 
            ? JSON.parse(row.metadata) 
            : row.metadata;
          return `[${i + 1}] ${row.content} (Source: ${meta.source}, Similarity: ${(row.similarity * 100).toFixed(1)}%)`;
        })
        .join('\n\n');

  // Step 4: Generate answer using Gemini with context
  const prompt = `
You are a factual assistant for a political accountability platform.

Answer the following question using ONLY the provided context. 
- Cite specific sources from the context
- If the context doesn't contain the answer, say so
- Be precise with numbers and facts
- Always mention the source (MyNeta.info affidavit, etc.)
- If possible, include relevant external links (MyNeta, Wikipedia, news articles, official government sites) in your answer. Format links as clickable URLs.

Context:
${context}

Question: ${question}

Provide a clear, factual answer with source citations and external links if available:`;

      const response = await this.model.generateContent(prompt);
      const answer = response.response.text();

      // Extract sources and URLs
      let sources = result.rows.map(row => {
        const meta = typeof row.metadata === 'string' 
          ? JSON.parse(row.metadata) 
          : row.metadata;
        return {
          content: row.content.substring(0, 100) + '...',
          source: meta.source,
          url: meta.url || '',
          verified: meta.verified || false
        };
      });

      // Ensure at least one reference link
      let hasUrl = sources.some(s => s.url && s.url.startsWith('http'));
      if (!hasUrl) {
        // If no URL in DB, add a fallback Gemini search link
        sources.push({
          content: 'Search Google for more info',
          source: 'Google',
          url: `https://www.google.com/search?q=${encodeURIComponent(question)}`,
          verified: false
        });
      }

      console.log(`   ✅ Generated answer with ${sources.length} sources\n`);

      return {
        answer,
        sources,
        confidence: result.rows[0].similarity > 0.7 ? 'high' : 'medium',
        retrievedChunks: result.rows.length
      };

    } catch (error) {
      console.error('❌ RAG query error:', error.message);
      return {
        answer: 'Error processing query. Please try again.',
        sources: [],
        confidence: 'low',
        error: error.message
      };
    }
  }

  /**
   * Ingest all officials into vector database
   */
  async ingestAllOfficials() {
    try {
      console.log('\n📥 Ingesting all officials into vector database...\n');

      const result = await db.query('SELECT * FROM officials LIMIT 10');
      const officials = result.rows;

      let totalChunks = 0;

      for (const official of officials) {
        const chunks = await this.ingestOfficialData(official);
        totalChunks += chunks;
      }

      console.log(`\n✅ Ingestion complete: ${totalChunks} total chunks from ${officials.length} officials`);
      return { officials: officials.length, chunks: totalChunks };

    } catch (error) {
      console.error('❌ Batch ingestion error:', error.message);
      return { officials: 0, chunks: 0 };
    }
  }
}

module.exports = new RAGService();
