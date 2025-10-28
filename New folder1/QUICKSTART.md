# Quick Start Guide - Real Data Aggregation 🚀

## ✅ You're Ready to Go!

All setup is complete:
- ✅ Cheerio installed (web scraping)
- ✅ Database configured (Render.com PostgreSQL)
- ✅ Gemini API key configured
- ✅ All services created

---

## 🎯 Quick Commands

### Test Everything First
```bash
cd backend
node test-services.js
```

**Expected Output:**
```
✅ Database connected successfully
✅ Gemini AI responding correctly
✅ Core services ready!
```

---

### Option 1: Run Script Directly (Recommended for First Time)
```bash
cd backend
node aggregate-real-data.js
```

**This will:**
- Process 10 Bangalore MLAs
- Take ~5-7 minutes
- Show live progress
- Save to database

---

### Option 2: Use API Endpoints (While Server Running)

**Start server first:**
```bash
cd backend
npm run server
```

**Then in another terminal/Postman:**

#### Aggregate Single Official
```bash
curl -X POST http://localhost:5001/api/aggregate/official \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramalinga Reddy",
    "constituency": "BTM Layout",
    "party": "Indian National Congress"
  }'
```

#### Aggregate All Bangalore MLAs (Batch)
```bash
curl -X POST http://localhost:5001/api/aggregate/batch \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Check Aggregation Status
```bash
curl http://localhost:5001/api/aggregate/status
```

---

## 📊 What You'll Get

### For Each Official:
```javascript
{
  name: "Ramalinga Reddy",
  constituency: "BTM Layout",
  party: "Indian National Congress",
  
  // From MyNeta.info
  education: "Post Graduate - Political Science",
  assets: "₹15.2 Crores",
  liabilities: "₹2.1 Crores",
  criminalCases: "3 Cases",
  age: "68 years",
  
  // From Gemini AI
  dynastyStatus: "Self-Made",
  promises: [
    { title: "Complete Metro Phase 2", status: "in-progress", progress: 60 },
    // ... 14 more promises
  ]
}
```

---

## 🎨 View in Frontend

After aggregation, start both servers:

```bash
# Terminal 1: Backend
cd backend
npm run server

# Terminal 2: Frontend
cd frontend
npm start
```

Visit: **http://localhost:3000**

You'll see:
- ✅ Real officials with actual data
- ✅ Category badges (MLA, Dynastic/Self-Made, etc.)
- ✅ Real education, assets, criminal cases
- ✅ 15 AI-generated promises per official
- ✅ Proper source attribution

---

## 🔍 Verify Data

### In PostgreSQL:
```sql
-- View all aggregated officials
SELECT name, constituency, education, assets, criminal_cases, dynasty_status
FROM officials;

-- Count promises
SELECT o.name, COUNT(p.id) as promises
FROM officials o
LEFT JOIN promises p ON o.id = p.official_id
GROUP BY o.name;
```

### Via API:
```bash
# Get all officials
curl http://localhost:5001/api/officials

# Get specific official
curl http://localhost:5001/api/officials/1
```

---

## 🎯 Recommended First Run

1. **Test services:**
   ```bash
   node test-services.js
   ```

2. **Aggregate 2-3 officials first** (test run):
   ```bash
   node aggregate-real-data.js
   ```
   Then edit the file to only include 2-3 MLAs from the list.

3. **Check results:**
   - Open database
   - Check API: `curl http://localhost:5001/api/officials`
   - View in frontend

4. **If successful, aggregate all 10:**
   - Restore full list in `aggregate-real-data.js`
   - Run again: `node aggregate-real-data.js`

---

## ⚡ Performance Notes

- **Per Official:** ~30-45 seconds
  - MyNeta scraping: 5-10s
  - Gemini AI: 10-15s
  - Google News: 5-10s
  - Database insert: 1-2s

- **10 Officials:** ~6-8 minutes total
- **Rate Limiting:** 3 seconds between each

---

## 🐛 Common Issues

### "Cannot connect to database"
```bash
# Test connection
node -e "require('./config/database').query('SELECT NOW()')"
```

### "Gemini API error"
- Check API key in `.env`
- Verify at: https://makersuite.google.com/app/apikey
- Check quota: 60 requests/minute (free tier)

### "MyNeta scraping failed"
- This is normal - website structure may vary
- Gemini AI will fill gaps
- Check logs for details

---

## 📚 File Guide

| File | Purpose |
|------|---------|
| `test-services.js` | Test database, Gemini, MyNeta |
| `aggregate-real-data.js` | Script to aggregate 10 MLAs |
| `routes/aggregate.js` | API endpoints for aggregation |
| `services/mynetaService.js` | MyNeta.info web scraping |
| `services/geminiService.js` | Gemini AI enhancement |
| `services/dataAggregator.js` | Orchestrates all sources |
| `REAL_DATA_SETUP.md` | Comprehensive guide |

---

## 🎉 You're All Set!

Run this now:
```bash
cd backend
node test-services.js
```

If tests pass, run:
```bash
node aggregate-real-data.js
```

Then watch the magic happen! ✨

---

## 📞 Next Steps

After successful aggregation:

1. ✅ View real data in frontend (http://localhost:3000)
2. ⚙️ Implement other profile tabs (Activity, Compare, Forum)
3. 📱 Add more Bangalore constituencies (up to 28)
4. 🔄 Set up periodic updates (monthly aggregation)
5. 🎨 Enhance UI with data source badges

**Happy aggregating! 🚀**
