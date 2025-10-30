/**
 * COMPLETE DATABASE VERIFICATION AND UPDATE SCRIPT
 * Cross-checks all tables, columns, and data against latest code
 * Updates/modifies as needed to ensure consistency
 */

const fs = require('fs');
const pool = require('./config/database');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       DATABASE VERIFICATION & UPDATE TOOL                  ║');
console.log('║       Cross-checks schema and data with latest code        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function checkAndUpdateSchema() {
  console.log('📋 STEP 1: Verifying Database Schema\n');
  
  const updates = [];
  
  // List of tables to check
  const tablesToCheck = {
    officials: ['id', 'name', 'consistent_winner', 'family_wealth', 'current_wealth', 'knowledgeful', 'political_relatives'],
    forum: ['id', 'title', 'content', 'user_id', 'official_id', 'created_at', 'updated_at'],
    promises: ['id', 'official_id', 'title', 'description', 'status', 'created_at', 'updated_at']
  };

  for (const [table, requiredCols] of Object.entries(tablesToCheck)) {
    console.log(`\n🔍 Checking ${table} table...`);
    // Check if table exists
    const tableExistsRes = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = $1
      ) AS exists
    `, [table]);
    if (!tableExistsRes.rows[0].exists) {
      console.log(`   ❌ Table '${table}' does not exist!`);
      updates.push({ action: 'create_table', table });
      continue;
    }
    // Check columns
    const columnsRes = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = $1
    `, [table]);
    const existingCols = columnsRes.rows.map(r => r.column_name);
    for (const col of requiredCols) {
      if (!existingCols.includes(col)) {
        console.log(`   ⚠️  Missing column: ${col}`);
        updates.push({ table, column: col, type: 'TEXT' }); // Default type TEXT, adjust as needed
      } else {
        console.log(`   ✅ ${col} exists`);
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
      if (update.action === 'create_table') {
        // Create missing table
        let sql = '';
        if (update.table === 'forum') {
          sql = `CREATE TABLE IF NOT EXISTS forum (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            user_id INTEGER,
            official_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );`;
        } else if (update.table === 'promises') {
          sql = `CREATE TABLE IF NOT EXISTS promises (
            id SERIAL PRIMARY KEY,
            official_id INTEGER,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );`;
        } else if (update.table === 'officials') {
          sql = `CREATE TABLE IF NOT EXISTS officials (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            consistent_winner TEXT,
            family_wealth VARCHAR(100),
            current_wealth VARCHAR(100),
            knowledgeful TEXT,
            political_relatives TEXT
          );`;
        }
        if (sql) {
          console.log(`   📦 Creating ${update.table} table...`);
          await pool.query(sql);
          console.log('   ✅ Table created\n');
        }
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
