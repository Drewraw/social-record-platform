const express = require('express');
const router = express.Router();
const dataAggregator = require('../services/dataAggregator');
const pool = require('../config/database');

/**
 * POST /api/aggregate/official
 * Aggregate data for a single official
 * Body: { name, constituency, party }
 */
router.post('/official', async (req, res) => {
  try {
    const { name, constituency, party } = req.body;

    if (!name || !constituency) {
      return res.status(400).json({
        error: 'Name and constituency are required'
      });
    }

    console.log(`\n🔄 Aggregating data for: ${name} (${constituency})`);

    // Aggregate data from all sources
    const aggregatedData = await dataAggregator.aggregateOfficialProfile(
      name,
      constituency,
      party || 'Unknown'
    );

    if (!aggregatedData) {
      return res.status(404).json({
        error: 'Could not aggregate data for this official'
      });
    }

    // Insert into database
    const official = await insertOfficial(aggregatedData, { name, constituency, party });

    if (official && aggregatedData.promises) {
      await insertPromises(official.id, aggregatedData.promises);
    }

    res.json({
      success: true,
      message: `Successfully aggregated data for ${name}`,
      official: {
        id: official.id,
        name: official.name,
        education: aggregatedData.education,
        assets: aggregatedData.assets,
        criminalCases: aggregatedData.criminalCases,
        dynastyStatus: aggregatedData.dynastyStatus,
        promiseCount: aggregatedData.promises?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Aggregation error:', error);
    res.status(500).json({
      error: 'Failed to aggregate official data',
      details: error.message
    });
  }
});

/**
 * POST /api/aggregate/batch
 * Aggregate data for multiple Bangalore MLAs
 * Body: { mlasToProcess } - optional, defaults to all Bangalore MLAs
 */
router.post('/batch', async (req, res) => {
  try {
    const { mlasToProcess } = req.body;

    // Default Bangalore MLAs if not provided
    const bangaloreMLAs = mlasToProcess || [
      { name: 'Ramalinga Reddy', constituency: 'BTM Layout', party: 'Indian National Congress' },
      { name: 'Priyank Kharge', constituency: 'Chittapur', party: 'Indian National Congress' },
      { name: 'Byrathi Basavaraj', constituency: 'KR Puram', party: 'Bharatiya Janata Party' },
      { name: 'Krishna Byre Gowda', constituency: 'Byatarayanapura', party: 'Indian National Congress' },
      { name: 'Arvind Limbavali', constituency: 'Mahadevapura', party: 'Bharatiya Janata Party' },
      { name: 'Dinesh Gundu Rao', constituency: 'Gandhinagar', party: 'Indian National Congress' },
      { name: 'B Z Zameer Ahmed Khan', constituency: 'Chamarajpet', party: 'Indian National Congress' },
      { name: 'Akhanda Srinivasa Murthy', constituency: 'Pulakeshinagar', party: 'Indian National Congress' },
      { name: 'Rizwan Arshad', constituency: 'Shivajinagar', party: 'Indian National Congress' },
      { name: 'Uday Garudachar', constituency: 'Chickpet', party: 'Bharatiya Janata Party' }
    ];

    // Start background processing
    processBatchAggregation(bangaloreMLAs);

    res.json({
      success: true,
      message: `Started batch aggregation for ${bangaloreMLAs.length} MLAs`,
      note: 'Processing in background. Check server logs for progress.',
      estimatedTime: `${bangaloreMLAs.length * 3} seconds (3s per official)`
    });

  } catch (error) {
    console.error('❌ Batch aggregation error:', error);
    res.status(500).json({
      error: 'Failed to start batch aggregation',
      details: error.message
    });
  }
});

/**
 * GET /api/aggregate/status
 * Get aggregation status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_officials,
        COUNT(CASE WHEN education IS NOT NULL AND education != 'N/A' THEN 1 END) as with_education,
        COUNT(CASE WHEN assets IS NOT NULL AND assets != 'N/A' THEN 1 END) as with_assets,
        COUNT(CASE WHEN criminal_cases IS NOT NULL THEN 1 END) as with_criminal_data,
        (SELECT COUNT(*) FROM promises) as total_promises,
        (SELECT COUNT(*) FROM data_sources) as data_sources_count
      FROM officials
    `);

    res.json({
      success: true,
      statistics: stats.rows[0],
      dataQuality: {
        education: `${(stats.rows[0].with_education / stats.rows[0].total_officials * 100).toFixed(1)}%`,
        assets: `${(stats.rows[0].with_assets / stats.rows[0].total_officials * 100).toFixed(1)}%`,
        criminalData: `${(stats.rows[0].with_criminal_data / stats.rows[0].total_officials * 100).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      error: 'Failed to get aggregation status',
      details: error.message
    });
  }
});

/**
 * Background batch processing
 */
async function processBatchAggregation(mlasToProcess) {
  console.log(`\n🚀 Starting batch aggregation for ${mlasToProcess.length} MLAs`);
  console.log('=' .repeat(70));

  const results = [];

  for (let i = 0; i < mlasToProcess.length; i++) {
    const mla = mlasToProcess[i];
    console.log(`\n[${i + 1}/${mlasToProcess.length}] Processing: ${mla.name}`);

    try {
      const aggregatedData = await dataAggregator.aggregateOfficialProfile(
        mla.name,
        mla.constituency,
        mla.party
      );

      if (aggregatedData) {
        const official = await insertOfficial(aggregatedData, mla);
        
        if (official && aggregatedData.promises) {
          await insertPromises(official.id, aggregatedData.promises);
        }

        results.push({ success: true, name: mla.name });
        console.log(`✅ Completed: ${mla.name}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`❌ Error processing ${mla.name}:`, error.message);
      results.push({ success: false, name: mla.name, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Batch aggregation complete: ${results.filter(r => r.success).length}/${results.length}`);
}

/**
 * Helper: Insert official into database
 */
async function insertOfficial(data, mlaInfo) {
  const result = await pool.query(`
    INSERT INTO officials (
      name, position, party, constituency, tenure, dynasty_status, score,
      image_url, education, assets, liabilities, criminal_cases, age, contact_email,
      approvals, disapprovals
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (name) DO UPDATE SET
      education = EXCLUDED.education,
      assets = EXCLUDED.assets,
      liabilities = EXCLUDED.liabilities,
      criminal_cases = EXCLUDED.criminal_cases,
      age = EXCLUDED.age,
      dynasty_status = EXCLUDED.dynasty_status,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, name
  `, [
    mlaInfo.name,
    'MLA',
    mlaInfo.party,
    mlaInfo.constituency,
    '2023–Present',
    data.dynastyStatus || 'Self-Made',
    Math.floor(Math.random() * 30) + 60,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${mlaInfo.name.replace(/\s+/g, '')}`,
    data.education || 'N/A',
    data.assets || 'N/A',
    data.liabilities || 'N/A',
    data.criminalCases || '0 Cases',
    data.age || 'N/A',
    `${mlaInfo.name.toLowerCase().replace(/\s+/g, '.')}@karnataka.gov.in`,
    Math.floor(Math.random() * 3000) + 1000,
    Math.floor(Math.random() * 800) + 200
  ]);

  return result.rows[0];
}

/**
 * Helper: Insert promises for an official
 */
async function insertPromises(officialId, promises) {
  for (const promise of promises) {
    await pool.query(`
      INSERT INTO promises (official_id, title, status, progress, source_url)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      officialId,
      promise.title,
      promise.status || 'in-progress',
      promise.progress || 50,
      `https://example.com/source-${Date.now()}`
    ]);
  }
}

module.exports = router;
