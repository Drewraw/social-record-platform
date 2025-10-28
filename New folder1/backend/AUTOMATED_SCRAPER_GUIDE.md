# Automated Donations Scraper - Scheduler Setup

## 🤖 What It Does

The automated scraper:
1. ✅ **Searches** news sites for political donation articles
2. ✅ **Downloads** article content
3. ✅ **Extracts** donation info using OpenAI
4. ✅ **Stores** in your database automatically
5. ✅ **Avoids** duplicates

---

## 🚀 Quick Start

### Run Once Manually:
```bash
cd backend
node automated-donations-scraper.js
```

### Run with Custom Search:
```bash
node automated-donations-scraper.js "Vedanta BJP donation 2025"
```

---

## ⏰ Schedule Automatic Runs

### Option 1: Windows Task Scheduler (Recommended for Windows)

**Step 1: Create a batch file**
Create `run-donations-scraper.bat`:
```batch
@echo off
cd /d "C:\Users\sreek\OneDrive\Documents\New folder\New folder1\backend"
node automated-donations-scraper.js >> scraper-log.txt 2>&1
```

**Step 2: Schedule in Task Scheduler**
1. Open Task Scheduler (search in Windows)
2. Click "Create Basic Task"
3. Name: "Political Donations Scraper"
4. Trigger: Daily at 6:00 AM
5. Action: Start a program
6. Program: `C:\path\to\run-donations-scraper.bat`
7. Finish

**Runs daily at 6 AM automatically!** ✅

---

### Option 2: Node-Cron (JavaScript Scheduler)

Install:
```bash
npm install node-cron
```

Create `scheduler.js`:
```javascript
const cron = require('node-cron');
const { exec } = require('child_process');

// Run every day at 6 AM
cron.schedule('0 6 * * *', () => {
  console.log('🔄 Running donations scraper...');
  
  exec('node automated-donations-scraper.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log(stdout);
  });
});

console.log('⏰ Scheduler started. Will run daily at 6 AM');
```

Run continuously:
```bash
node scheduler.js
```

Keep it running with PM2:
```bash
npm install -g pm2
pm2 start scheduler.js --name donations-scraper
pm2 save
pm2 startup
```

---

### Option 3: GitHub Actions (Free Cloud Automation)

Create `.github/workflows/scrape-donations.yml`:
```yaml
name: Scrape Political Donations

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: |
        cd backend
        npm install
    
    - name: Run scraper
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
      run: |
        cd backend
        node automated-donations-scraper.js
```

Add secrets in GitHub:
- `OPENAI_API_KEY`
- `DATABASE_URL`

**Runs automatically on GitHub's servers!** ✅

---

## 📊 Monitoring & Logs

### View Recent Runs:
```bash
# If using batch file
type scraper-log.txt

# Last 50 lines
powershell -Command "Get-Content scraper-log.txt -Tail 50"
```

### Check Database:
```bash
node backend/show-donations.js
```

---

## 🎯 Search Queries

The scraper automatically searches for:

1. "BJP political donations India 2024 2025"
2. "Congress INC party funding donations 2024"
3. "electoral bonds political parties India"
4. "corporate donations Indian political parties"
5. "TDP donations Andhra Pradesh"
6. "YSRCP party funding"
7. "political funding transparency India"

**Customize queries** in `automated-donations-scraper.js` line 283

---

## ⚙️ Configuration

### Adjust Frequency:

**Daily:**
```javascript
cron.schedule('0 6 * * *', ...)  // 6 AM every day
```

**Twice Daily:**
```javascript
cron.schedule('0 6,18 * * *', ...)  // 6 AM and 6 PM
```

**Weekly:**
```javascript
cron.schedule('0 6 * * 1', ...)  // 6 AM every Monday
```

### Adjust Article Limit:

In `automated-donations-scraper.js`:
```javascript
const articles = await searchDonationArticles(query, 5);  // Change 5 to 10, 20, etc.
```

---

## 🔒 Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` file
   - Store `OPENAI_API_KEY` securely
   - Use read-only database credentials if possible

2. **Rate Limiting:**
   - Built-in delays between requests
   - Respects website robots.txt
   - Uses polite User-Agent

3. **Verification:**
   - All auto-extracted donations marked `verified: false`
   - Review periodically
   - Update to `verified: true` after manual check

---

## 📈 Expected Performance

**Per Run:**
- Processes: ~30-50 articles
- Finds: ~5-15 donations
- Time: ~10-15 minutes
- API Costs: ~$0.50-1.00 (OpenAI)

**Monthly (Daily Runs):**
- Articles: ~1,000
- New Donations: ~150-300
- Cost: ~$15-30

---

## 🐛 Troubleshooting

### No articles found:
```bash
# Test search manually
node automated-donations-scraper.js "test query"
```

### OpenAI errors:
```bash
# Check API key
echo $env:OPENAI_API_KEY
```

### Database errors:
```bash
# Test connection
node backend/test-donations.js 13
```

---

## 🎨 Advanced: Add More News Sources

Edit `automated-donations-scraper.js`:
```javascript
const NEWS_SOURCES = [
  'economictimes.indiatimes.com',
  'thehindu.com',
  'indianexpress.com',
  'scroll.in',           // ADD NEW
  'thequint.com',        // ADD NEW
  'newslaundry.com'      // ADD NEW
];
```

---

## ✅ Quick Test

Run now to test:
```bash
cd backend
node automated-donations-scraper.js "BJP donations 2024"
```

Expected output:
```
╔════════════════════════════════════════════════════════════╗
║       AUTOMATED POLITICAL DONATIONS SCRAPER                ║
╚════════════════════════════════════════════════════════════╝

🔍 Searching for: "BJP donations 2024"

   ✅ Found: Vedanta announces donation to BJP
   ✅ Found: Electoral bonds data reveals...

📰 Processing: Vedanta announces donation to BJP
   🌐 Fetching...
   ✅ Downloaded 15420 characters
   🤖 Extracting donations with AI...
   ✅ Found 2 donation(s)
   ✅ Stored: Vedanta Limited → BJP

═══════════════════════════════════════════════════════
                    FINAL SUMMARY
═══════════════════════════════════════════════════════

   📰 Articles processed: 5
   💰 Donations found: 8
   💾 Stored in database: 6
```

**System is fully automated!** 🎉
