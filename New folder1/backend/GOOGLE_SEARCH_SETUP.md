# Google Custom Search API Setup (Optional)

## Current Implementation ✅

The `test-gemini-with-websearch.js` currently uses:
- **Direct MyNeta.info scraping** (no API key needed)
- **Gemini AI analysis** (uses existing GEMINI_API_KEY)

This works without any additional setup!

## Optional Enhancement: Google Custom Search API

If you want to add Google Custom Search for broader web access, follow these steps:

### 1. Get Google Custom Search API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Custom Search API"
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > API Key**
6. Copy the API key

### 2. Create Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **Add** to create new search engine
3. In "Sites to search":
   - Add: `myneta.info`
   - Add: `wikipedia.org`
   - Add: `thehindu.com`
   - Add: `indianexpress.com`
4. Click **Create**
5. Copy the **Search Engine ID** (cx parameter)

### 3. Add to .env File

```env
# Existing keys
GEMINI_API_KEY=AIzaSyCNfxs25_Mo-mB2AwKDG3Q4Pb_hBHKAans

# Add these (optional)
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### 4. API Limits

**Free Tier:**
- 100 search queries per day
- Good for testing and small projects

**Paid Tier:**
- $5 per 1,000 queries
- Up to 10,000 queries per day

## Alternative: DuckDuckGo (No API Key)

The code also includes DuckDuckGo HTML scraping as a fallback (no API key needed, but less reliable).

## Current Status

✅ **Working without Google Search API**
- Direct MyNeta scraping works
- Gemini provides analysis
- No additional API keys needed

❓ **When to add Google Search API**
- Need broader web search (beyond MyNeta)
- Want to search news articles
- Need structured search results

## Recommended Approach

For this project, **direct MyNeta scraping + Gemini** is sufficient because:
1. ✅ MyNeta has all official affidavit data
2. ✅ No API limits or costs
3. ✅ Gemini can analyze and enhance the data
4. ✅ Already working in test-gemini-with-websearch.js
