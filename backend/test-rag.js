require('dotenv').config();
const ragService = require('./services/ragService');

async function testRAGService() {
    console.log('🧪 Testing RAG Service...\n');

    try {
        // Test 0: Initialize vector table
        console.log('0️⃣ Initializing Vector Table:');
        await ragService.initializeVectorTable();
        console.log('✅ Vector table initialized\n');

        // Test 1: Check health/stats  
        console.log('1️⃣ Testing RAG Service Health:');
        const stats = await ragService.getStats();
        console.log('📊 Current stats:', stats);
        
        // Test 2: Generate embeddings for existing politicians
        console.log('\n2️⃣ Testing Embedding Generation:');
        try {
            const embeddingResult = await ragService.generateEmbeddings(10); // T.G. Bharath's ID
            console.log('✅ Embedding generation:', embeddingResult);
        } catch (error) {
            console.log('ℹ️ No politician with ID 10, trying ID 11 (KCR)...');
            try {
                const embeddingResult = await ragService.generateEmbeddings(11);
                console.log('✅ Embedding generation:', embeddingResult);
            } catch (error2) {
                console.log('⚠️ No politicians found with ID 10 or 11. Checking what politicians exist...');
                // Let's just check if any politicians exist
                const allStats = await ragService.getStats();
                console.log('Current embeddings count:', allStats.total_embeddings);
            }
        }

        // Test 3: Similarity search
        console.log('\n3️⃣ Testing Similarity Search:');
        try {
            const searchResults = await ragService.similaritySearch('BJP politician dynasty', 3);
            console.log('🔍 Search results for "BJP politician dynasty":', 
                searchResults.map(r => ({ 
                    politician: r.politicianName, 
                    party: r.party, 
                    type: r.contentType, 
                    similarity: r.similarityScore 
                }))
            );
        } catch (error) {
            console.log('⚠️ Similarity search failed (may need embeddings first):', error.message);
        }

        // Test 4: Full RAG query
        console.log('\n4️⃣ Testing Full RAG Query:');
        try {
            const ragResult = await ragService.ragQuery('Who are the dynastic politicians from BJP?');
            console.log('🤖 RAG Answer:', ragResult.answer);
            console.log('📚 Sources used:', ragResult.sources.map(s => s.politician));
        } catch (error) {
            console.log('⚠️ RAG query failed (may need embeddings first):', error.message);
        }

        console.log('\n✅ RAG Service test completed!');
        
    } catch (error) {
        console.error('❌ RAG Service test failed:', error);
    }

    process.exit(0);
}

// Run the test
testRAGService();
