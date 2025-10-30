const OpenAI = require('openai');
const pool = require('../config/database');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Fetch political donations for a politician from multiple sources
 * Tracks BOTH: 1) Direct politician donations 2) Party donations
 * Priority: 1) Database 2) MyNeta 3) OpenAI 4) Wikipedia
 */
async function fetchPoliticalDonations(politicianName, party, state) {
  console.log(`\n💰 Fetching donation data for ${politicianName} (${party})...`);
  console.log(`   📚 Priority: Database → MyNeta → OpenAI → Wikipedia`);
  console.log(`   🔍 Searching: 1) Donations to politician 2) Donations to ${party} party\n`);
  
  const donations = [];
  const sources = {
    Database: 0,
    MyNeta: 0,
    OpenAI: 0,
    Wikipedia: 0
  };
  
  try {
    // Step 1: Check database first for existing donations
    console.log('   🔍 Step 1: Checking database for existing donations...');
    const dbQuery = `
      SELECT donor_name, donor_type, amount, year, source_type, donation_recipient_type, party_name
      FROM political_donations d
      JOIN officials o ON d.politician_id = o.id
      WHERE LOWER(o.name) = LOWER($1) OR o.name ILIKE $2
    `;
    
    const dbResult = await pool.query(dbQuery, [
      politicianName,
      `%${politicianName}%`
    ]);
    
    if (dbResult.rows.length > 0) {
      console.log(`   ✅ Found ${dbResult.rows.length} existing donations in database`);
      dbResult.rows.forEach(row => {
        donations.push({
          donor_name: row.donor_name,
          donor_type: row.donor_type,
          amount: parseFloat(row.amount),
          year: row.year,
          source_type: 'Database',
          recipient_type: row.donation_recipient_type
        });
        sources.Database++;
      });
      console.log(`   📊 Database donations loaded\n`);
    } else {
      console.log('   ⏭️  No existing donations in database\n');
    }
    
    // Step 2-4: Use OpenAI to query MyNeta, OpenAI knowledge, and Wikipedia
    console.log('   🔍 Step 2-4: Querying MyNeta → OpenAI → Wikipedia for NEW donations...');
    const prompt = `Research political donations and funding sources for ${politicianName} and ${party} party (${state}).

SEARCH PRIORITY:
1. Database (already checked - ${dbResult.rows.length} donations found)
2. MyNeta.info (PRIMARY - Electoral bonds and donation declarations)
3. OpenAI Knowledge Base (Recent news, government records)
4. Wikipedia (Political funding and controversies section)

SEARCH TWO WAYS:
A) Donations directly to ${politicianName} (the individual politician)
B) Donations to ${party} party (party-level funding)

Find NEW donations NOT in database:
- Electoral bonds received by politician OR party
- Corporate donations (company name, type: Private/Public, amount, year)
- Individual donations (donor name, amount, year)
- Any disclosed funding sources

For EACH donation found, provide:
Donor: [Company/Individual Name]
Type: [Private Company/Public Company/Individual]
Amount: [₹ amount if available]
Year: [Year]
RecipientType: [Politician/Party/Both]
Source: [MyNeta/OpenAI/Wikipedia/Government Records/News]
URL: [Source URL if available]

IMPORTANT: 
- Prioritize MyNeta.info data (most reliable)
- Specify RecipientType as "Politician" if to ${politicianName}, "Party" if to ${party}, "Both" if both
- Skip donations already in database

Format each donation on a new line starting with "DONATION:".
If no NEW donations found, respond with "NO_DATA".`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a political research analyst specializing in campaign finance and electoral funding. Search in priority order: 1) MyNeta.info (most reliable), 2) OpenAI knowledge base, 3) Wikipedia, 4) Government records. Find donations for BOTH individual politicians AND their political parties. Always cite sources with URLs when available. Clearly specify if donation is to Politician, Party, or Both."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });
    
    const response = completion.choices[0].message.content.trim();
    console.log(`   📄 Multi-source Response:\n${response}\n`);
    
    if (response === 'NO_DATA' || response.includes('no donation') || response.includes('No donation')) {
      console.log(`   ⚠️  No donation data found for ${politicianName}\n`);
      return { donations: [], sources };
    }
    
    // Parse donations from response
    const lines = response.split('\n');
    let currentDonation = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('DONATION:')) {
        if (Object.keys(currentDonation).length > 0) {
          donations.push(currentDonation);
          sources[currentDonation.source_type] = (sources[currentDonation.source_type] || 0) + 1;
        }
        currentDonation = {};
      } else if (trimmed.startsWith('Donor:')) {
        currentDonation.donor_name = trimmed.replace('Donor:', '').trim();
      } else if (trimmed.startsWith('Type:')) {
        currentDonation.donor_type = trimmed.replace('Type:', '').trim();
      } else if (trimmed.startsWith('Amount:')) {
        const amountStr = trimmed.replace('Amount:', '').trim();
        // Extract numeric value
        const amountMatch = amountStr.match(/[\d,]+\.?\d*/);
        if (amountMatch) {
          currentDonation.amount = parseFloat(amountMatch[0].replace(/,/g, ''));
        }
      } else if (trimmed.startsWith('Year:')) {
        const yearStr = trimmed.replace('Year:', '').trim();
        const yearMatch = yearStr.match(/\d{4}/);
        if (yearMatch) {
          currentDonation.year = parseInt(yearMatch[0]);
        }
      } else if (trimmed.startsWith('RecipientType:')) {
        const recipientType = trimmed.replace('RecipientType:', '').trim();
        currentDonation.recipient_type = recipientType;
      } else if (trimmed.startsWith('Source:')) {
        const sourceType = trimmed.replace('Source:', '').trim();
        // Map to our source types
        if (sourceType.includes('Database')) {
          currentDonation.source_type = 'Database';
        } else if (sourceType.includes('MyNeta')) {
          currentDonation.source_type = 'MyNeta';
        } else if (sourceType.includes('Wikipedia')) {
          currentDonation.source_type = 'Wikipedia';
        } else if (sourceType.includes('Government')) {
          currentDonation.source_type = 'Government Records';
        } else if (sourceType.includes('News')) {
          currentDonation.source_type = 'News Article';
        } else {
          currentDonation.source_type = 'OpenAI';
        }
      } else if (trimmed.startsWith('URL:')) {
        currentDonation.source_url = trimmed.replace('URL:', '').trim();
      }
    }
    
    // Add last donation
    if (Object.keys(currentDonation).length > 0 && currentDonation.donor_name) {
      donations.push(currentDonation);
      sources[currentDonation.source_type] = (sources[currentDonation.source_type] || 0) + 1;
    }
    
    console.log(`   ✅ Found ${donations.length} donation records`);
    console.log(`   📊 Sources breakdown:`, sources);
    console.log(`   📚 Priority used: Database → MyNeta → OpenAI → Wikipedia\n`);
    
    return { donations, sources };
    
  } catch (error) {
    console.error('   ❌ Error fetching donations:', error.message);
    return { donations: [], sources, error: error.message };
  }
}

