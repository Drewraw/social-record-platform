const pool = require('./config/database');

async function updateChandrababuData() {
  try {
    console.log('📝 Updating Chandrababu Naidu with 2024 data...\n');
    
    const profile2024Data = {
      currentOfficeParty: {
        position: "Chief Minister of Andhra Pradesh (4th Term, since June 2024)",
        party: "Telugu Desam Party (TDP) - President",
        constituency: "Kuppam (Chittoor District)"
      },
      education: "Post Graduate (M.A. Economics, S.V.U. College, 1974)",
      assetsFinancials: {
        totalAssets: "₹931.83 Crore (~9.31 Billion INR)",
        sourceOfWealth: "Primarily held by spouse, Nara Bhuvaneswari (MD of Heritage Foods), mainly in Heritage Foods shares (valued at over ₹763 Crore in 2024).",
        liabilities: "₹10.38 Crore"
      },
      criminalCases: {
        totalCases: "19 Pending Cases (Declared in 2024 Affidavit)",
        seriousCharges: "Includes charges related to Attempt to Murder (IPC 307), Voluntarily Causing Hurt by Dangerous Weapons (IPC 324), Forgery for cheating (IPC 468), and Promoting Enmity (IPC 153A)."
      },
      politicalBackground: {
        dynastyStatus: "Dynastic/Connected. Married into the Nandamuri Taraka Rama Rao (NTR) family. His son, Nara Lokesh, is also a prominent politician.",
        careerHighlight: "Credited with transforming Hyderabad into an IT hub during his 1995–2004 tenure."
      },
      promises: {
        keyPromises: '"Super Six" guarantees including monthly aid for women (Maha Shakthi), annual aid for mothers (Thalliki Vandanam), and 20 lakh jobs for youth (Yuvashakti).',
        currentFocus: "Focus on restarting stalled capital city (Amaravati) and Polavaram irrigation project works."
      },
      affiliatedCompanies: {
        primaryCompany: "Heritage Foods Ltd - Food processing and dairy products company. Nara Bhuvaneswari serves as Managing Director.",
        marketCap: "₹763 Crore+ (value of family shares in Heritage Foods as of 2024)",
        familyShareholding: "Substantial shareholding by spouse Nara Bhuvaneswari (Managing Director)",
        otherCompanies: "Various investments through Heritage Foods and family holdings"
      },
      relativesInCompanies: {
        spouse: "Nara Bhuvaneswari - Managing Director of Heritage Foods, holds shares valued at over ₹763 Crore (2024)",
        children: "Nara Lokesh - Politician (MLA and TDP Leader)",
        otherRelatives: "Son-in-law of N.T. Rama Rao (NTR), founder of TDP and former Chief Minister",
        familyControl: "Majority control through spouse's shareholding in Heritage Foods"
      }
    };

    // Update official with ID 1 (Chandrababu Naidu)
    const result = await pool.query(
      `UPDATE officials 
       SET profile_data = $1,
           profile_updated_at = CURRENT_TIMESTAMP,
           position = $2,
           party = $3,
           constituency = $4,
           education = $5,
           assets = $6,
           liabilities = $7,
           criminal_cases = $8
       WHERE id = 1
       RETURNING id, name`,
      [
        JSON.stringify(profile2024Data),
        'Chief Minister',
        'Telugu Desam Party (TDP)',
        'Kuppam',
        'Post Graduate (M.A. Economics)',
        '₹931.83 Crore',
        '₹10.38 Crore',
        '19 Pending Cases'
      ]
    );

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated:', result.rows[0].name);
      console.log('\n📊 Updated Data:');
      console.log('   Position: Chief Minister of Andhra Pradesh (4th Term, since June 2024)');
      console.log('   Assets: ₹931.83 Crore');
      console.log('   Criminal Cases: 19 Pending Cases');
      console.log('   Serious Charges: IPC 307, 324, 468, 153A');
      console.log('   Key Promises: Super Six guarantees');
      console.log('\n✨ Data is now live! Refresh http://localhost:3000/profile/1');
    } else {
      console.log('❌ No official found with ID 1');
    }

  } catch (error) {
    console.error('❌ Error updating data:', error.message);
  } finally {
    await pool.end();
  }
}

updateChandrababuData();
