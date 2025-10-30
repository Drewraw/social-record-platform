const fs = require('fs');
const path = require('path');
const { mapMyNetaToScorecard, storePoliticianInDatabase } = require('./myneta-scraper/myneta-to-scorecard');

// Usage: node import-myneta-profile.js <json_file> <name> <state> <position> <party> <constituency>
const args = process.argv.slice(2);
if (args.length < 6) {
  console.log('\n❌ Usage: node import-myneta-profile.js <json_file> <name> <state> <position> <party> <constituency>');
  console.log('Example:');
  console.log('  node import-myneta-profile.js ../myneta_nara_chandrababu_naidu_0.json "Nara Chandrababu Naidu" "Andhra Pradesh" "Chief Minister" "TDP" "KUPPAM"\n');
  process.exit(1);
}

const [jsonFile, name, state, position, party, constituency] = args;
const jsonFilePath = path.isAbsolute(jsonFile) ? jsonFile : path.join(__dirname, jsonFile);
let jsonData;
try {
  jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
} catch (err) {
  console.error(`❌ Could not read or parse JSON file: ${jsonFilePath}`);
  process.exit(1);
}

(async () => {
  try {
    // Map to scorecard format
    const { profileData, analysisResult } = await mapMyNetaToScorecard(jsonData, name, state);
    // Use a placeholder image
    const profileImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`;
    // Store in DB
    const officialId = await storePoliticianInDatabase(
      name,
      state,
      position,
      party,
      constituency,
      profileData,
      analysisResult,
      profileImageUrl,
      'None identified'
    );
    console.log(`\n✅ Imported profile for ${name} (ID: ${officialId})`);
  } catch (err) {
    console.error('❌ Import failed:', err.message);
  }
})();
