/**
 * RAG API Routes
 * Endpoints for Q&A Chat using Retrieval-Augmented Generation
 */

const express = require('express');
const router = express.Router();
const ragService = require('../services/ragService');

/**
 * POST /api/rag/query
 * Query the RAG system with a question
 * 
 * Body:
 * {
 *   "question": "Who is the richest MLA?",
 *   "officialName": "PC Mohan" (optional - filter by specific official)
 * }
 */
router.post('/query', async (req, res) => {
  try {
    const { question, officialName } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({
        error: 'Question is required',
        answer: 'Please provide a question.'
      });
    }

    console.log(`\n🔍 RAG API Query: "${question}"${officialName ? ` (filtered by: ${officialName})` : ''}`);

    const result = await ragService.queryWithRAG(question, officialName);

    res.json(result);

  } catch (error) {
    console.error('❌ RAG API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      answer: 'Sorry, an error occurred while processing your question. Please try again.',
      confidence: 'low'
    });
  }
});

/**
 * POST /api/rag/ingest
 * Ingest official data into vector database
 * 
 * Body:
 * {
 *   "officialId": 46
 * }
 */
router.post('/ingest', async (req, res) => {
  try {
    const { officialId } = req.body;

    if (!officialId) {
      return res.status(400).json({
        error: 'Official ID is required'
      });
    }

    // Get official from database
    const db = require('../config/database');
    const result = await db.query('SELECT * FROM officials WHERE id = $1', [officialId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Official not found'
      });
    }

    const official = result.rows[0];
    const chunksCreated = await ragService.ingestOfficialData(official);

    res.json({
      success: true,
      message: `Ingested ${chunksCreated} chunks for ${official.name}`,
      officialName: official.name,
      chunks: chunksCreated
    });

  } catch (error) {
    console.error('❌ RAG Ingest Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to ingest official data'
    });
  }
});

/**
 * POST /api/rag/ingest-all
 * Ingest all officials into vector database
 */
router.post('/ingest-all', async (req, res) => {
  try {
    const result = await ragService.ingestAllOfficials();

    res.json({
      success: true,
      message: `Ingested data for ${result.officials} officials (${result.chunks} total chunks)`,
      officials: result.officials,
      chunks: result.chunks
    });

  } catch (error) {
    console.error('❌ RAG Batch Ingest Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to ingest officials data'
    });
  }
});

/**
 * GET /api/rag/status
 * Check RAG system status and vector database statistics
 */
router.get('/status', async (req, res) => {
  try {
    const db = require('../config/database');

    // Check if embeddings table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'politician_embeddings'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      return res.json({
        status: 'not_initialized',
        message: 'Vector database not initialized. Run /api/rag/initialize first.',
        embeddingsCount: 0
      });
    }

    // Get statistics
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_embeddings,
        COUNT(DISTINCT official_id) as officials_indexed
      FROM politician_embeddings
    `);

    res.json({
      status: 'ready',
      message: 'RAG system is operational',
      embeddingsCount: parseInt(stats.rows[0].total_embeddings),
      officialsIndexed: parseInt(stats.rows[0].officials_indexed)
    });

  } catch (error) {
    console.error('❌ RAG Status Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check RAG status'
    });
  }
});

/**
 * POST /api/rag/initialize
 * Initialize the RAG system (create embeddings table)
 */
router.post('/initialize', async (req, res) => {
  try {
    const success = await ragService.initializeEmbeddingsTable();

    if (success) {
      res.json({
        success: true,
        message: 'RAG system initialized successfully. You can now ingest official data.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize RAG system'
      });
    }

  } catch (error) {
    console.error('❌ RAG Initialize Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to initialize RAG system'
    });
  }
});

module.exports = router;
