const pool = require('../config/database');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');
const { StringOutputParser } = require('@langchain/core/output_parsers');

class RAGService {
    constructor() {
        this.pool = pool;

        // Initialize OpenAI embeddings (1536 dimensions for text-embedding-3-small)
        this.embeddings = new OpenAIEmbeddings({
            apiKey: process.env.OPENAI_API_KEY,
            model: "text-embedding-3-small", // 1536 dimensions
        });

        // Initialize OpenAI chat model
        this.llm = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: "gpt-4o-mini",
            temperature: 0.1,
        });

        this.initializeVectorTable();
    }

    calculateNetWorth(assets, liabilities) {
        try {
            // Extract numeric values from strings like "₹278 Crore" or "278 Crore"
            const parseAmount = (str) => {
                if (!str) return 0;
                const numStr = str.toString().replace(/[₹,\s]/g, '');
                const num = parseFloat(numStr);
                return isNaN(num) ? 0 : num;
            };

            const assetValue = parseAmount(assets);
            const liabilityValue = parseAmount(liabilities);
            const netWorth = assetValue - liabilityValue;
            
            return `₹${netWorth.toFixed(2)} Crore`;
        } catch (error) {
            return '₹0 Crore';
        }
    }

    async initializeVectorTable() {
        try {
            // Create vector table if it doesn't exist
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS politician_embeddings (
                    id SERIAL PRIMARY KEY,
                    politician_id INTEGER REFERENCES officials(id),
                    content TEXT NOT NULL,
                    content_type VARCHAR(50) NOT NULL, -- 'profile', 'assets', 'criminal_cases', etc.
                    embedding public.vector(1536) NOT NULL,
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create vector similarity search index
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS politician_embeddings_vector_idx 
                ON politician_embeddings USING hnsw (embedding vector_cosine_ops);
            `);

            console.log('✅ Vector table and index initialized');
        } catch (error) {
            console.error('❌ Error initializing vector table:', error);
        }
    }

    async generateEmbeddings(politicianId) {
        try {
            // Get politician data
            const result = await this.pool.query(`
                SELECT id, name, position, party, constituency, state, 
                       dynasty_status, political_relatives, education, 
                       assets, liabilities, criminal_cases, 
                       image_url
                FROM officials WHERE id = $1
            `, [politicianId]);

            if (result.rows.length === 0) {
                throw new Error(`Politician with ID ${politicianId} not found`);
            }

            const politician = result.rows[0];
            
            // Create different content chunks for embedding
            const contentChunks = [
                {
                    type: 'profile',
                    content: `${politician.name} is a ${politician.position} from ${politician.party} party, representing ${politician.constituency} constituency in ${politician.state}. Dynasty Status: ${politician.dynasty_status}. Education: ${politician.education || 'Not specified'}.`
                },
                {
                    type: 'financial',
                    content: `Financial Information for ${politician.name}: Assets worth ${politician.assets || '₹0'}, Liabilities of ${politician.liabilities || '₹0'}. Net worth: ${this.calculateNetWorth(politician.assets, politician.liabilities)}.`
                },
                {
                    type: 'legal',
                    content: `Legal Record for ${politician.name}: ${politician.criminal_cases || 0} criminal cases. Criminal case details available.`
                },
                {
                    type: 'relationships',
                    content: `Political Relationships for ${politician.name}: ${politician.political_relatives || 'No known political relatives'}. Dynasty classification: ${politician.dynasty_status}.`
                }
            ];

            // Generate embeddings for each chunk
            for (const chunk of contentChunks) {
                try {
                    // Check if embedding already exists for this politician and content type
                    const existingCheck = await this.pool.query(`
                        SELECT id FROM politician_embeddings 
                        WHERE politician_id = $1 AND content_type = $2
                    `, [politicianId, chunk.type]);

                    if (existingCheck.rows.length > 0) {
                        console.log(`⏭️ Skipping existing embedding for ${politician.name} - ${chunk.type}`);
                        continue;
                    }

                    const embedding = await this.embeddings.embedQuery(chunk.content);
                    
                    // Store in vector database
                    await this.pool.query(`
                        INSERT INTO politician_embeddings (politician_id, content, content_type, embedding, metadata)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [
                        politicianId,
                        chunk.content,
                        chunk.type,
                        `[${embedding.join(',')}]`, // Convert array to PostgreSQL vector format
                        { politician_name: politician.name, party: politician.party }
                    ]);
                    
                    console.log(`✅ Generated embedding for ${politician.name} - ${chunk.type}`);
                } catch (embeddingError) {
                    console.error(`❌ Error generating embedding for ${chunk.type}:`, embeddingError);
                }
            }

            return { success: true, message: `Embeddings generated for ${politician.name}` };
        } catch (error) {
            console.error('❌ Error generating embeddings:', error);
            throw error;
        }
    }

    async similaritySearch(query, limit = 5) {
        try {
            // Generate embedding for the query
            const queryEmbedding = await this.embeddings.embedQuery(query);
            
            // Perform vector similarity search
            const result = await this.pool.query(`
                SELECT 
                    pe.content,
                    pe.content_type,
                    pe.metadata,
                    o.name,
                    o.party,
                    o.position,
                    o.constituency,
                    1 - (pe.embedding <=> $1) as similarity_score
                FROM politician_embeddings pe
                JOIN officials o ON pe.politician_id = o.id
                ORDER BY pe.embedding <=> $1
                LIMIT $2
            `, [`[${queryEmbedding.join(',')}]`, limit]);

            return result.rows.map(row => ({
                content: row.content,
                contentType: row.content_type,
                politicianName: row.name,
                party: row.party,
                position: row.position,
                constituency: row.constituency,
                similarityScore: parseFloat(row.similarity_score).toFixed(4),
                metadata: row.metadata
            }));
        } catch (error) {
            console.error('❌ Error in similarity search:', error);
            throw error;
        }
    }

    async ragQuery(question) {
        try {
            // Step 1: Retrieve relevant context using similarity search
            const relevantDocs = await this.similaritySearch(question, 5);
            
            // Step 2: Format context for the prompt
            const context = relevantDocs.map(doc => 
                `[${doc.politicianName} - ${doc.party}] ${doc.content} (Similarity: ${doc.similarityScore})`
            ).join('\n\n');

            // Create RAG prompt template
            const ragPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant that provides accurate information about Indian politicians based on the given context from MyNeta.info and official government sources.

Context from politician database:
{context}

Question: {question}

Instructions:
1. Answer based ONLY on the provided context
2. If the context doesn't contain relevant information, say "I don't have enough information to answer that question."
3. Include politician names, parties, and constituencies when relevant
4. Be factual and cite specific details from the context
5. If mentioning financial figures, criminal cases, or dynasty status, be precise
6. Format financial amounts in Indian currency (₹) when applicable

Answer:
            `);

            // Step 4: Create RAG chain
            const ragChain = RunnableSequence.from([
                {
                    context: () => context,
                    question: new RunnablePassthrough(),
                },
                ragPrompt,
                this.llm,
                new StringOutputParser(),
            ]);

            // Step 5: Execute the chain
            const response = await ragChain.invoke(question);

            return {
                answer: response,
                sources: relevantDocs.map(doc => ({
                    politician: doc.politicianName,
                    party: doc.party,
                    contentType: doc.contentType,
                    similarity: doc.similarityScore
                })),
                context_used: context
            };
        } catch (error) {
            console.error('❌ Error in RAG query:', error);
            throw error;
        }
    }

    async generateAllEmbeddings() {
        try {
            // Get all politicians
            const result = await this.pool.query('SELECT id, name FROM officials ORDER BY id');
            const politicians = result.rows;
            
            console.log(`🔄 Generating embeddings for ${politicians.length} politicians...`);
            
            for (const politician of politicians) {
                try {
                    await this.generateEmbeddings(politician.id);
                    console.log(`✅ Processed ${politician.name}`);
                } catch (error) {
                    console.error(`❌ Failed to process ${politician.name}:`, error.message);
                }
            }
            
            return { success: true, processed: politicians.length };
        } catch (error) {
            console.error('❌ Error generating all embeddings:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const stats = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_embeddings,
                    COUNT(DISTINCT politician_id) as politicians_with_embeddings,
                    COUNT(*) FILTER (WHERE content_type = 'profile') as profile_embeddings,
                    COUNT(*) FILTER (WHERE content_type = 'financial') as financial_embeddings,
                    COUNT(*) FILTER (WHERE content_type = 'legal') as legal_embeddings,
                    COUNT(*) FILTER (WHERE content_type = 'relationships') as relationship_embeddings
                FROM politician_embeddings
            `);
            
            return stats.rows[0];
        } catch (error) {
            console.error('❌ Error getting stats:', error);
            throw error;
        }
    }

    // Legacy method for backward compatibility
    async getRagData(input) {
        try {
            if (typeof input === 'string') {
                return await this.ragQuery(input);
            } else {
                return { success: true, rag: 'Sample RAG data', input };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new RAGService();
