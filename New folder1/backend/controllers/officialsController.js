const pool = require('../config/database');
const openaiService = require('../services/openaiService');

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
      LEFT JOIN forum_comments f ON o.id = f.official_id
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
    
    // Format response to match frontend expectations
    const officials = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      position: `${row.position} - ${row.constituency}`,
      party: row.party,
      constituency: row.constituency,
      tenure: row.tenure,
      dynastyStatus: row.dynasty_status,
      currentWealth: row.current_wealth,
      knowledgeful: row.knowledgeful,
      image: row.profile_image_url || row.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.name.replace(/\s+/g, '')}`,
      approvals: row.approvals,
      disapprovals: row.disapprovals,
      promises: parseInt(row.total_promises),
      completed: parseInt(row.completed) || 0,
      inProgress: parseInt(row.in_progress) || 0,
      broken: parseInt(row.broken) || 0,
      discussions: parseInt(row.discussions) || 0,
      lastUpdated: row.updated_at,
      profileDetails: row.profile_data ? {
        education: row.profile_data.education || { value: row.education || 'N/A', sourceUrl: '#' },
        assets: row.profile_data.assetsFinancials?.totalAssets || { value: row.assets || 'N/A', sourceUrl: '#' },
        liabilities: row.profile_data.assetsFinancials?.liabilities || { value: row.liabilities || 'N/A', sourceUrl: '#' },
        criminalCases: row.profile_data.criminalCases?.totalCases || { value: row.criminal_cases || '0 Cases', sourceUrl: '#' },
        age: row.profile_data.personalBackground?.age || { value: row.age || 'N/A', sourceUrl: '#' },
        contactEmail: { value: row.contact_email || 'N/A', sourceUrl: '#' }
      } : {
        education: { value: row.education || 'N/A', sourceUrl: '#' },
        assets: { value: row.assets || 'N/A', sourceUrl: '#' },
        liabilities: { value: row.liabilities || 'N/A', sourceUrl: '#' },
        criminalCases: { value: row.criminal_cases || '0 Cases', sourceUrl: '#' },
        age: { value: row.age || 'N/A', sourceUrl: '#' },
        contactEmail: { value: row.contact_email || 'N/A', sourceUrl: '#' }
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
      'SELECT COUNT(*) as count FROM forum_comments WHERE official_id = $1',
      [id]
    );

    // Get profile data from database
    let profileData = official.profile_data;
    
    // If profile data doesn't exist, fetch it once and store permanently
    if (!profileData) {
      try {
        console.log(`🔍 Fetching profile for ${official.name} using OpenAI...`);
        const profile = await openaiService.fetchProfile(
          official.name,
          official.state || 'Andhra Pradesh'
        );
        
        if (profile) {
          profileData = profile;
          
          // Store the profile data permanently in database
          await pool.query(
            `UPDATE officials SET 
              profile_data = $1,
              profile_updated_at = CURRENT_TIMESTAMP
            WHERE id = $2`,
            [JSON.stringify(profileData), id]
          );
          
          console.log(`✅ Profile data stored permanently for ${official.name}`);
        }
      } catch (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        profileData = null;
      }
    }

    // Format response using standardized profile structure
    const response = {
      id: official.id,
      name: official.name,
      position: official.position,
      party: profileData?.currentOfficeParty?.party?.value || profileData?.currentOfficeParty?.party || official.party,
      constituency: profileData?.currentOfficeParty?.constituency?.value || profileData?.currentOfficeParty?.constituency || official.constituency,
      tenure: official.tenure,
      dynastyStatus: profileData?.politicalBackground?.dynastyStatus?.value || profileData?.politicalBackground?.dynastyStatus || official.dynasty_status,
      politicalRelatives: official.political_relatives || 'None identified', // Add political relatives from database
      partyHistory: official.party_history || 'No party switches in last 10 years', // Add party history from database
      image: official.profile_image_url || official.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${official.name.replace(/\s+/g, '')}`,
      approvals: official.approvals,
      disapprovals: official.disapprovals,
      promises: parseInt(promisesCount.rows[0].total),
      completed: parseInt(promisesCount.rows[0].completed),
      inProgress: parseInt(promisesCount.rows[0].in_progress),
      broken: parseInt(promisesCount.rows[0].broken),
      discussions: parseInt(discussionCount.rows[0].count),
      
      // Standardized Profile Overview - Return profile_data directly since it already has correct structure
      profileOverview: profileData || {},
      
      lastUpdated: official.updated_at,
      profileLastFetched: official.profile_updated_at
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

    // Step 2: Auto-fetch profile data using OpenAI with scorecard template (don't wait for it)
    setImmediate(async () => {
      try {
        console.log(`🤖 Auto-fetching profile data using OpenAI scorecard template...`);
        
        const profileData = await openaiService.fetchProfile(
          name,
          state || 'India'
        );
        
        if (profileData) {
          // Store profile data in database
          await pool.query(
            `UPDATE officials SET 
              profile_data = $1,
              profile_updated_at = CURRENT_TIMESTAMP,
              education = $2,
              assets = $3,
              liabilities = $4,
              criminal_cases = $5
            WHERE id = $6`,
            [
              JSON.stringify(profileData),
              profileData.education?.value || 'To be updated',
              profileData.assetsFinancials?.totalAssets?.value || 'To be updated',
              profileData.assetsFinancials?.liabilities?.value || 'To be updated',
              profileData.criminalCases?.totalCases?.value || 'To be updated',
              official.id
            ]
          );
          
          console.log(`✅ Profile data fetched and stored for ${name}`);
        } else {
          console.log(`⚠️  Could not fetch profile data`);
        }
      } catch (profileError) {
        console.error('⚠️  Error auto-fetching profile:', profileError.message);
      }
    });

    res.status(201).json(official);
  } catch (error) {
    console.error('Error creating official:', error);
    res.status(500).json({ error: 'Failed to create official' });
  }
};
