const pool = require('./database');

const initDatabase = async () => {
  try {
    console.log('🔧 Initializing database...');

    // Create officials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS officials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        position VARCHAR(255) NOT NULL,
        party VARCHAR(255) NOT NULL,
        constituency VARCHAR(255) NOT NULL,
        tenure VARCHAR(100) NOT NULL,
        dynasty_status VARCHAR(100),
        score INTEGER DEFAULT 0,
        image_url TEXT,
        approvals INTEGER DEFAULT 0,
        disapprovals INTEGER DEFAULT 0,
        education TEXT,
        assets TEXT,
        liabilities TEXT,
        criminal_cases TEXT,
        age VARCHAR(50),
        contact_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create promises table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promises (
        id SERIAL PRIMARY KEY,
        official_id INTEGER REFERENCES officials(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'in-progress',
        promised_date DATE,
        completion_date DATE,
        progress INTEGER DEFAULT 0,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create activity_timeline table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_timeline (
        id SERIAL PRIMARY KEY,
        official_id INTEGER REFERENCES officials(id) ON DELETE CASCADE,
        event_title TEXT NOT NULL,
        event_description TEXT,
        event_date DATE NOT NULL,
        source_type VARCHAR(100),
        source_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create comparisons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comparisons (
        id SERIAL PRIMARY KEY,
        official_id INTEGER REFERENCES officials(id) ON DELETE CASCADE,
        promise_id INTEGER REFERENCES promises(id) ON DELETE CASCADE,
        statement TEXT NOT NULL,
        statement_date DATE,
        statement_source TEXT,
        reality TEXT NOT NULL,
        reality_date DATE,
        reality_source TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create forum_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_comments (
        id SERIAL PRIMARY KEY,
        official_id INTEGER REFERENCES officials(id) ON DELETE CASCADE,
        user_name VARCHAR(255) NOT NULL,
        comment_text TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        replies_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create data_sources table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id SERIAL PRIMARY KEY,
        official_id INTEGER REFERENCES officials(id) ON DELETE CASCADE,
        source_name VARCHAR(100) NOT NULL,
        source_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample data based on spreadsheet
    await pool.query(`
      INSERT INTO officials (name, position, party, constituency, tenure, dynasty_status, score, image_url, approvals, disapprovals)
      VALUES 
        ('Priya Reddy', 'MLA', 'Indian National Congress', 'Bangalore South', '2018–Present', 'Self-Made', 87, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', 2847, 423)
      ON CONFLICT DO NOTHING
    `);

    const official = await pool.query(`SELECT id FROM officials WHERE name = 'Priya Reddy' LIMIT 1`);
    
    if (official.rows.length > 0) {
      const officialId = official.rows[0].id;

      // Insert sample promises
      await pool.query(`
        INSERT INTO promises (official_id, title, status, promised_date, progress, source_url)
        VALUES 
          ($1, 'Build 5 new schools', 'completed', '2024-01-01', 100, 'https://example.com/source1'),
          ($1, 'Improve road infrastructure (15 km)', 'in-progress', '2024-06-01', 65, 'https://example.com/source2'),
          ($1, 'Install 50 CCTV cameras', 'in-progress', '2024-09-01', 40, 'https://example.com/source3'),
          ($1, 'Reduce power cuts by 50%', 'broken', '2023-06-01', 20, 'https://example.com/source4')
        ON CONFLICT DO NOTHING
      `, [officialId]);

      // Insert sample activities
      await pool.query(`
        INSERT INTO activity_timeline (official_id, event_title, event_date, source_type, source_url)
        VALUES 
          ($1, 'Road improvement project announced', '2025-10-24', 'Twitter', 'https://twitter.com/example'),
          ($1, 'Constituency meeting on water supply', '2025-10-22', 'News', 'https://news.com/example'),
          ($1, 'Promised 10 new schools', '2025-10-20', 'Public Speech', 'https://example.com/speech')
        ON CONFLICT DO NOTHING
      `, [officialId]);
    }

    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created: officials, promises, activity_timeline, comparisons, forum_comments, data_sources');
    console.log('📝 Sample data inserted');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();
