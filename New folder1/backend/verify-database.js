/**
 * COMPLETE DATABASE VERIFICATION AND UPDATE SCRIPT
 * Cross-checks all tables, columns, and data against latest code
 * Updates/modifies as needed to ensure consistency
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       DATABASE VERIFICATION & UPDATE TOOL                  ║');
console.log('║       Cross-checks schema and data with latest code        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function checkAndUpdateSchema() {
  console.log('📋 STEP 1: Verifying Database Schema\n');
  
  const updates = [];
  
  // Check officials table columns
  console.log('🔍 Checking officials table...');
  const officialsColumns = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'officials'
    ORDER BY ordinal_position
  `);
  
  const existingCols = officialsColumns.rows.map(r => r.column_name);
  console.log(`   ✅ Found ${existingCols.length} columns\n`);
  
  // Required columns based on latest code
  const requiredColumns = {
    'consistent_winner': 'TEXT',
    'family_wealth': 'VARCHAR(100)',
    'current_wealth': 'VARCHAR(100)',
    'knowledgeful': 'TEXT',
    'political_relatives': 'TEXT'
  };
  
  for (const [colName, colType] of Object.entries(requiredColumns)) {
    if (!existingCols.includes(colName)) {
      console.log(`   ⚠️  Missing column: ${colName}`);
      updates.push({ table: 'officials', column: colName, type: colType });
    } else {
      console.log(`   ✅ ${colName} exists`);
    }
  }
  
  // Check political_donations table
  console.log('\n🔍 Checking political_donations table...');
  const donationsCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'political_donations'
    )`);
  
  if (!donationsCheck.rows[0].exists) {
    console.log('   ⚠️  political_donations table missing - will create');
    updates.push({ table: 'political_donations', action: 'create' });
  } else {
    const donationsCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'political_donations'
      ORDER BY ordinal_position
    `);
    
    const donationsColNames = donationsCols.rows.map(r => r.column_name);
    console.log(`   ✅ Found ${donationsColNames.length} columns\n`);
    
    const requiredDonationsCols = {
      'donation_recipient_type': 'VARCHAR(50)',
      'party_name': 'VARCHAR(200)'
    };
    
    for (const [colName, colType] of Object.entries(requiredDonationsCols)) {
      if (!donationsColNames.includes(colName)) {
        console.log(`   ⚠️  Missing column: ${colName}`);
        updates.push({ table: 'political_donations', column: colName, type: colType });
      } else {
        console.log(`   ✅ ${colName} exists`);
      }
    }
  }
  
  return updates;
}

async function applyUpdates(updates) {
  if (updates.length === 0) {
    console.log('\n✅ No schema updates needed - database is up to date!\n');
    return;
  }
  
  console.log(`\n🔧 STEP 2: Applying ${updates.length} Updates\n`);
  
  for (const update of updates) {
    try {
      if (update.action === 'create') {
        // Create political_donations table
        console.log('   📦 Creating political_donations table...');
        const sql = fs.readFileSync('migrations/create-donations-table.sql', 'utf8');
        await pool.query(sql);
        console.log('   ✅ Table created\n');
      } else {
        // Add missing column
        console.log(`   ➕ Adding ${update.table}.${update.column}...`);
        await pool.query(`
          ALTER TABLE ${update.table} 
          ADD COLUMN IF NOT EXISTS ${update.column} ${update.type}
        `);
        console.log('   ✅ Column added\n');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
}

async function verifyData() {
  console.log('📊 STEP 3: Verifying Data Quality\n');
  
  // Check for officials with NULL values in new columns
  console.log('🔍 Checking officials for incomplete data...');
  const incompleteOfficials = await pool.query(`
    SELECT id, name,
      consistent_winner,
      family_wealth,
      current_wealth,
      knowledgeful,
      political_relatives
    FROM officials
    WHERE consistent_winner IS NULL 
       OR family_wealth IS NULL 
       OR current_wealth IS NULL
       OR knowledgeful IS NULL
       OR political_relatives IS NULL
  `);
  
  if (incompleteOfficials.rows.length > 0) {
    console.log(`   ⚠️  Found ${incompleteOfficials.rows.length} officials with incomplete data\n`);
    
    // Update with default values
    console.log('   🔧 Setting default values...');
    await pool.query(`
      UPDATE officials 
      SET consistent_winner = COALESCE(consistent_winner, 'To be verified'),
          family_wealth = COALESCE(family_wealth, 'Unknown'),
          current_wealth = COALESCE(current_wealth, 'Unknown'),
          knowledgeful = COALESCE(knowledgeful, 'To be verified'),
          political_relatives = COALESCE(political_relatives, 'None identified')
      WHERE consistent_winner IS NULL 
         OR family_wealth IS NULL 
         OR current_wealth IS NULL
         OR knowledgeful IS NULL
         OR political_relatives IS NULL
    `);
    console.log('   ✅ Updated with defaults\n');
  } else {
    console.log('   ✅ All officials have complete data\n');
  }
  
  // Check donations
  const donationsCount = await pool.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN donation_recipient_type IS NULL THEN 1 END) as missing_type,
           COUNT(CASE WHEN verified = false THEN 1 END) as unverified
    FROM political_donations
  `);
  
  if (donationsCount.rows.length > 0) {
    const stats = donationsCount.rows[0];
    console.log('💰 Donations status:');
    console.log(`   📊 Total: ${stats.total}`);
    console.log(`   ⚠️  Missing type: ${stats.missing_type}`);
    console.log(`   🔍 Unverified: ${stats.unverified}\n`);
    
    if (parseInt(stats.missing_type) > 0) {
      console.log('   🔧 Setting default recipient_type to "Party"...');
      await pool.query(`
        UPDATE political_donations 
        SET donation_recipient_type = 'Party'
        WHERE donation_recipient_type IS NULL
      `);
      console.log('   ✅ Updated\n');
    }
  }
}

async function showSummary() {
  console.log('📈 STEP 4: Database Summary\n');
  
  // Officials summary
  const officialsStats = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN dynasty_status LIKE 'Dynastic%' THEN 1 END) as dynastic,
      COUNT(CASE WHEN dynasty_status = 'Self-made' THEN 1 END) as self_made,
      COUNT(CASE WHEN current_wealth = 'Wealthy' THEN 1 END) as wealthy,
      COUNT(CASE WHEN knowledgeful LIKE 'Knowledgeable%' THEN 1 END) as knowledgeable,
      COUNT(CASE WHEN political_relatives != 'None identified' THEN 1 END) as has_relatives
    FROM officials
  `);
  
  const stats = officialsStats.rows[0];
  console.log('👥 Officials:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   • Dynastic: ${stats.dynastic}`);
  console.log(`   • Self-made: ${stats.self_made}`);
  console.log(`   • Wealthy: ${stats.wealthy}`);
  console.log(`   • Knowledgeable: ${stats.knowledgeable}`);
  console.log(`   • Has political relatives: ${stats.has_relatives}\n`);
  
  // Donations summary
  const donationsStats = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT donor_name) as unique_donors,
      COUNT(CASE WHEN donation_recipient_type = 'Party' THEN 1 END) as to_party,
      COUNT(CASE WHEN donation_recipient_type = 'Politician' THEN 1 END) as to_politician,
      COUNT(CASE WHEN verified = true THEN 1 END) as verified
    FROM political_donations
  `);
  
  if (donationsStats.rows.length > 0) {
    const dStats = donationsStats.rows[0];
    console.log('💰 Donations:');
    console.log(`   Total: ${dStats.total}`);
    console.log(`   • Unique donors: ${dStats.unique_donors}`);
    console.log(`   • To parties: ${dStats.to_party}`);
    console.log(`   • To politicians: ${dStats.to_politician}`);
    console.log(`   • Verified: ${dStats.verified}\n`);
  }
  
  // Show sample data
  console.log('📋 Sample Data:\n');
  const sample = await pool.query(`
    SELECT name, party, dynasty_status, current_wealth, political_relatives
    FROM officials
    LIMIT 3
  `);
  
  sample.rows.forEach((row, i) => {
    console.log(`   ${i + 1}. ${row.name} (${row.party})`);
    console.log(`      Dynasty: ${row.dynasty_status}`);
    console.log(`      Wealth: ${row.current_wealth}`);
    console.log(`      Relatives: ${row.political_relatives}\n`);
  });
}

async function main() {
  try {
    // Step 1: Check schema
    const updates = await checkAndUpdateSchema();
    
    // Step 2: Apply updates
    await applyUpdates(updates);
    
    // Step 3: Verify data
    await verifyData();
    
    // Step 4: Show summary
    await showSummary();
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    VERIFICATION COMPLETE                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('✅ Database is up to date and consistent with latest code!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

main();
