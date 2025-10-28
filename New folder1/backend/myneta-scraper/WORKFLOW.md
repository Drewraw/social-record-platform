# MyNeta Scraper to Database - Complete Workflow

## Overview
This system scrapes real politician data from MyNeta.info, validates URLs, checks dynasty status via OpenAI, and stores everything in the database with proper source URLs.

## Features ✨

### 1. **URL Validation & Fixing**
- Automatically adds `https://` protocol if missing
- Fixes URLs starting with `//` (converts to `https://...`)
- Ensures all source URLs are properly formatted
- Validates URL quality after storage (shows % score)

### 2. **Dynasty Status Detection**
- Uses OpenAI (GPT-4o) to check if politician is dynastic or self-made
- Checks Wikipedia and political family connections
- Returns formats:
  - `"Dynastic - Son of former PM Rajiv Gandhi"`
  - `"Non-dynastic"` (self-made)
  - `"To be verified"` (if unclear)

### 3. **Automatic Verification**
- Counts total URLs stored
- Shows valid vs broken URLs
- Calculates quality score (% valid URLs)
- Warns about formatting issues

## Complete Workflow 🚀

### Step 1: Scrape from MyNeta
```bash
cd backend\myneta-scraper
python myneta_scraper.py "Politician Name"
```

**Output:** `myneta_politician_name_0.json`
- Real MyNeta candidate page URL
- All data fields with individual sourceUrls
- Filters historical election data (keeps only recent years)

### Step 2: Convert & Store in Database
```bash
node myneta-to-scorecard.js myneta_politician_name_0.json "Full Name" "State" "Position"
```

**Example:**
```bash
node myneta-to-scorecard.js myneta_revanth_reddy_0.json "Anumula Revanth Reddy" "Telangana" "Chief Minister"
```

**What Happens:**
1. ✅ Reads scraped JSON file
2. ✅ Validates and fixes source URL (adds https://)
3. ✅ Checks dynasty status via OpenAI
4. ✅ Maps MyNeta data to scorecard format
5. ✅ Stores in database with proper source URLs
6. ✅ Verifies URL quality (shows score)
7. ✅ Confirms database record

**Output:**
```
================================================================================
MyNeta to Scorecard Mapper
================================================================================

📂 Reading: myneta_revanth_reddy_0.json

🔄 Mapping MyNeta data to scorecard format...

   📎 Source URL: https://myneta.info/Telangana2023/candidate.php?candidate_id=141
   
🔍 Checking dynasty status for Anumula Revanth Reddy...
   ✓ Dynasty Status: Non-dynastic

📊 Extracted Information:
   Name: Anumula Revanth Reddy
   State: Telangana
   Position: Chief Minister
   Party: Indian National Congress(INC)
   Constituency: KODANGAL(VIKARABAD)
   Assets: Rs 30,04,98,852 ~30 Crore+
   Liabilities: Rs 1,90,26,339 ~1 Crore+
   Criminal Cases: 87 cases declared
   Dynasty Status: Non-dynastic
   Source URL: https://myneta.info/Telangana2023/candidate.php?candidate_id=141

💾 Storing in database...
✅ Stored Successfully
   ID: 12

📋 URL Verification:
   Total URLs: 20
   ✅ Valid: 20
   ❌ Broken: 0
   🌟 Quality Score: 100%
   ✨ Perfect! All URLs are properly formatted.

================================================================================

✨ Anumula Revanth Reddy successfully added to database!

💡 View at: http://localhost:3000/profile/12

================================================================================
```

### Step 3: Verify URLs (Optional)
```bash
cd ..
node verify-urls.js "Politician Name"
```

Shows detailed URL breakdown:
- Wikipedia sources
- MyNeta sources
- News sources
- Broken/placeholder URLs

## Key Features Implemented

### URL Fixing Function
```javascript
function fixUrl(url) {
  if (!url || url === '#' || url === 'N/A') return '#';
  
  // Fix URLs starting with //
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  
  return url;
}
```

### Dynasty Detection
```javascript
async function checkDynastyStatus(politicianName, state) {
  // Prompts OpenAI: "Is [name] from [state] dynastic or self-made?"
  // Checks family connections to CM/PM/MP/MLA
  // Returns: "Dynastic - [relationship]" | "Non-dynastic" | "To be verified"
}
```

### Database Structure
Every field stored as:
```json
{
  "fieldName": {
    "value": "Actual data",
    "sourceUrl": "https://myneta.info/..."
  }
}
```

## Example Results

### Revanth Reddy (MyNeta Scraped)
- **ID:** 12
- **Dynasty Status:** Non-dynastic
- **URLs:** 20 MyNeta URLs (100% quality)
- **Source:** https://myneta.info/Telangana2023/candidate.php?candidate_id=141

### Amit Shah (OpenAI Fetched)
- **ID:** 10
- **URLs:** 19 mixed sources (100% quality)
- **Sources:** Wikipedia, News articles, Government sites

## Best Practices ✅

1. **Always provide full name and state** when running the mapper
2. **Check URL quality** after storage (automatic in mapper)
3. **Verify dynasty status** makes sense for the politician
4. **Use recent MyNeta data** (scraper filters old elections)
5. **All URLs must be complete** with https:// protocol

## Troubleshooting

### Issue: "Already exists in database"
**Solution:** The politician was already added. Update script will be created if needed.

### Issue: "Dynasty status: To be verified"
**Reason:** OpenAI couldn't find clear family political connections.
**Action:** This is normal for self-made politicians or when data is unclear.

### Issue: URL quality < 100%
**Reason:** Some URLs might be missing https:// or have // prefix.
**Action:** The fixUrl() function should catch these. Report if you see < 100%.

## Files Modified

1. **myneta-to-scorecard.js**
   - Added `fixUrl()` function
   - Added `checkDynastyStatus()` with OpenAI
   - Added `verifyStoredUrls()` for quality check
   - Made `mapMyNetaToScorecard()` async
   - Updated `processMyNetaJson()` to await async operations

2. **myneta_scraper.py**
   - Filters historical election data (2019, 2018, etc.)
   - Extracts real MyNeta URLs
   - Provides {value, sourceUrl} for each field

## Next Steps

- [ ] Create update script for existing politicians
- [ ] Add batch processing for multiple politicians
- [ ] Cache dynasty results to avoid repeated OpenAI calls
- [ ] Add more detailed URL validation (check if URLs are reachable)

---

**Last Updated:** October 26, 2025  
**Status:** ✅ Fully Functional
