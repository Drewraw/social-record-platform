const { exec } = require('child_process');
const path = require('path');

const pythonScript = path.join(__dirname, 'backend', 'myneta-scraper', 'myneta_direct_url.py');
const url = 'https://myneta.info/LokSabha2024/candidate.php?candidate_id=2178';
const outputName = 'test_scrape';

console.log('Running Python scraper from Node.js...');
exec(`python "${pythonScript}" "${url}" "${outputName}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log('Output:', stdout);
  if (stderr) console.error('Stderr:', stderr);
});
