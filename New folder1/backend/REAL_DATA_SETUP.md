# Real Data Aggregation Setup Guide 🚀

This guide will help you set up **real-time data aggregation** for Bangalore MLAs using:
- 🏛️ **MyNeta.info** (Primary Source - Official Election Commission Data)
- 🤖 **Google Gemini AI** (Data Enhancement & Gap Filling)
- 📰 **Google News** (Recent Activity & Articles)

---

## 📋 Prerequisites

✅ **Completed:**
- Node.js installed
- PostgreSQL database set up (local or cloud)
- Cheerio package installed (web scraping)
- Backend packages installed

⚠️ **Required Actions:**
1. Get Gemini API Key
2. Configure environment variables
3. Run aggregation script

---

## 🔑 Step 1: Get Gemini API Key

### Option A: Google AI Studio (Recommended)
1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key

### Option B: Google Cloud Console
1. Visit: **https://console.cloud.google.com/**
2. Create a new project or select existing
3. Enable **"Generative Language API"**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key

---

## ⚙️ Step 2: Configure Environment Variables

1. **Create `.env` file** (if not exists):
```bash
cd backend
copy .env.example .env
```

2. **Edit `backend/.env`** with your values:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_record_db
DB_USER=postgres
DB_PASSWORD=your_actual_password

# Server Configuration
PORT=5000
NODE_ENV=development

# Gemini AI API Key (REQUIRED for real data aggregation)
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**⚠️ Important:** Replace `your_actual_gemini_api_key_here` with the API key from Step 1

---

## 🏗️ Step 3: Initialize Database

Run the database initialization script:

```bash
cd backend
node config/initDatabase.js
```

**Expected Output:**
```
✅ Database tables created successfully!
   - officials
   - promises
   - activity_timeline
   - comparisons
   - forum_comments
   - data_sources
```

---

## 🌱 Step 4: Seed Initial Data (Optional)

If you want to start with some test data before running real aggregation:

```bash
node seed-data.js
```

This creates 6 sample Bangalore MLAs with auto-generated promises.

---

## 🚀 Step 5: Aggregate Real Bangalore MLA Data

### Quick Start (10 MLAs)
```bash
node aggregate-real-data.js
```

**What This Does:**
1. **Scrapes MyNeta.info** for:
   - Education
   - Assets & Liabilities (in Crores/Lakhs)
   - Criminal Cases
   - Age
   - Constituency Details

2. **Enhances with Gemini AI**:
   - Standardizes education format
   - Assesses dynasty status
   - Generates realistic promises (15 per official)
   - Fills missing data gaps

3. **Scrapes Google News**:
   - Recent articles about the official
   - Latest activities
   - Public statements

4. **Consolidates Data**:
   - Priority: MyNeta (1) > Gemini (2) > News (3)
   - Resolves conflicts intelligently
   - Saves to PostgreSQL database

### Expected Duration
- **10 MLAs:** ~5-7 minutes (3 seconds delay between each)
- **Rate Limiting:** 3 seconds per request to avoid blocking
- **Error Handling:** Continues on failure, reports at end

### Example Output
```
🚀 Starting Real Data Aggregation for Bangalore MLAs
======================================================================
Sources: MyNeta.info → Gemini AI → Google News
======================================================================

📋 Target: 10 Bangalore MLAs

[1/10] Processing: Ramalinga Reddy
----------------------------------------------------------------------
📊 MyNeta.info: Fetching profile data...
   ✓ Education: Post Graduate
   ✓ Assets: ₹15.2 Crores
   ✓ Liabilities: ₹2.1 Crores
   ✓ Criminal Cases: 3 Cases
   ✓ Age: 68 years

🤖 Gemini AI: Enhancing profile...
   ✓ Dynasty Status: Self-Made
   ✓ Generated 15 promises
   ✓ Background: 6-time MLA from BTM Layout...

📰 Google News: Fetching recent articles...
   ✓ Found 5 recent articles

💾 Saved to database: ID 1
📝 Inserted 15 promises
⏳ Waiting 3 seconds before next request...

✅ Successfully aggregated and saved: Ramalinga Reddy

[2/10] Processing: Priyank Kharge
...
```

---

## 📊 Step 6: Verify Data

### Check Database
```sql
-- View all officials
SELECT id, name, constituency, party, education, assets, criminal_cases 
FROM officials;

-- View promises count
SELECT o.name, COUNT(p.id) as promise_count
FROM officials o
LEFT JOIN promises p ON o.id = p.official_id
GROUP BY o.name;

-- View data sources
SELECT * FROM data_sources;
```

### Test API Endpoints
```bash
# Get all officials
curl http://localhost:5000/api/officials

# Get specific official
curl http://localhost:5000/api/officials/1
```

---

## 🛠️ Troubleshooting

