const pool = require('./config/database');

async function showProfileData() {
  try {
    console.log('🔍 QUERYING DATABASE\n');
    console.log('='.repeat(80));
    console.log('Database: social_record_platform_postgress_db');
    console.log('Host: dpg-d3t3ubm3jp1c73a7l3cg-a.oregon-postgres.render.com');
    console.log('Table: officials');
    console.log('='.repeat(80));
    
    // Query for ID 6
    console.log('\n📋 SQL Query: SELECT id, name, profile_data FROM officials WHERE id = 6;\n');
    
    const result = await pool.query('SELECT id, name, profile_data FROM officials WHERE id = 6');
    
    if (result.rows.length === 0) {
      console.log('❌ No record found with ID 6');
      return;
    }
    
    const row = result.rows[0];
    
    console.log('✅ RESULT:\n');
    console.log(`ID: ${row.id}`);
    console.log(`Name: ${row.name}`);
    console.log(`\nProfile Data (JSON):`);
    console.log(JSON.stringify(row.profile_data, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 HOW TO ACCESS THIS DATA:');
    console.log('\n1. Using psql command line:');
    console.log('   psql "postgresql://social_record_platform_postgress_db_user:vnSeQUBC2HhSAJOqbU3mhyDyKIxZtIQc@dpg-d3t3ubm3jp1c73a7l3cg-a.oregon-postgres.render.com/social_record_platform_postgress_db"');
    console.log('\n2. Then run:');
    console.log('   SELECT id, name, profile_data FROM officials WHERE id = 6;');
    console.log('\n3. Or use pgAdmin/DBeaver with these credentials:');
    console.log('   Host: dpg-d3t3ubm3jp1c73a7l3cg-a.oregon-postgres.render.com');
    console.log('   Port: 5432');
    console.log('   Database: social_record_platform_postgress_db');
    console.log('   User: social_record_platform_postgress_db_user');
    console.log('   Password: vnSeQUBC2HhSAJOqbU3mhyDyKIxZtIQc');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

showProfileData();
