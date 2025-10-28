require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateJaganRelatives() {
  console.log('\n🔄 Updating YS Jagan Mohan Reddy - Political Relatives (Simple Format)\n');

  // Simple format: Name - Personal Relation - Political Position - Party (Year)
  const politicalRelatives = `Y. S. Rajasekhara Reddy - Father - Former Chief Minister of Andhra Pradesh - INC (Deceased 2009), Y. S. Vijayamma - Mother - Former Honorary President - YSR Congress Party (Founded 2011), Y. S. Sharmila - Sister - Founder and President - YSR Telangana Party (Founded 2021), Y. S. Anil Kumar - Brother-in-law - Politician - YSR Congress Party, Y. S. Vivekananda Reddy - Uncle - Former Minister and MP - INC (Deceased 2019), Y. S. Avinash Reddy - Cousin - Member of Parliament - YSR Congress Party (Since 2014)`;

  try {
    const result = await pool.query(
      `UPDATE officials 
       SET political_relatives = $1,
           updated_at = NOW()
       WHERE LOWER(name) LIKE '%jagan%' OR LOWER(name) LIKE '%y.s. jagan%' OR LOWER(name) LIKE '%ys jagan%'
       RETURNING id, name`,
      [politicalRelatives]
    );

    if (result.rows.length > 0) {
      console.log('✅ Updated YS Jagan Mohan Reddy');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Name: ${result.rows[0].name}\n`);
      
      console.log('📋 Political Relatives (Simple Format):');
      const relatives = politicalRelatives.split(', ');
      relatives.forEach((rel, idx) => {
        const parts = rel.split(' - ');
        console.log(`   ${idx + 1}. ${parts[0]}`);
        console.log(`      Relation: ${parts[1]}`);
        console.log(`      Position: ${parts[2]}`);
        if (parts[3]) {
          console.log(`      Party: ${parts[3]}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ YS Jagan Mohan Reddy not found in database');
    }

  } catch (error) {
    console.error('❌ Error updating:', error.message);
  } finally {
    await pool.end();
  }
}

updateJaganRelatives();
