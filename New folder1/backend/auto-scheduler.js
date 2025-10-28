require('dotenv').config();
const pool = require('./config/database');
const { enrichOfficialFromScheduler } = require('./unified-enrichment-module');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuration
const CONFIG = {
  CHECK_INTERVAL_MS: 24 * 60 * 60 * 1000, // Check every 24 hours
  BATCH_SIZE: 10, // Process 10 new officials at a time
  ENRICHMENT_DELAY_MS: 5000, // 5 second delay between enrichments
  MIN_FIELDS_REQUIRED: 5 // Minimum fields that should be filled
};

let processing = false;

// ==================== DUPLICATE DETECTION & REMOVAL ====================

async function removeDuplicateOfficials() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 CHECKING FOR DUPLICATE OFFICIALS');
  console.log('='.repeat(80));
  
  try {
    // Find duplicates based on name (case-insensitive)
    const duplicatesQuery = await pool.query(`
      SELECT 
        LOWER(TRIM(name)) as normalized_name,
        array_agg(name ORDER BY created_at ASC) as names,
        array_agg(id ORDER BY created_at ASC) as ids,
        array_agg(created_at ORDER BY created_at ASC) as created_dates,
        COUNT(*) as count
      FROM officials
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
    `);
    
    if (duplicatesQuery.rows.length === 0) {
      console.log('✅ No duplicate officials found');
      return 0;
    }
    
    console.log(`⚠️  Found ${duplicatesQuery.rows.length} duplicate name(s):\n`);
    
    let totalDeleted = 0;
    
    for (const duplicate of duplicatesQuery.rows) {
      const ids = duplicate.ids;
      const dates = duplicate.created_dates;
      const names = duplicate.names;
      const newestId = ids[ids.length - 1]; // Keep the newest (last created)
      const duplicateIds = ids.slice(0, -1); // Delete older ones
      
      console.log(`📋 Duplicate: ${names[0]}`);
      console.log(`   Total occurrences: ${duplicate.count}`);
      console.log(`   Keeping newest: ID ${newestId} (created ${new Date(dates[dates.length - 1]).toLocaleString()})`);
      console.log(`   Deleting older copies:`);
      
      for (let i = 0; i < duplicateIds.length; i++) {
        console.log(`      ❌ ID ${duplicateIds[i]} (created ${new Date(dates[i + 1]).toLocaleString()})`);
      }
      
      // Delete the duplicate entries (newer ones)
      const deleteResult = await pool.query(
        'DELETE FROM officials WHERE id = ANY($1) RETURNING id, name',
        [duplicateIds]
      );
      
      totalDeleted += deleteResult.rows.length;
      
      console.log(`   ✅ Deleted ${deleteResult.rows.length} duplicate(s)\n`);
    }
    
    console.log('='.repeat(80));
    console.log(`✅ Duplicate cleanup complete: ${totalDeleted} official(s) removed`);
    console.log('='.repeat(80) + '\n');
    
    return totalDeleted;
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error.message);
    return 0;
  }
}

// ==================== HELPER FUNCTIONS ====================

function isPlaceholder(value) {
  if (!value) return true;
  const placeholders = ['To be updated', 'N/A', 'Unknown', 'null', ''];
  return placeholders.includes(value.trim());
}

function needsEnrichment(official) {
  const checks = {
    education: !isPlaceholder(official.education),
    age: !isPlaceholder(official.age),
    assets: !isPlaceholder(official.assets),
    liabilities: !isPlaceholder(official.liabilities),
    criminal_cases: official.criminal_cases !== null && official.criminal_cases !== '',
    dynasty_status: !isPlaceholder(official.dynasty_status),
    image_url: official.image_url && !official.image_url.includes('dicebear')
  };
  
  const filledFields = Object.values(checks).filter(v => v).length;
  return filledFields < CONFIG.MIN_FIELDS_REQUIRED;
}

// ==================== ENRICHMENT ====================

async function enrichOfficial(official) {
  // Use the unified enrichment module
  return await enrichOfficialFromScheduler(official);
}

