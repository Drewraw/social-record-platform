const ragService = require('./services/ragService');

async function quickTest() {
    try {
        console.log('🤖 Testing RAG Query with OpenAI...\n');
        
        const result = await ragService.ragQuery('Tell me about T.G. Bharath dynasty status and political background');
        
        console.log('💬 Question: Tell me about T.G. Bharath dynasty status and political background');
        console.log('\n📝 Answer:');
        console.log(result.answer);
        
        console.log('\n📚 Sources:');
        result.sources.forEach((source, i) => {
            console.log(`${i+1}. ${source.politician} (${source.party}) - ${source.contentType} (similarity: ${source.similarity})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

quickTest();