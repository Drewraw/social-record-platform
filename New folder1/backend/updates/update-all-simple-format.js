require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// All politicians data with simple format: Name - Personal Relation - Political Position - Party (Year)
const politiciansData = [
  {
    name: 'Nara Chandrababu Naidu',
    politicalRelatives: 'N.T. Rama Rao - Father-in-law - Former Chief Minister of Andhra Pradesh and TDP Founder - TDP (Founded 1982, Deceased 1996), Nara Lokesh - Son - Minister and MLC - TDP (Active since 2014), Nara Bhuvaneswari - Wife - Politician - TDP, Balakrishna - Brother-in-law - MLA and Actor - TDP (Active since 2014), Daggubati Purandeswari - Sister-in-law - Former Union Minister - BJP (Joined 2014)',
    partyHistory: 'Loyal to TDP since 1978 - No party switches in last 10 years'
  },
  {
    name: 'Pawan Kalyan',
    politicalRelatives: 'Chiranjeevi - Brother - Former Union Minister and Actor - INC (2008-2011), Jana Sena Party (Founded 2014), Nagendra Babu - Brother - Former MP and Actor - Jana Sena Party',
    partyHistory: 'Founded Jana Sena Party in 2014 - Formed alliance with BJP and TDP in 2024 - No party switches'
  },
  {
    name: 'Amit Shah',
    politicalRelatives: 'None identified - Self-made politician',
    partyHistory: 'Loyal to BJP since 1980s - No party switches in last 10 years'
  },
  {
    name: 'Rahul Gandhi',
    politicalRelatives: 'Rajiv Gandhi - Father - Former Prime Minister of India - INC (Deceased 1991), Sonia Gandhi - Mother - Former Congress President - INC (Active since 1998), Indira Gandhi - Grandmother - Former Prime Minister - INC (Deceased 1984), Jawaharlal Nehru - Great-grandfather - First Prime Minister of India - INC (Deceased 1964), Priyanka Gandhi Vadra - Sister - General Secretary and MP - INC (Active since 2019), Feroze Gandhi - Grandfather - Politician and Journalist - INC',
    partyHistory: 'Loyal to Indian National Congress since 2004 - No party switches in last 10 years'
  },
  {
    name: 'Anumula Revanth Reddy',
    politicalRelatives: 'Anumula Narasimha Reddy - Father - Former Politician - TDP',
    partyHistory: 'Started with TDP (2006-2017), Joined TRS briefly (2017), Joined INC in 2017 - Stable with Congress for 8 years'
  },
  {
    name: 'YS Jagan Mohan Reddy',
    politicalRelatives: 'Y. S. Rajasekhara Reddy - Father - Former Chief Minister of Andhra Pradesh - INC (Deceased 2009), Y. S. Vijayamma - Mother - Former Honorary President - YSR Congress Party (Founded 2011), Y. S. Sharmila - Sister - Founder and President - YSR Telangana Party (Founded 2021), Y. S. Anil Kumar - Brother-in-law - Politician - YSR Congress Party, Y. S. Vivekananda Reddy - Uncle - Former Minister and MP - INC (Deceased 2019), Y. S. Avinash Reddy - Cousin - Member of Parliament - YSR Congress Party (Since 2014)',
    partyHistory: 'Started with INC (2004-2010), Founded YSR Congress Party in 2011 - Loyal to YSRCP for 14 years'
  },
  {
    name: 'T.G. BHARATH',
    politicalRelatives: 'T.G. Venkatesh - Father - BJP Politician and Former Minister - BJP (Joined 2019 from TDP)',
    partyHistory: 'Started with TDP, Father switched to BJP in 2019 - Currently with YSRCP'
  }
];

async function updateAllPoliticians() {
  console.log('\n🔄 Updating ALL Politicians - Simple Format + Party History\n');
  console.log('=' .repeat(70));

  let updated = 0;
  let errors = 0;

  for (const politician of politiciansData) {
    try {
      const result = await pool.query(
        `UPDATE officials 
         SET political_relatives = $1,
             party_history = $2,
             updated_at = NOW()
         WHERE LOWER(name) LIKE LOWER($3)
         RETURNING id, name`,
        [politician.politicalRelatives, politician.partyHistory, `%${politician.name}%`]
      );

      if (result.rows.length > 0) {
        console.log(`\n✅ ${result.rows[0].name}`);
        console.log(`   ID: ${result.rows[0].id}`);
        
        // Display political relatives
        console.log('\n   📋 Political Relatives:');
        if (politician.politicalRelatives === 'None identified - Self-made politician') {
          console.log('      None identified - Self-made politician');
        } else {
          const relatives = politician.politicalRelatives.split(', ');
          relatives.forEach((rel, idx) => {
            const parts = rel.split(' - ');
            console.log(`      ${idx + 1}. ${parts[0]} (${parts[1]})`);
            if (parts[2]) console.log(`         Position: ${parts[2]}`);
            if (parts[3]) console.log(`         Party: ${parts[3]}`);
          });
        }
        
        // Display party history
        console.log(`\n   🏛️  Party History: ${politician.partyHistory}`);
        console.log('   ' + '-'.repeat(66));
        
        updated++;
      } else {
        console.log(`\n❌ Not found: ${politician.name}`);
        errors++;
      }

    } catch (error) {
      console.error(`\n❌ Error updating ${politician.name}:`, error.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📋 Total: ${politiciansData.length}`);
  console.log('');

  await pool.end();
}

updateAllPoliticians();
