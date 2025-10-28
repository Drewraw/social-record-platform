const pool = require('../config/database');

/**
 * Get all donations for a specific politician
 * Groups by year and donor type with source information
 */
exports.getPoliticianDonations = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get politician info
    const politicianResult = await pool.query(
      'SELECT name, party FROM officials WHERE id = $1',
      [id]
    );
    
    if (politicianResult.rows.length === 0) {
      return res.status(404).json({ error: 'Politician not found' });
    }
    
    const politician = politicianResult.rows[0];
    
    // Get all donations with grouping
    const donationsResult = await pool.query(
      `SELECT 
        id,
        donor_name,
        donor_type,
        amount,
        currency,
        year,
        source_url,
        source_type,
        verified,
        notes,
        created_at
      FROM political_donations 
      WHERE politician_id = $1 
      ORDER BY year DESC NULLS LAST, amount DESC NULLS LAST`,
      [id]
    );
    
    // Group donations by year
    const donationsByYear = {};
    const allDonors = [];
    const sourceStats = {
      MyNeta: 0,
      OpenAI: 0,
      Wikipedia: 0,
      'Government Records': 0,
      'News Article': 0,
      Other: 0
    };
    
    let totalAmount = 0;
    let verifiedCount = 0;
    
    donationsResult.rows.forEach(donation => {
      const year = donation.year || 'Unknown';
      
      if (!donationsByYear[year]) {
        donationsByYear[year] = {
          year,
          total: 0,
          donations: [],
          byType: {
            'Private Company': [],
            'Public Company': [],
            'Individual': [],
            'Unknown': []
          }
        };
      }
      
      const amount = parseFloat(donation.amount) || 0;
      donationsByYear[year].total += amount;
      donationsByYear[year].donations.push(donation);
      donationsByYear[year].byType[donation.donor_type].push(donation);
      
      totalAmount += amount;
      if (donation.verified) verifiedCount++;
      if (sourceStats.hasOwnProperty(donation.source_type)) {
        sourceStats[donation.source_type]++;
      } else {
        sourceStats.Other++;
      }
      
      allDonors.push({
        name: donation.donor_name,
        type: donation.donor_type,
        amount: donation.amount,
        year: donation.year
      });
    });
    
    // Convert to array and sort
    const yearlyData = Object.values(donationsByYear);
    
    res.json({
      politician: {
        id: parseInt(id),
        name: politician.name,
        party: politician.party
      },
      summary: {
        totalDonations: donationsResult.rows.length,
        totalAmount,
        verifiedCount,
        yearsTracked: yearlyData.length,
        sources: sourceStats
      },
      donationsByYear: yearlyData,
      allDonors,
      lastUpdated: new Date()
    });
    
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations data' });
  }
};

/**
 * Get donations statistics across all politicians
 */
exports.getDonationsStats = async (req, res) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_donations,
        SUM(amount) as total_amount,
        COUNT(DISTINCT politician_id) as politicians_with_donations,
        COUNT(DISTINCT donor_name) as unique_donors,
        donor_type,
        COUNT(*) as count_by_type
      FROM political_donations
      GROUP BY donor_type
    `);
    
    res.json({
      stats: statsResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({ error: 'Failed to fetch donation statistics' });
  }
};

/**
 * Add a new donation record
 */
exports.addDonation = async (req, res) => {
  try {
    const { politician_id, donor_name, donor_type, amount, currency, year, source_url, source_type, verified, notes } = req.body;
    
    // Validate required fields
    if (!politician_id || !donor_name || !donor_type) {
      return res.status(400).json({ error: 'Missing required fields: politician_id, donor_name, donor_type' });
    }
    
    const result = await pool.query(
      `INSERT INTO political_donations 
        (politician_id, donor_name, donor_type, amount, currency, year, source_url, source_type, verified, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [politician_id, donor_name, donor_type, amount || null, currency || 'INR', year || null, source_url || null, source_type || 'Other', verified || false, notes || null]
    );
    
    res.status(201).json({
      message: 'Donation record added successfully',
      donation: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error adding donation:', error);
    res.status(500).json({ error: 'Failed to add donation record' });
  }
};

/**
 * Search donations by donor name
 */
exports.searchDonations = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const result = await pool.query(
      `SELECT 
        d.*,
        o.name as politician_name,
        o.party as politician_party
      FROM political_donations d
      JOIN officials o ON d.politician_id = o.id
      WHERE d.donor_name ILIKE $1
      ORDER BY d.year DESC, d.amount DESC`,
      [`%${query}%`]
    );
    
    res.json({
      query,
      results: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error searching donations:', error);
    res.status(500).json({ error: 'Failed to search donations' });
  }
};