### Problem: "GEMINI_API_KEY is not set"
**Solution:**
- Ensure `GEMINI_API_KEY=your_key` is in `backend/.env`
- No quotes needed around the key
- Restart the script after adding the key

### Problem: "Cannot connect to database"
**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify .env database credentials
cat .env | grep DB_
```

### Problem: "MyNeta scraping failed"
**Solution:**
- MyNeta.info might have changed HTML structure
- Check `backend/services/mynetaService.js` selectors
- Test with: `node -e "require('./services/mynetaService').searchOfficial('Ramalinga Reddy', 'BTM Layout')"`

### Problem: "Rate limited / Blocked"
**Solution:**
- Increase delay in `aggregate-real-data.js` (line with `setTimeout(resolve, 3000)`)
- Change 3000 to 5000 (5 seconds)
- Use VPN if IP blocked

### Problem: "Too many Gemini API requests"
**Solution:**
- Gemini free tier: 60 requests/minute
- Script uses ~2-3 requests per official
- For 10 MLAs: ~25 requests total (within limit)
- If exceeded, wait 1 minute and retry

---

## 🎯 What Gets Saved to Database

### Officials Table
```javascript
{
  id: 1,
  name: "Ramalinga Reddy",
  position: "MLA",
  party: "Indian National Congress",
  constituency: "BTM Layout",
  tenure: "2023–Present",
  dynasty_status: "Self-Made",
  education: "Post Graduate - Political Science",
  assets: "₹15.2 Crores",
  liabilities: "₹2.1 Crores",
  criminal_cases: "3 Cases",
  age: "68 years",
  contact_email: "ramalinga.reddy@karnataka.gov.in",
  score: 85,
  approvals: 2345,
  disapprovals: 567
}
```

### Promises Table (15 per official)
```javascript
{
  id: 1,
  official_id: 1,
  title: "Complete Phase 2 of Bangalore Metro expansion",
  status: "in-progress",
  progress: 60,
  source_url: "https://example.com/source-..."
}
```

---

## 🔄 Updating Data Periodically

### Manual Update (Recommended)
Run the aggregation script monthly or when needed:
```bash
node aggregate-real-data.js
```

### Automated Updates (Advanced)
Create a cron job (Linux/Mac) or Task Scheduler (Windows):
```bash
# Run every month
0 0 1 * * cd /path/to/backend && node aggregate-real-data.js
```

---

## 📈 Expanding to More MLAs

Edit `backend/aggregate-real-data.js` to add more officials:

```javascript
const bangaloreMLAs = [
  // Existing 10...
  
  // Add more:
  { name: 'Suresh Kumar', constituency: 'Rajajinagar', party: 'Bharatiya Janata Party' },
  { name: 'M Krishnappa', constituency: 'Sarvagnanagar', party: 'Indian National Congress' },
  // ... up to 28 Bangalore constituencies
];
```

**Full Bangalore Constituency List:**
BTM Layout, Jayanagar, Shantinagar, KR Puram, Mahadevapura, Byatarayanapura, Gandhinagar, Chamarajpet, Pulakeshinagar, Shivajinagar, Chickpet, Yeshwanthpur, Malleswaram, Rajajinagar, Govindaraja Nagar, Vijay Nagar, Basavanagudi, Padmanabha Nagar, etc.

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** to git:
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Rotate API keys** every 3-6 months

3. **Use environment-specific keys:**
   - Development: Free tier Gemini key
   - Production: Paid tier with higher limits

4. **Monitor API usage:**
   - Check: https://makersuite.google.com/app/apikey
   - Set up billing alerts if using paid tier

---

## 📚 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   aggregate-real-data.js                    │
│                  (Orchestrator Script)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   dataAggregator.js                         │
│         (Combines all sources + priority merging)           │
└─────────┬──────────────┬──────────────┬─────────────────────┘
          │              │              │
          ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│ MyNeta      │  │   Gemini     │  │ Google News  │
│ Service     │  │   Service    │  │   Scraping   │
│ (Priority 1)│  │ (Priority 2) │  │ (Priority 3) │
└─────────────┘  └──────────────┘  └──────────────┘
          │              │              │
          └──────────────┴──────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                        │
│     officials | promises | data_sources | ...              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Next Steps

After successful aggregation:

1. **Start the servers:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run server

   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

2. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/officials

3. **View real data:**
   - Homepage shows all aggregated officials
   - Click on any official to see profile with real MyNeta data
   - Category filters work with real dynasty status, ratings, etc.

4. **Implement remaining tabs:**
   - Promises tab: Already populated with AI-generated promises
   - Activity tab: Add timeline events
   - Compare tab: Add promise vs reality tracking
   - Forum tab: Enable public discussions

---

## 🤝 Support

- **MyNeta.info Issues:** https://myneta.info/about.php
- **Gemini API Docs:** https://ai.google.dev/docs
- **Cheerio Docs:** https://cheerio.js.org/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**Happy Data Aggregating! 🎉**
