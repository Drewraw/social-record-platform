# RAG Implementation Guide for Political Data

## Architecture Overview

```
User Query → Vector Search (pgvector) → Context Retrieval → LLM (Gemini/Gemma) → Answer with Sources
```

## Tech Stack (Open Source)

1. **Vector Database**: PostgreSQL + pgvector (already installed!)
2. **Embeddings**: 
   - sentence-transformers (open-source)
   - Google Embeddings API (free tier)
3. **Retrieval**: LangChain.js
4. **Generation**: Gemini API (already working)

## Installation Steps

### 1. Install Required Packages

```bash
cd backend
npm install @langchain/core @langchain/community @langchain/google-genai
npm install @tensorflow/tfjs-node @tensorflow-models/universal-sentence-encoder
npm install pg-vector
```

### 2. Enable pgvector in PostgreSQL

Already done! We have it enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for politician data
CREATE TABLE politician_embeddings (
    id SERIAL PRIMARY KEY,
    official_id INTEGER REFERENCES officials(id),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(768), -- 768 dimensions for sentence-transformers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast similarity search
CREATE INDEX ON politician_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 3. Data Ingestion Pipeline

**Step 1: Extract politician data**
```javascript
// From officials table + promises + controversies
const politicianData = {
  name: "D.K. Shivakumar",
  assets: "₹1,413.80 Crore",
  liabilities: "₹231.53 Crore", 
  criminalCases: "19 pending cases",
  education: "B.A. Political Science",
  position: "Deputy CM of Karnataka",
  promises: ["Guarantee schemes", "Infrastructure"],
  sources: ["MyNeta 2023 Affidavit"]
};
```

**Step 2: Convert to text chunks**
```javascript
const chunks = [
  "D.K. Shivakumar's total assets are ₹1,413.80 Crore as per MyNeta 2023 affidavit.",
  "D.K. Shivakumar has 19 pending criminal cases related to money laundering and tax evasion.",
  "D.K. Shivakumar is the Deputy Chief Minister of Karnataka since May 2023.",
  // ... more chunks
];
```

**Step 3: Generate embeddings**
```javascript
import { TensorFlowEmbeddings } from "@langchain/community/embeddings/tensorflow";

const embeddings = new TensorFlowEmbeddings();
const vectors = await embeddings.embedDocuments(chunks);
```

**Step 4: Store in database**
```javascript
await db.query(
  'INSERT INTO politician_embeddings (official_id, content, metadata, embedding) VALUES ($1, $2, $3, $4)',
  [officialId, chunk, metadata, vector]
);
```

## 4. RAG Query Pipeline

**Step 1: User asks question**
```javascript
const userQuestion = "Is D.K. Shivakumar's asset growth verified?";
```

**Step 2: Convert question to embedding**
```javascript
const questionVector = await embeddings.embedQuery(userQuestion);
```

**Step 3: Retrieve similar chunks (Vector Search)**
```sql
SELECT 
  content, 
  metadata,
  1 - (embedding <=> $1) as similarity
FROM politician_embeddings
WHERE official_id = $2
ORDER BY embedding <=> $1
LIMIT 5;
```

**Step 4: Send to LLM with context**
```javascript
const context = retrievedChunks.map(c => c.content).join('\n\n');

const prompt = `
Answer this question using ONLY the provided context. Cite sources.

Context:
${context}

Question: ${userQuestion}

Answer with source citations:
`;

const answer = await geminiService.generateWithContext(prompt);
```

## 5. Benefits of RAG

✅ **Accuracy**: Answers based on verified data, not hallucinations
✅ **Sources**: Every answer cites MyNeta/official sources
✅ **Up-to-date**: Easy to update database with new affidavit data
✅ **Scalable**: Can handle thousands of politicians
✅ **Cost-effective**: Uses free/open-source tools

## 6. Example Queries

1. "What are Pawan Kalyan's criminal cases?"
   - Retrieves: "8 pending cases (7 serious) - MyNeta 2024"
   
2. "How much did DK Shivakumar's assets grow?"
   - Retrieves: "₹1,413 Cr (2023) vs ₹840 Cr (2018) - MyNeta"
   
3. "Has Ramalinga Reddy completed his metro promise?"
   - Retrieves: "Metro Phase 2 to BTM Layout - In Progress 65%"

## 7. Implementation Priority

**Phase 1 (Week 1)**: 
- Set up pgvector table ✅ (already done)
- Install LangChain.js
- Create embedding service

**Phase 2 (Week 2)**:
- Build ingestion pipeline for existing officials
- Generate embeddings for all data

**Phase 3 (Week 3)**:
- Implement RAG query API endpoint
- Test with real user questions

**Phase 4 (Week 4)**:
- Add to frontend chat interface
- Deploy and monitor

## 8. Alternative: Simpler Approach

If full RAG is too complex initially, we can start with:

1. **Structured Search** (what we have now)
   - Search officials by name/constituency
   - Direct database queries
   
2. **Add Vector Search Later**
   - When we have 100+ officials
   - When users ask complex questions

## Next Steps

Would you like me to:
1. **Implement full RAG** with LangChain + pgvector?
2. **Start simple** with structured data + Gemini?
3. **Create hybrid** approach (structured + vector search)?
