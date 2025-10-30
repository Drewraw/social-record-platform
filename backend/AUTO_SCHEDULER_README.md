# Auto-Scheduler and Validation System

This system automatically monitors and enriches new officials added to the database.

## Files

### 1. `auto-scheduler.js` (AUTOMATED DAILY SCHEDULER)
**Purpose**: Runs every 24 hours to detect duplicates and enrich new officials.

**Features**:
- ✅ Runs automatically every 24 hours
- ✅ **Duplicate Detection & Removal**: Finds duplicate names (case-insensitive) and deletes newer entries, keeping the oldest
- ✅ Processes up to 10 new officials per run
- ✅ Automatic data enrichment from multiple sources:
  - Existing JSON files
  - MyNeta.info (scraping)
  - Wikipedia
  - OpenAI/Google search
- ✅ 5-second delay between enrichments to avoid rate limiting
- ✅ Validates if enrichment is needed (checks for placeholder values)
- ✅ Saves MyNeta URLs to database for future use

**Usage**:
```bash
# Start the scheduler (runs continuously, checks every 24 hours)
node auto-scheduler.js

# Stop with Ctrl+C
```

**Configuration** (edit top of file):
```javascript
const CONFIG = {
  CHECK_INTERVAL_MS: 24 * 60 * 60 * 1000,  // Check every 24 hours
  BATCH_SIZE: 10,                          // Process 10 new officials at a time
  ENRICHMENT_DELAY_MS: 5000,               // 5 second delay between enrichments
  MIN_FIELDS_REQUIRED: 5                   // Minimum fields that should be filled
};
```

**What happens every 24 hours**:
1. **Duplicate Detection**: Scans all officials for duplicate names
   - Compares names case-insensitively (e.g., "PC Mohan" = "pc mohan")
   - Keeps the OLDEST entry (based on `created_at`)
   - Deletes all newer duplicates
   - Logs which entries were kept/deleted
   
2. **New Official Enrichment**: Processes up to 10 new officials
   - Checks if they need enrichment
   - Searches for existing data or scrapes MyNeta
   - Uses AI for missing fields
   - Updates database

**Data Sources Priority**:
1. MyNeta.info (most reliable - official affidavits)
2. OpenAI research (Wikipedia, Google, news sources)
3. Defaults (N/A, 0, etc.)

**Fields Enriched**:
- Education
- Age
- Assets
- Liabilities
- Criminal Cases
- Dynasty Status
- Political Relatives

---

### 2. `scheduler-validate-and-enrich.js` (RENAMED from validate-database.js)
**Purpose**: One-time validation report showing database enrichment status.

**Features**:
- ✅ Comprehensive validation of all officials
- ✅ Detailed breakdown by field
- ✅ Identifies officials with missing/placeholder data
- ✅ Statistics and percentages
- ✅ Recommendations for enrichment

**Usage**:
```bash
# Run validation report
node scheduler-validate-and-enrich.js
```

**Output**:
```
📊 Total Officials in Database: 38

🚨 OFFICIALS WITH ISSUES:
   Serial #1 | ID: 1 | Revanth Reddy
      ⚠️ Placeholder in education: "N/A"
      ⚠️ Placeholder in assets: "N/A"

📈 ENRICHMENT SUMMARY
   ✅ Fully Enriched:      2/38 (5%)
   ⚠️ Partially Enriched:  7/38 (18%)
   ❌ Not Enriched:        29/38 (76%)

📋 DETAILED FIELD BREAKDOWN
   🎓 Education:           21% (8/38)
   💰 Assets:              21% (8/38)
   📊 Liabilities:         21% (8/38)
   ...
```

---

## Workflow

### Recommended: Set It and Forget It

1. **Start the auto-scheduler once** (runs indefinitely):
   ```bash
   node auto-scheduler.js
   ```

2. **What happens automatically every 24 hours**:
   - 🔍 Scans for duplicate officials (deletes newer copies)
   - 📥 Detects new officials added to database
   - 🤖 Enriches them with data from MyNeta/Wikipedia/AI
   - 📊 Logs all actions to console

3. **Add officials anytime** (via your add scripts):
   ```bash
   node add-politician.js "New MLA Name"
   ```
   
4. **Next day**: Scheduler automatically enriches them!

### Check Duplicates Manually

```bash
# See if there are any duplicates
node test-duplicates.js
```

**Example Output**:
```
📋 "PC Mohan" appears 2 times:
   ✅ KEEP (oldest) - ID: 46, Serial: 36, Created: 10/25/2025
   ❌ DELETE (newer) - ID: 51, Serial: 41, Created: 10/27/2025
```

