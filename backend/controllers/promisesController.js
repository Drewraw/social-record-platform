const pool = require('../config/database');

// Get all promises for an official
exports.getPromisesByOfficial = async (req, res) => {
  try {
    const { officialId } = req.params;
    const result = await pool.query(
      'SELECT * FROM promises WHERE official_id = $1 ORDER BY promised_date DESC',
      [officialId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching promises:', error);
    res.status(500).json({ error: 'Failed to fetch promises' });
  }
};

// Get single promise
exports.getPromiseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM promises WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promise not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching promise:', error);
    res.status(500).json({ error: 'Failed to fetch promise' });
  }
};

// Create new promise
exports.createPromise = async (req, res) => {
  try {
    const { official_id, title, description, status, promised_date, source_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO promises (official_id, title, description, status, promised_date, source_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [official_id, title, description, status, promised_date, source_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating promise:', error);
    res.status(500).json({ error: 'Failed to create promise' });
  }
};

// Update promise status and progress
exports.updatePromise = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, completion_date } = req.body;
    
    const result = await pool.query(
      `UPDATE promises 
       SET status = COALESCE($1, status), 
           progress = COALESCE($2, progress),
           completion_date = COALESCE($3, completion_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, progress, completion_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promise not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating promise:', error);
    res.status(500).json({ error: 'Failed to update promise' });
  }
};
