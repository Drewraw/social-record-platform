require('dotenv').config();
const pool = require('./config/database');

// Field validation rules
const VALIDATION_RULES = {
  // Required fields (should never be null/empty)
  required: ['name', 'position', 'party', 'constituency', 'serial_number'],
  
  // Should not be default/placeholder values
  notPlaceholder: {
    education: ['To be updated', 'N/A', '', null],
    assets: ['To be updated', 'N/A', '', null],
    liabilities: ['To be updated', 'N/A', '', null],
    criminal_cases: ['To be updated', '', null],
    age: ['To be updated', 'N/A', '', null],
    dynasty_status: ['Unknown', '', null],
    political_relatives: ['Unknown', '', null]
  },
  
  // Should have real URLs (not dicebear avatars)
  realImage: ['image_url', 'profile_image_url'],
  
  // JSONB fields should have data
  jsonb: ['profile_data']
};

async function validateDatabase() {
  console.log('\n🔍 DATABASE VALIDATION REPORT');
  console.log('=' .repeat(100) + '\n');

  try {
    const result = await pool.query(`
      SELECT 
        serial_number, id, name, position, party, constituency, state, tenure,
        education, age, assets, liabilities, criminal_cases,
        dynasty_status, family_wealth, current_wealth, knowledgeful, 
        consistent_winner, political_relatives,
        image_url, profile_image_url, contact_email,
        profile_data,
        created_at, updated_at, profile_updated_at
      FROM officials 
      ORDER BY serial_number
    `);

    console.log(`📊 Total Officials in Database: ${result.rows.length}\n`);

    // Track statistics
    const stats = {
      total: result.rows.length,
      fullyEnriched: 0,
      partiallyEnriched: 0,
      notEnriched: 0,
      fieldIssues: {
        missingRequired: [],
        hasPlaceholders: [],
        missingImages: [],
        missingProfileData: [],
        missingDynasty: [],
        missingRelatives: []
      }
    };

    // Individual official validation
    const issues = [];

    result.rows.forEach(official => {
      const officialIssues = {
        serial: official.serial_number,
        id: official.id,
        name: official.name,
        problems: []
      };

      // 1. Check required fields
      VALIDATION_RULES.required.forEach(field => {
        if (!official[field]) {
          officialIssues.problems.push(`❌ Missing required field: ${field}`);
          stats.fieldIssues.missingRequired.push(official.name);
        }
      });

      // 2. Check for placeholder values
      Object.entries(VALIDATION_RULES.notPlaceholder).forEach(([field, placeholders]) => {
        const value = official[field];
        if (placeholders.includes(value) || (typeof value === 'string' && value.trim() === '')) {
          officialIssues.problems.push(`⚠️  Placeholder in ${field}: "${value}"`);
          stats.fieldIssues.hasPlaceholders.push(`${official.name} (${field})`);
        }
      });

      // 3. Check for real images (not avatar fallbacks)
      if (official.image_url?.includes('dicebear') || !official.image_url) {
        officialIssues.problems.push(`🖼️  Using avatar fallback (no real image)`);
        stats.fieldIssues.missingImages.push(official.name);
      }

      // 4. Check profile_data JSONB
      if (!official.profile_data || Object.keys(official.profile_data).length === 0) {
        officialIssues.problems.push(`📄 Missing profile_data JSONB`);
        stats.fieldIssues.missingProfileData.push(official.name);
      }

      // 5. Check dynasty analysis
      if (!official.dynasty_status || official.dynasty_status === 'Unknown') {
        officialIssues.problems.push(`👑 Dynasty status not analyzed`);
        stats.fieldIssues.missingDynasty.push(official.name);
      }

      // 6. Check political relatives
      if (!official.political_relatives || 
          official.political_relatives === 'Unknown' || 
          official.political_relatives === 'None identified') {
        officialIssues.problems.push(`👨‍👩‍👧 Political relatives not researched`);
        stats.fieldIssues.missingRelatives.push(official.name);
      }

      // Classify enrichment status
      if (officialIssues.problems.length === 0) {
        stats.fullyEnriched++;
      } else if (officialIssues.problems.length <= 3) {
        stats.partiallyEnriched++;
      } else {
        stats.notEnriched++;
      }

      if (officialIssues.problems.length > 0) {
        issues.push(officialIssues);
      }
    });

    // Print detailed issues
    if (issues.length > 0) {
      console.log('🚨 OFFICIALS WITH ISSUES:\n');
      
      issues.forEach(official => {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`Serial #${official.serial} | ID: ${official.id} | ${official.name}`);
        console.log('─'.repeat(80));
        official.problems.forEach(problem => {
          console.log(`   ${problem}`);
        });
      });
      
      console.log('\n\n');
    }

    // Print summary statistics
    console.log('=' .repeat(100));
    console.log('📈 ENRICHMENT SUMMARY');
    console.log('=' .repeat(100) + '\n');

    console.log(`✅ Fully Enriched:      ${stats.fullyEnriched}/${stats.total} (${Math.round(stats.fullyEnriched/stats.total*100)}%)`);
    console.log(`⚠️  Partially Enriched: ${stats.partiallyEnriched}/${stats.total} (${Math.round(stats.partiallyEnriched/stats.total*100)}%)`);
    console.log(`❌ Not Enriched:        ${stats.notEnriched}/${stats.total} (${Math.round(stats.notEnriched/stats.total*100)}%)`);

    console.log('\n' + '=' .repeat(100));
    console.log('🔍 FIELD-SPECIFIC ISSUES');
    console.log('=' .repeat(100) + '\n');

    console.log(`❌ Missing Required Fields:     ${stats.fieldIssues.missingRequired.length} officials`);
    console.log(`⚠️  Placeholder Values:         ${new Set(stats.fieldIssues.hasPlaceholders.map(x => x.split(' (')[0])).size} officials`);
    console.log(`🖼️  Missing Real Images:        ${stats.fieldIssues.missingImages.length} officials`);
    console.log(`📄 Missing Profile Data:       ${stats.fieldIssues.missingProfileData.length} officials`);
    console.log(`👑 Missing Dynasty Analysis:   ${stats.fieldIssues.missingDynasty.length} officials`);
    console.log(`👨‍👩‍👧 Missing Family Research:    ${stats.fieldIssues.missingRelatives.length} officials`);

    // Detailed breakdown
    console.log('\n' + '=' .repeat(100));
    console.log('📋 DETAILED FIELD BREAKDOWN');
    console.log('=' .repeat(100) + '\n');

    const fieldStats = {
      education: 0,
      age: 0,
      assets: 0,
      liabilities: 0,
      criminal_cases: 0,
      dynasty_status: 0,
      political_relatives: 0,
      image_url: 0,
      profile_data: 0
    };

    result.rows.forEach(official => {
      if (official.education && !['To be updated', 'N/A', ''].includes(official.education)) fieldStats.education++;
      if (official.age && !['To be updated', 'N/A', ''].includes(official.age)) fieldStats.age++;
      if (official.assets && !['To be updated', 'N/A', ''].includes(official.assets)) fieldStats.assets++;
      if (official.liabilities && !['To be updated', 'N/A', ''].includes(official.liabilities)) fieldStats.liabilities++;
      if (official.criminal_cases && !['To be updated', ''].includes(official.criminal_cases)) fieldStats.criminal_cases++;
      if (official.dynasty_status && !['Unknown', ''].includes(official.dynasty_status)) fieldStats.dynasty_status++;
      if (official.political_relatives && !['Unknown', 'None identified', ''].includes(official.political_relatives)) fieldStats.political_relatives++;
      if (official.image_url && !official.image_url.includes('dicebear')) fieldStats.image_url++;
      if (official.profile_data && Object.keys(official.profile_data).length > 0) fieldStats.profile_data++;
    });

    console.log(`🎓 Education:           ${fieldStats.education}/${stats.total} (${Math.round(fieldStats.education/stats.total*100)}%)`);
    console.log(`🎂 Age:                 ${fieldStats.age}/${stats.total} (${Math.round(fieldStats.age/stats.total*100)}%)`);
    console.log(`💰 Assets:              ${fieldStats.assets}/${stats.total} (${Math.round(fieldStats.assets/stats.total*100)}%)`);
    console.log(`📊 Liabilities:         ${fieldStats.liabilities}/${stats.total} (${Math.round(fieldStats.liabilities/stats.total*100)}%)`);
    console.log(`⚖️  Criminal Cases:      ${fieldStats.criminal_cases}/${stats.total} (${Math.round(fieldStats.criminal_cases/stats.total*100)}%)`);
    console.log(`👑 Dynasty Status:      ${fieldStats.dynasty_status}/${stats.total} (${Math.round(fieldStats.dynasty_status/stats.total*100)}%)`);
    console.log(`👨‍👩‍👧 Political Relatives: ${fieldStats.political_relatives}/${stats.total} (${Math.round(fieldStats.political_relatives/stats.total*100)}%)`);
    console.log(`🖼️  Real Images:         ${fieldStats.image_url}/${stats.total} (${Math.round(fieldStats.image_url/stats.total*100)}%)`);
    console.log(`📄 Profile Data:        ${fieldStats.profile_data}/${stats.total} (${Math.round(fieldStats.profile_data/stats.total*100)}%)`);

    // Officials needing enrichment
    console.log('\n' + '=' .repeat(100));
    console.log('🎯 RECOMMENDED ACTIONS');
    console.log('=' .repeat(100) + '\n');

    const needsEnrichment = result.rows.filter(official => {
      const hasEducation = official.education && !['To be updated', 'N/A', ''].includes(official.education);
      const hasAssets = official.assets && !['To be updated', 'N/A', ''].includes(official.assets);
      return !hasEducation || !hasAssets;
    });

    if (needsEnrichment.length > 0) {
      console.log(`❗ ${needsEnrichment.length} officials need enrichment:\n`);
      needsEnrichment.forEach(official => {
        console.log(`   ${official.serial_number}. ${official.name} (${official.position})`);
      });
      console.log('\n💡 Run: node unified-enrichment.js all');
    } else {
      console.log('✅ All officials are enriched!');
    }

    console.log('\n' + '=' .repeat(100) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

validateDatabase();