### For Manual Enrichment

1. **Check which officials need enrichment**:
   ```bash
   node scheduler-validate-and-enrich.js
   ```

2. **Enrich specific official**:
   ```bash
   node unified-enrichment.js "Official Name" "MyNeta_URL"
   ```

3. **Or enrich all at once**:
   ```bash
   node unified-enrichment.js all
   ```

---

## Example Scenario

**Day 1 - Monday 9 AM**: Start scheduler
```bash
node auto-scheduler.js

🤖 AUTO-SCHEDULER STARTED
⚙️  Configuration:
   - Check interval: Every 24 hours
   - Duplicate detection: Enabled (keeps oldest)
   
📌 Starting from ID: 48
🔄 Next run in 24 hours at: Tuesday, 10/28/2025 9:00:00 AM

🔍 CHECKING FOR DUPLICATE OFFICIALS
✅ No duplicate officials found

✅ No new officials to process
✅ Scheduler is now running. Next check in 24 hours.
```

**Throughout the day**: Add officials (they won't be processed yet)
```bash
node add-politician.js "New MLA 1"  # ID 49
node add-politician.js "New MLA 2"  # ID 50
node add-politician.js "PC Mohan"   # ID 51 (duplicate!)
```

**Day 2 - Tuesday 9 AM**: Scheduler runs automatically
```
🕐 SCHEDULER RUN - 10/28/2025 9:00:00 AM

🔍 CHECKING FOR DUPLICATE OFFICIALS
⚠️  Found 1 duplicate name(s):

📋 Duplicate: PC Mohan
   Total occurrences: 2
   Keeping oldest: ID 46 (created 10/25/2025)
   Deleting newer copies:
      ❌ ID 51 (created 10/27/2025)
   ✅ Deleted 1 duplicate(s)

✅ Duplicate cleanup complete: 1 official(s) removed

🔔 FOUND 2 NEW OFFICIAL(S) TO PROCESS

📋 Checking: New MLA 1 (ID: 49)
   ⚠️ Needs enrichment - missing critical data
   🔍 Searching for MyNeta URL...
   ✅ Found URL
   📥 Scraping MyNeta data...
   🤖 Using OpenAI to research...
   ✅ SUCCESS! Enriched
      💰 Assets: Rs 5,00,00,000 ~5 Crore+
      📊 Liabilities: Rs 50,00,000 ~50 Lakh+
   
   ⏳ Waiting 5 seconds before next enrichment...

📋 Checking: New MLA 2 (ID: 50)
   ... (similar enrichment process)

✅ Batch processing complete
```

**Day 3 - Wednesday 9 AM**: Scheduler runs again, finds nothing new

---

## Benefits

1. **Zero Manual Effort**: Just add officials, system enriches automatically
2. **Smart Source Priority**: Uses most reliable data first (MyNeta → AI)
3. **Rate Limiting**: 5-second delays prevent API blocks
4. **Batch Processing**: Processes 2 at a time for efficiency
5. **Comprehensive Validation**: Always know enrichment status
6. **Persistent Monitoring**: Runs 24/7, catches new additions immediately

---

## Stopping the Scheduler

Press `Ctrl+C` to gracefully stop the auto-scheduler. It will:
- Finish processing current official
- Close database connections
- Exit cleanly

---

## Troubleshooting

**Scheduler not detecting new officials?**
- Check if it's still running (should show "Monitoring..." messages)
- Verify new officials have IDs higher than the "Starting from ID" message
- Check database connection

**Enrichment failing?**
- Check OpenAI API key is valid
- Verify MyNeta URLs are accessible
- Check Python scraper is installed (`python myneta_direct_url.py`)

**Too slow?**
- Reduce `CHECK_INTERVAL_MS` (but may hit rate limits)
- Increase `BATCH_SIZE` (but may slow down individual enrichments)
- Reduce `ENRICHMENT_DELAY_MS` (but may get blocked by APIs)

---

## Advanced Configuration

Edit `auto-scheduler.js` constants:

```javascript
// Process faster (check every 15 seconds)
CHECK_INTERVAL_MS: 15000

// Process more at once (4 officials)
BATCH_SIZE: 4

// Faster enrichment (2 second delay)
ENRICHMENT_DELAY_MS: 2000

// More lenient validation (3 fields minimum)
MIN_FIELDS_REQUIRED: 3
```

**Note**: Lower delays may cause rate limiting from APIs!
