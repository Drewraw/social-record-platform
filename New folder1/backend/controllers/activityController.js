const pool = require('../config/database');

// Get activity timeline for an official
exports.getActivityByOfficial = async (req, res) => {
  try {
    const { officialId } = req.params;
    const result = await pool.query(
      'SELECT * FROM activity_timeline WHERE official_id = $1 ORDER BY event_date DESC',
      [officialId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

// Get all recent activity
exports.getAllRecentActivity = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, o.name as official_name, o.position 
       FROM activity_timeline a
       JOIN officials o ON a.official_id = o.id
       ORDER BY a.event_date DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

// Create new activity
exports.createActivity = async (req, res) => {
  try {
    const { official_id, event_title, event_description, event_date, source_type, source_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO activity_timeline (official_id, event_title, event_description, event_date, source_type, source_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [official_id, event_title, event_description, event_date, source_type, source_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
};
