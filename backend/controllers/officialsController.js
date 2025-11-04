const pool = require('../config/database');
// OpenAI service removed - using database fields directly

// Get all officials with optional filters
exports.getAllOfficials = async (req, res) => {
  try {
    const { search, party } = req.query;
    
    let query = `
      SELECT 
        o.*,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed') as completed,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'in-progress') as in_progress,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'broken') as broken,
        COUNT(DISTINCT p.id) as total_promises,
        COUNT(DISTINCT f.id) as discussions
      FROM officials o
      LEFT JOIN promises p ON o.id = p.official_id
  LEFT JOIN forum f ON o.id = f.official_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (o.name ILIKE $${paramCount} OR o.constituency ILIKE $${paramCount} OR o.party ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (party && party !== 'all') {
      query += ` AND o.party = $${paramCount}`;
      params.push(party);
      paramCount++;
    }

    query += ' GROUP BY o.id ORDER BY o.id DESC';

    const result = await pool.query(query, params);
    
    // Format response to match frontend expectations with source URLs
    const officials = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      position: `${row.position} - ${row.constituency}`,
      party: row.party,
      constituency: row.constituency,
      state: row.state,
      tenure: row.tenure,
      dynastyStatus: row.dynasty_status,
      education: row.education,
      assets: row.assets,
      liabilities: row.liabilities,
      criminal_cases: row.criminal_cases,
      convicted_cases: row.convicted_cases || 0, // Enhanced conviction status
      age: row.age,
      contact_email: row.contact_email,
      family_wealth: row.family_wealth, // Business interests
      knowledgeful: row.knowledgeful,
      consistent_winner: row.consistent_winner,
      serial_number: row.serial_number,
      politicalRelatives: row.political_relatives || 'None identified',
      partyHistory: row.party_history || 'No party switches in last 10 years',
      currentWealth: row.current_wealth,
      image: row.profile_image_url || row.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.name.replace(/\s+/g, '')}`,
      approvals: row.approvals,
      disapprovals: row.disapprovals,
      promises: parseInt(row.total_promises),
      completed: parseInt(row.completed) || 0,
      inProgress: parseInt(row.in_progress) || 0,
      broken: parseInt(row.broken) || 0,
      discussions: parseInt(row.discussions) || 0,
      lastUpdated: row.updated_at,
      profileDetails: {
        education: { value: row.education || 'N/A', sourceUrl: row.education_source || 'Database' },
        assets: { value: row.assets || 'N/A', sourceUrl: row.assets_source || 'Database' },
        liabilities: { value: row.liabilities || 'N/A', sourceUrl: row.liabilities_source || 'Database' },
        criminalCases: { value: parseInt(row.criminal_cases) || 0, sourceUrl: row.criminal_cases_source || 'Database' },
        convictedCases: { value: parseInt(row.convicted_cases) || 0, sourceUrl: row.convicted_cases_source || 'Database' },
        age: { value: row.age || 'N/A', sourceUrl: row.age_source || 'Database' },
        contactEmail: { value: row.contact_email || 'N/A', sourceUrl: row.contact_email_source || 'Database' },
        familyWealth: { value: row.family_wealth || 'N/A', sourceUrl: row.family_wealth_source || 'Database' },
        approvals: { value: parseInt(row.approvals) || 0, sourceUrl: 'Database' },
        disapprovals: { value: parseInt(row.disapprovals) || 0, sourceUrl: 'Database' }
      }
    }));

    res.json(officials);
  } catch (error) {
    console.error('Error fetching officials:', error);
    res.status(500).json({ error: 'Failed to fetch officials' });
  }
};