/**
 * Store donations in database for a specific politician
 * Handles both politician and party donations
 */
async function storeDonations(politicianId, partyName, donations) {
  console.log(`\n💾 Storing ${donations.length} donations in database...`);
  
  let stored = 0;
  let skipped = 0;
  
  for (const donation of donations) {
    try {
      // Check if donation already exists
      const existingResult = await pool.query(
        `SELECT id FROM political_donations 
         WHERE politician_id = $1 
         AND donor_name = $2 
         AND COALESCE(year, 0) = COALESCE($3, 0)`,
        [politicianId, donation.donor_name, donation.year || null]
      );
      
      if (existingResult.rows.length > 0) {
        console.log(`   ⏭️  Skipping duplicate: ${donation.donor_name} (${donation.year})`);
        skipped++;
        continue;
      }
      
      // Determine recipient type and party name
      const recipientType = donation.recipient_type || 'Politician';
      const donationPartyName = (recipientType === 'Party' || recipientType === 'Both') ? partyName : null;
      
      // Insert donation
      await pool.query(
        `INSERT INTO political_donations 
          (politician_id, donor_name, donor_type, amount, year, source_url, source_type, verified, donation_recipient_type, party_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          politicianId,
          donation.donor_name || 'Unknown',
          donation.donor_type || 'Unknown',
          donation.amount || null,
          donation.year || null,
          donation.source_url || null,
          donation.source_type || 'OpenAI',
          false, // Will need manual verification
          recipientType,
          donationPartyName
        ]
      );
      
      const recipientLabel = recipientType === 'Party' ? `to ${partyName}` : recipientType === 'Both' ? `to politician & ${partyName}` : 'to politician';
      console.log(`   ✅ Stored: ${donation.donor_name} - ₹${donation.amount || 'N/A'} (${donation.year || 'Unknown'}) ${recipientLabel}`);
      stored++;
      
    } catch (error) {
      console.error(`   ❌ Error storing donation ${donation.donor_name}:`, error.message);
    }
  }
  
  console.log(`\n   📊 Summary: ${stored} stored, ${skipped} skipped\n`);
  
  return { stored, skipped };
}

/**
 * Fetch and store donations for a politician
 */
async function processPoliticianDonations(politicianId) {
  try {
    // Get politician info
    const result = await pool.query(
      'SELECT name, party, state FROM officials WHERE id = $1',
      [politicianId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Politician with ID ${politicianId} not found`);
    }
    
    const { name, party, state } = result.rows[0];
    
    // Fetch donations
    const { donations, sources, error } = await fetchPoliticalDonations(name, party, state);
    
    if (error) {
      return { success: false, error };
    }
    
    // Store donations
    const { stored, skipped } = await storeDonations(politicianId, party, donations);
    
    return {
      success: true,
      politician: { id: politicianId, name, party, state },
      donations: donations.length,
      stored,
      skipped,
      sources
    };
    
  } catch (error) {
    console.error('Error processing donations:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  fetchPoliticalDonations,
  storeDonations,
  processPoliticianDonations
};
