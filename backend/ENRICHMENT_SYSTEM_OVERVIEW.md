# 🎯 MYNETA DATA ENRICHMENT SYSTEM

## Overview
Both `unified-enrichment.js` and `myneta-to-scorecard.js` now use the **SAME multi-source fallback logic** to ensure complete data collection.

---

## 📊 Data Collection Hierarchy

### 1️⃣ PRIMARY SOURCE: MyNeta.info
**Most Reliable** - Official election affidavits filed by candidates
- ✅ Education
- ✅ Age
- ✅ Assets & Liabilities
- ✅ Criminal Cases
- ✅ Party Affiliation
- ✅ Constituency
- ✅ Father's Name, Mother's Name, Spouse
- ✅ Email, Phone (if available)

### 2️⃣ SECONDARY SOURCE: Wikipedia
**Structured Data from Infobox**
- 🔄 Age (calculated from birth date)
- 🔄 Political Party
- 🔄 Constituency
- 🔄 Education
- 🔄 Occupation/Profession
- 📚 Full biography text (5000 chars)

### 3️⃣ TERTIARY SOURCE: Google Search (via OpenAI)
**Final Fallback for Critical Fields**
- 🔍 Age (if missing from MyNeta & Wikipedia)
- 🔍 Party (if missing)
- 🔍 Constituency (if missing)
- 🔍 Education (if missing)

### 4️⃣ DEFAULTS
If all sources fail, set reasonable defaults:
- Party: "Independent"
- Others: "N/A"

---

## 🔄 Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SCRAPE MYNETA                                            │
│    - Direct URL scraping (myneta_direct_url.py)            │
│    - Extract all table data (88+ fields)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SEARCH WIKIPEDIA                                         │
│    - Find politician's Wikipedia page                       │
│    - Extract infobox structured data                        │
│    - Get full biography text                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. EXTRACT COMPLETE DATA (with fallbacks)                  │
│    - Try MyNeta first for each field                       │
│    - If missing, try Wikipedia infobox                     │
│    - If still missing, use Google search                   │
│    - Set defaults for any remaining gaps                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. DEEP FAMILY RESEARCH (OpenAI)                           │
│    - Analyze MyNeta family fields                          │
│    - Parse Wikipedia biography                             │
│    - Research political relatives                          │
│    - Identify dynasty status                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. COMPREHENSIVE ANALYSIS (OpenAI)                         │
│    - Family wealth (before politics)                       │
│    - Current wealth (from assets)                          │
│    - Knowledge assessment (education + schemes)            │
│    - Electoral performance (wins/losses)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. FETCH PROFILE IMAGE                                     │
│    - Try MyNeta candidate photo                            │
│    - Fallback to avatar generator                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. STORE IN DATABASE                                       │
│    - UPDATE existing official record                       │
│    - Store enriched profile_data as JSONB                  │
│    - Includes all source data for verification             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Comparison

### `unified-enrichment.js` (NEW - RECOMMENDED)
**Location:** `backend/unified-enrichment.js`

**Features:**
- ✅ Multi-source fallback logic
- ✅ Wikipedia infobox parsing
- ✅ Google search via OpenAI
- ✅ Deep family research
- ✅ Comprehensive analysis
- ✅ Progress tracking
- ✅ Batch processing mode
- ✅ Status checking mode

**Usage:**
```bash
# Check status
node unified-enrichment.js

# Enrich one official
node unified-enrichment.js "Name" "MyNeta URL"

# Enrich all (from myneta-urls.js)
node unified-enrichment.js all
```

---

### `myneta-to-scorecard.js` (UPDATED - LEGACY)
**Location:** `backend/myneta-scraper/myneta-to-scorecard.js`

**Features:**
- ✅ Multi-source fallback logic (NOW ADDED)
- ✅ Wikipedia infobox parsing (NOW ADDED)
- ✅ Google search via OpenAI (NOW ADDED)
- ✅ Deep family research
- ✅ Comprehensive analysis
- ✅ Processes JSON files from Python scraper

**Usage:**
```bash
# Process scraped JSON
node myneta-to-scorecard.js myneta_name_0.json "Name" "State" "Position"
```

---

## 🎯 Recommended Workflow

### Option A: Use Unified Enrichment (EASIEST)
1. Add MyNeta URLs to `myneta-urls.js`
2. Run: `node unified-enrichment.js all`
3. Watch it enrich all 32 officials automatically

### Option B: Use Python + Node Pipeline
1. Scrape with Python: `python myneta_direct_url.py "URL" "name"`
2. Process with Node: `node myneta-to-scorecard.js myneta_name_0.json "Name" "State" "Position"`

---

## ✨ Key Functions (Both Files)

### `searchWikipedia(name)`
- Searches Wikipedia for politician
- Extracts infobox structured data
- Returns: title, extract, url, infobox

### `searchGoogleForMissingData(name, missingFields)`
- Uses OpenAI to search for missing fields
- Only called if MyNeta & Wikipedia don't have data
- Returns: JSON with requested fields

### `extractCompleteData(name, mynetaData, wikipediaData)`
- Tries MyNeta first for each field
- Falls back to Wikipedia infobox
- Falls back to Google search
- Sets defaults if all fail
- Returns: Complete data object with NO nulls

### `researchPoliticalRelatives(name, mynetaData, wikipediaData)`
- Deep family tree research
- Lists ALL political relatives
- Determines dynasty status
- Returns: Array of relatives + summary

### `analyzeWithOpenAI(mynetaData, name, wikipediaData, familyResearch)`
- Family wealth analysis
- Current wealth assessment
- Knowledge evaluation
- Electoral performance
- Returns: Comprehensive analysis

---

## 🗂️ Database Fields Updated

Both scripts update these fields:
- `education` ✅
- `age` ✅
- `party` ✅
- `constituency` ✅
- `assets` ✅
- `liabilities` ✅
- `criminal_cases` ✅
- `dynasty_status` ✅
- `family_wealth` ✅
- `current_wealth` ✅
- `knowledgeful` ✅
- `consistent_winner` ✅
- `political_relatives` ✅
- `image_url` ✅
- `profile_image_url` ✅
- `contact_email` ✅
- `profile_data` (JSONB with all source data) ✅

---

## 📈 Success Indicators

After enrichment, each official should have:
- ✅ Education (not "N/A" unless truly unavailable)
- ✅ Age (from MyNeta, Wikipedia, or Google)
- ✅ Party (never empty)
- ✅ Constituency (never empty)
- ✅ Assets & Liabilities (from MyNeta)
- ✅ Dynasty status (Self-Made or Dynastic with relation)
- ✅ Political relatives list (or "None known")
- ✅ Profile image (MyNeta or avatar)

---

## 🚀 Next Steps

1. ✅ **Both files now have same logic**
2. ⏳ **Waiting for current Shobha enrichment to complete**
3. 📋 **Need 31 more MyNeta URLs from user**
4. 🎯 **Run batch enrichment on all 32 officials**

---

**Status:** ✅ UNIFIED - Both files use multi-source fallback logic
**Last Updated:** October 27, 2025
