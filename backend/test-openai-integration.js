const pool = require('./config/database');

async function testOpenAIIntegration() {
  try {
    console.log('🧪 Testing OpenAI Integration in Officials Controller\n');
    
    // Insert a test politician without profile data
    const result = await pool.query(
      `INSERT INTO officials (
        name, 
        position, 
        party, 
        constituency, 
        state,
        tenure, 
        dynasty_status,
        education,
        assets,
        liabilities,
        criminal_cases,
        image_url,
        score,
        approvals,
        disapprovals,
        profile_data,
        profile_updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, name`,
      [
        'Pawan Kalyan',
        'Deputy Chief Minister',
        'Jana Sena Party',
        'Pithapuram',
        'Andhra Pradesh',
        '2024-Present',
        'Non-dynastic',
        'Bachelor of Engineering',
        'To be fetched',
        'To be fetched',
        'To be fetched',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Pawan_Kalyan_at_JanaSena_Party_office.jpg/330px-Pawan_Kalyan_at_JanaSena_Party_office.jpg',
        80,
        500,
        100,
        null, // No profile data - will trigger OpenAI fetch
        null
      ]
    );

    const officialId = result.rows[0].id;
    console.log(`✅ Created test official: ${result.rows[0].name}`);
    console.log(`   ID: ${officialId}\n`);

    // Now test the API endpoint
    console.log('📡 Testing API endpoint to trigger OpenAI fetch...');
    console.log(`   URL: http://localhost:5001/api/officials/${officialId}\n`);
    console.log('🔄 Make a request to this URL to see OpenAI fetch the profile data');
    console.log('   Use: curl http://localhost:5001/api/officials/' + officialId);
    console.log('\n✨ Test official created! The API will fetch profile data from OpenAI on first request.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testOpenAIIntegration();
