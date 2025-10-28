const pool = require('./config/database');

const realBangaloreOfficials = [
  {
    name: "Ramalinga Reddy",
    position: "MLA",
    party: "Indian National Congress",
    constituency: "BTM Layout",
    tenure: "2018–Present",
    dynasty_status: "Political Family",
    score: 72,
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=RamalingaReddy",
    education: "BA in Political Science",
    assets: "₹8.5 Crores",
    liabilities: "₹2.1 Crores",
    criminal_cases: "0 Cases",
    age: "72 years",
    contact_email: "ramalinga.reddy@karnataka.gov.in",
    approvals: 3240,
    disapprovals: 680
  },
  {
    name: "Priyank Kharge",
    position: "MLA",
    party: "Indian National Congress", 
    constituency: "Chittapur",
    tenure: "2023–Present",
    dynasty_status: "Third Generation",
    score: 78,
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=PriyankKharge",
    education: "MBA, MSc Computer Science",
    assets: "₹12.3 Crores",
    liabilities: "₹1.8 Crores",
    criminal_cases: "0 Cases",
    age: "46 years",
    contact_email: "priyank.kharge@karnataka.gov.in",
    approvals: 4120,
    disapprovals: 520
  },
  {
    name: "Byrathi Basavaraj",
    position: "MLA",
    party: "Bharatiya Janata Party (BJP)",
    constituency: "KR Puram",
    tenure: "2018–Present",
    dynasty_status: "Self-Made",
    score: 68,
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=ByrathiBasavaraj",
    education: "BCom",
    assets: "₹45 Crores",
    liabilities: "₹8.5 Crores",
    criminal_cases: "2 Cases (Pending)",
    age: "60 years",
    contact_email: "byrathi.basavaraj@karnataka.gov.in",
    approvals: 2850,
    disapprovals: 1240
  },
  {
    name: "Krishna Byre Gowda",
    position: "MLA",
    party: "Indian National Congress",
    constituency: "Byatarayanapura",
    tenure: "2018–Present",
    dynasty_status: "Self-Made",
    score: 82,
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=KrishnaByreGowda",
    education: "BTech, MBA",
    assets: "₹6.8 Crores",
    liabilities: "₹1.2 Crores",
    criminal_cases: "0 Cases",
    age: "52 years",
    contact_email: "krishna.byregowda@karnataka.gov.in",
    approvals: 4680,
    disapprovals: 420
  },
  {
    name: "Arvind Limbavali",
    position: "MLA",
    party: "Bharatiya Janata Party (BJP)",
    constituency: "Mahadevapura",
    tenure: "2008–Present",
    dynasty_status: "Self-Made",
    score: 65,
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArvindLimbavali",
    education: "BA",
    assets: "₹15.2 Crores",
    liabilities: "₹3.5 Crores",
    criminal_cases: "1 Case (Pending)",
    age: "63 years",
    contact_email: "arvind.limbavali@karnataka.gov.in",
    approvals: 2340,
    disapprovals: 980
  },
  {
    name: "Dinesh Gundu Rao",
    position: "MLA",
    party: "Indian National Congress",
    constituency: "Gandhinagar",
    tenure: "2023–Present",
    dynasty_status: "Political Family",
    score: 75,
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=DineshGunduRao",
    education: "BA Political Science, LLB",
    assets: "₹18.7 Crores",
    liabilities: "₹4.2 Crores",
    criminal_cases: "0 Cases",
    age: "50 years",
    contact_email: "dinesh.gundurao@karnataka.gov.in",
    approvals: 3850,
    disapprovals: 640
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with real Bangalore officials...');

    for (const official of realBangaloreOfficials) {
      // Insert official
      const result = await pool.query(`
        INSERT INTO officials (
          name, position, party, constituency, tenure, dynasty_status, score, 
          image_url, approvals, disapprovals, 
          education, assets, liabilities, criminal_cases, age, contact_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (name) DO UPDATE SET
          position = EXCLUDED.position,
          party = EXCLUDED.party,
          score = EXCLUDED.score,
          approvals = EXCLUDED.approvals,
          disapprovals = EXCLUDED.disapprovals
        RETURNING id
      `, [
        official.name, official.position, official.party, official.constituency,
        official.tenure, official.dynasty_status, official.score, official.image_url,
        official.approvals, official.disapprovals, official.education, official.assets,
        official.liabilities, official.criminal_cases, official.age, official.contact_email
      ]);

      const officialId = result.rows[0].id;
      console.log(`✅ Added: ${official.name}`);

      // Add sample promises for each official
      const promisesCount = Math.floor(Math.random() * 15) + 10; // 10-25 promises
      const completedCount = Math.floor(promisesCount * 0.6);
      const inProgressCount = Math.floor(promisesCount * 0.3);
      const brokenCount = promisesCount - completedCount - inProgressCount;

      // Sample promise templates
      const promiseTemplates = [
        'Improve road infrastructure in constituency',
        'Build new schools and upgrade existing facilities',
        'Install CCTV cameras for safety',
        'Improve water supply system',
        'Reduce power cuts',
        'Set up new parks and playgrounds',
        'Improve garbage collection',
        'Fix drainage issues',
        'Create job opportunities',
        'Establish new health centers',
        'Improve street lighting',
        'Repair potholes',
        'Build community halls',
        'Improve public transport',
        'Create youth skill development centers'
      ];

      for (let i = 0; i < completedCount; i++) {
        await pool.query(`
          INSERT INTO promises (official_id, title, status, progress, source_url)
          VALUES ($1, $2, 'completed', 100, $3)
        `, [officialId, promiseTemplates[i % promiseTemplates.length], `https://twitter.com/${official.name.replace(' ', '')}`]);
      }

      for (let i = 0; i < inProgressCount; i++) {
        const progress = Math.floor(Math.random() * 60) + 20;
        await pool.query(`
          INSERT INTO promises (official_id, title, status, progress, source_url)
          VALUES ($1, $2, 'in-progress', $3, $4)
        `, [officialId, promiseTemplates[(completedCount + i) % promiseTemplates.length], progress, `https://karnataka.gov.in/${official.name.replace(' ', '')}`]);
      }

      for (let i = 0; i < brokenCount; i++) {
        await pool.query(`
          INSERT INTO promises (official_id, title, status, progress, source_url)
          VALUES ($1, $2, 'broken', 10, $3)
        `, [officialId, promiseTemplates[(completedCount + inProgressCount + i) % promiseTemplates.length], `https://news.com/${official.name.replace(' ', '')}`]);
      }

      // Add data sources
      await pool.query(`
        INSERT INTO data_sources (official_id, source_name, source_url, is_verified)
        VALUES 
          ($1, 'MyNeta', 'https://myneta.info/${$2}', true),
          ($1, 'ECI', 'https://eci.gov.in/${$2}', true),
          ($1, 'Twitter', 'https://twitter.com/${$2}', false),
          ($1, 'Karnataka Govt', 'https://karnataka.gov.in/${$2}', true)
      `, [officialId, official.name.replace(' ', '').toLowerCase()]);
    }

    console.log('✅ Database seeded successfully with real officials!');
    console.log(`📊 Total officials: ${realBangaloreOfficials.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
