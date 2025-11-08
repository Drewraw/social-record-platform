const express = require('express');
const router = express.Router();
const ragService = require('../services/ragService');

// Query endpoint - main RAG functionality
router.post('/query', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Question is required and must be a non-empty string'
            });
        }

        const result = await ragService.ragQuery(question.trim());
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ RAG query error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process RAG query',
            details: error.message
        });
    }
});

// Search endpoint - similarity search only
router.post('/search', async (req, res) => {
    try {
        const { query, limit = 5 } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Query is required and must be a non-empty string'
            });
        }

        const searchLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 20); // 1-20 range
        const results = await ragService.similaritySearch(query.trim(), searchLimit);
        
        res.json({
            success: true,
            data: {
                query: query.trim(),
                limit: searchLimit,
                results: results
            }
        });
    } catch (error) {
        console.error('❌ Similarity search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform similarity search',
            details: error.message
        });
    }
});

// Generate embeddings for a specific politician
router.post('/embeddings/:politicianId', async (req, res) => {
    try {
        const { politicianId } = req.params;
        const id = parseInt(politicianId);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid politician ID is required'
            });
        }

        const result = await ragService.generateEmbeddings(id);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ Generate embeddings error:', error);
        
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to generate embeddings',
                details: error.message
            });
        }
    }
});

// Generate embeddings for all politicians
router.post('/embeddings/generate/all', async (req, res) => {
    try {
        // This might take a while, so we'll start it async
        ragService.generateAllEmbeddings()
            .then(result => {
                console.log('✅ All embeddings generation completed:', result);
            })
            .catch(error => {
                console.error('❌ All embeddings generation failed:', error);
            });

        // Return immediate response
        res.json({
            success: true,
            message: 'Embedding generation started for all politicians. Check server logs for progress.',
            data: { status: 'processing' }
        });
    } catch (error) {
        console.error('❌ Error starting embedding generation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start embedding generation',
            details: error.message
        });
    }
});

// Get RAG system stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await ragService.getStats();
        
        res.json({
            success: true,
            data: {
                ...stats,
                total_embeddings: parseInt(stats.total_embeddings),
                politicians_with_embeddings: parseInt(stats.politicians_with_embeddings),
                profile_embeddings: parseInt(stats.profile_embeddings),
                financial_embeddings: parseInt(stats.financial_embeddings),
                legal_embeddings: parseInt(stats.legal_embeddings),
                relationship_embeddings: parseInt(stats.relationship_embeddings)
            }
        });
    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RAG stats',
            details: error.message
        });
    }
});

// Health check for RAG system
router.get('/health', async (req, res) => {
    try {
        // Basic health check - try to get stats
        const stats = await ragService.getStats();
        
        res.json({
            success: true,
            status: 'healthy',
            message: 'RAG service is operational',
            data: {
                vector_table_exists: true,
                total_embeddings: parseInt(stats.total_embeddings),
                politicians_with_embeddings: parseInt(stats.politicians_with_embeddings),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ RAG health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'RAG service is not operational',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;