// ==================== MAIN SCHEDULER LOGIC ====================

async function checkForNewOfficials() {
  if (processing) {
    console.log('⏳ Still processing previous batch...');
    return;
  }
  
  try {
    processing = true;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🕐 SCHEDULER RUN - ${new Date().toLocaleString()}`);
    console.log('='.repeat(80) + '\n');
    
    // STEP 1: Remove duplicates first
    await removeDuplicateOfficials();
    
    // STEP 2: Get all officials that need enrichment (regardless of when they were added)
    const result = await pool.query(`
      SELECT 
        id, serial_number, name, position, party, constituency,
        education, age, assets, liabilities, criminal_cases,
        dynasty_status, political_relatives, image_url,
        created_at
      FROM officials 
      ORDER BY id ASC
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ No officials in database');
      processing = false;
      return;
    }
    
    console.log(`📊 Total Officials in Database: ${result.rows.length}`);
    
    // Filter officials that need enrichment
    const officialsNeedingEnrichment = result.rows.filter(official => needsEnrichment(official));
    
    if (officialsNeedingEnrichment.length === 0) {
      console.log('✅ All officials are fully enriched - no action needed\n');
      processing = false;
      return;
    }
    
    console.log(`⚠️  Found ${officialsNeedingEnrichment.length} official(s) needing enrichment`);
    console.log('='.repeat(80));
    
    // Process up to BATCH_SIZE officials
    const toProcess = officialsNeedingEnrichment.slice(0, CONFIG.BATCH_SIZE);
    
    for (const official of toProcess) {
      console.log(`\n📋 Processing: ${official.name} (ID: ${official.id}, Serial: ${official.serial_number})`);
      console.log(`   ⚠️  Missing data - starting enrichment...`);
      
      const success = await enrichOfficial(official);
      
      if (success) {
        console.log(`   ✅ Enrichment completed for ${official.name}`);
      } else {
        console.log(`   ❌ Enrichment failed for ${official.name}`);
      }
      
      // Delay between enrichments
      if (toProcess.indexOf(official) < toProcess.length - 1) {
        console.log(`   ⏳ Waiting ${CONFIG.ENRICHMENT_DELAY_MS/1000} seconds before next enrichment...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.ENRICHMENT_DELAY_MS));
      }
    }
    
    const remaining = officialsNeedingEnrichment.length - toProcess.length;
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Batch processing complete`);
    console.log(`   Processed: ${toProcess.length} official(s)`);
    if (remaining > 0) {
      console.log(`   Remaining: ${remaining} official(s) will be processed in next run`);
    }
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Scheduler error:', error.message);
  } finally {
    processing = false;
  }
}

async function startScheduler() {
  console.log('\n🤖 AUTO-SCHEDULER STARTED');
  console.log('='.repeat(80));
  console.log(`⚙️  Configuration:`);
  console.log(`   - Check interval: Every 24 hours`);
  console.log(`   - Batch size: ${CONFIG.BATCH_SIZE} officials per run`);
  console.log(`   - Enrichment delay: ${CONFIG.ENRICHMENT_DELAY_MS/1000} seconds`);
  console.log(`   - Min fields required: ${CONFIG.MIN_FIELDS_REQUIRED}`);
  console.log(`   - Duplicate detection: Enabled (keeps oldest)`);
  console.log('='.repeat(80) + '\n');
  
  console.log(`🔄 Next run in 24 hours at: ${new Date(Date.now() + CONFIG.CHECK_INTERVAL_MS).toLocaleString()}\n`);
  
  // Run initial check immediately
  await checkForNewOfficials();
  
  // Set up 24-hour interval
  setInterval(checkForNewOfficials, CONFIG.CHECK_INTERVAL_MS);
  
  console.log(`\n✅ Scheduler is now running. Next automatic check in 24 hours.`);
  console.log(`💡 Press Ctrl+C to stop\n`);
}

// ==================== STARTUP ====================

startScheduler().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Scheduler stopping...');
  pool.end();
  process.exit(0);
});
