const pool = require('../config/database');

// Get comparisons for an official
exports.getComparisonsByOfficial = async (req, res) => {
  try {
    const { officialId } = req.params;
    const result = await pool.query(
      `SELECT c.*, p.title as promise_title 
       FROM comparisons c
       LEFT JOIN promises p ON c.promise_id = p.id
       WHERE c.official_id = $1
       ORDER BY c.created_at DESC`,
      [officialId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    res.status(500).json({ error: 'Failed to fetch comparisons' });
  }
};

// Create new comparison
exports.createComparison = async (req, res) => {
  try {
    const { official_id, promise_id, statement, statement_date, statement_source, 
            reality, reality_date, reality_source, status } = req.body;
    
    const result = await pool.query(
      `INSERT INTO comparisons (official_id, promise_id, statement, statement_date, statement_source,
                                reality, reality_date, reality_source, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [official_id, promise_id, statement, statement_date, statement_source,
       reality, reality_date, reality_source, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating comparison:', error);
    res.status(500).json({ error: 'Failed to create comparison' });
  }
};