// Get single official by ID with standardized profile
exports.getOfficialById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Official not found' });
    }

    const official = result.rows[0];

    // Get promises count
    const promisesCount = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'broken') as broken,
        COUNT(*) as total
      FROM promises WHERE official_id = $1`,
      [id]
    );

    // Get discussion count
    const discussionCount = await pool.query(
  'SELECT COUNT(*) as count FROM forum WHERE official_id = $1',
      [id]
    );

    console.log(`📋 Loading profile for ${official.name} from database columns...`);

    // Format response using ONLY database fields (no OpenAI dependency)
    const response = {
      id: official.id,
      name: official.name,
      position: official.position,
      party: official.party,
      constituency: official.constituency,
      state: official.state,
      tenure: official.tenure,
      dynastyStatus: official.dynasty_status,
      education: official.education,
      assets: official.assets,
      liabilities: official.liabilities,
      criminal_cases: official.criminal_cases,
      convicted_cases: official.convicted_cases || 0, // Enhanced conviction status from MyNeta scraper
      age: official.age,
      contact_email: official.contact_email,
      family_wealth: official.family_wealth, // Business interests for frontend
      knowledgeful: official.knowledgeful,
      consistent_winner: official.consistent_winner,
      serial_number: official.serial_number,
      politicalRelatives: official.political_relatives || 'None identified', // From MyNeta scraper
      partyHistory: official.party_history || 'No party switches in last 10 years', // From database
      image: official.profile_image_url || official.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${official.name.replace(/\s+/g, '')}`,
      approvals: official.approvals,
      disapprovals: official.disapprovals,
      promises: parseInt(promisesCount.rows[0].total),
      completed: parseInt(promisesCount.rows[0].completed),
      inProgress: parseInt(promisesCount.rows[0].in_progress),
      broken: parseInt(promisesCount.rows[0].broken),
      discussions: parseInt(discussionCount.rows[0].count),
      
      // Profile Overview: Create structured data from database fields with actual source URLs
      profileOverview: {
        completeData: {
          education: { value: official.education || 'N/A', sourceUrl: official.education_source || 'Database' },
          assets: { value: official.assets || 'N/A', sourceUrl: official.assets_source || 'Database' },
          liabilities: { value: official.liabilities || 'N/A', sourceUrl: official.liabilities_source || 'Database' },
          criminalCases: { value: parseInt(official.criminal_cases) || 0, sourceUrl: official.criminal_cases_source || 'Database' },
          convictedCases: { value: parseInt(official.convicted_cases) || 0, sourceUrl: official.convicted_cases_source || 'Database' },
          dynastyStatus: { value: official.dynasty_status || 'N/A', sourceUrl: official.dynasty_status_source || 'Database' },
          party: { value: official.party || 'N/A', sourceUrl: official.party_source || 'Database' },
          constituency: { value: official.constituency || 'N/A', sourceUrl: official.constituency_source || 'Database' },
          position: { value: official.position || 'N/A', sourceUrl: official.position_source || 'Database' },
          age: { value: official.age || 'N/A', sourceUrl: official.age_source || 'Database' },
          politicalRelatives: { value: official.political_relatives || 'N/A', sourceUrl: official.political_relatives_source || 'Database' },
          familyWealth: { value: official.family_wealth || 'N/A', sourceUrl: official.family_wealth_source || 'Database' },
          approvals: { value: parseInt(official.approvals) || 0, sourceUrl: 'Database' },
          disapprovals: { value: parseInt(official.disapprovals) || 0, sourceUrl: 'Database' },
          convictedCases: { value: official.convicted_cases || '0', sourceUrl: official.convicted_cases_source || 'Database' }
        },
        analysis: {
          familyWealth: official.family_wealth || 'N/A'
        }
      },
      
      lastUpdated: official.updated_at
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching official:', error);
    res.status(500).json({ error: 'Failed to fetch official' });
  }
};

// Update official approval/disapproval
exports.updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'approve' or 'disapprove'

    const field = type === 'approve' ? 'approvals' : 'disapprovals';
    
    const result = await pool.query(
      `UPDATE officials SET ${field} = ${field} + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
};

// Create new official - automatically fetches profile using OpenAI scorecard template
exports.createOfficial = async (req, res) => {
  try {
    const { name, position, party, constituency, state, tenure, dynasty_status, image_url } = req.body;
    
    console.log(`\n📝 Creating new official: ${name}`);
    
    // Step 1: Insert basic record
    const result = await pool.query(
      `INSERT INTO officials (name, position, party, constituency, state, tenure, dynasty_status, image_url, approvals, disapprovals)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, position, party, constituency, state, tenure, dynasty_status, image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`, 0, 0]
    );

    const official = result.rows[0];
    console.log(`✅ Official created with ID: ${official.id}`);
    console.log(`📋 Profile data should be populated using MyNeta scraper and json-DBconv.js`);

    res.status(201).json(official);
  } catch (error) {
    console.error('Error creating official:', error);
    res.status(500).json({ error: 'Failed to create official' });
  }
};
