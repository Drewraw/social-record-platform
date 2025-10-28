const pool = require('../config/database');

// Get forum comments for an official
exports.getCommentsByOfficial = async (req, res) => {
  try {
    const { officialId } = req.params;
    const result = await pool.query(
      'SELECT * FROM forum_comments WHERE official_id = $1 ORDER BY created_at DESC',
      [officialId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Create new comment
exports.createComment = async (req, res) => {
  try {
    const { official_id, user_name, comment_text } = req.body;
    
    const result = await pool.query(
      `INSERT INTO forum_comments (official_id, user_name, comment_text)
       VALUES ($1, $2, $3) RETURNING *`,
      [official_id, user_name, comment_text]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

// Update comment likes
exports.likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE forum_comments SET likes = likes + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
};
