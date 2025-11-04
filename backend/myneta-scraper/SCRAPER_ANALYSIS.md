# MyNeta Scraper Analysis - Data Extraction Overview

## 🎯 **What MyNeta Scraper Extracts**

The `myneta_scraper.py` is designed to extract comprehensive politician profile data from MyNeta.info. Here's exactly what it extracts:

### **1. Basic Profile Information**
- **Candidate Name** - From page title
- **Party Affiliation** - Political party name  
- **Constituency** - Electoral constituency
- **Election Year** - Most recent election (2024, 2019, etc.)
- **Page Title** - Full MyNeta page title
- **Source URL** - Original MyNeta page URL

### **2. Financial Information**
- **Declared Assets** - Total asset value (e.g., "Rs20,39,61,862 ~20 Crore+")
- **Asset History** - Assets declared in previous elections
  - Lok Sabha 2024
  - Lok Sabha 2019  
  - Lok Sabha 2014
  - Lok Sabha 2009
  - Lok Sabha 2004
- **Liabilities** - Any declared debts/liabilities

### **3. Criminal Cases Information**
- **Criminal Cases Count** - Total number of criminal cases (e.g., "18")
- **Case Details** - Individual case descriptions (limited to visible cases)
- **Conviction Status** - Convicted/Pending/Acquitted status analysis

### **4. Personal Details**
- **Age** - Candidate's age
- **Education** - Educational qualifications
- **Profession** - Occupation/profession details
- **Contact Information** - When available

### **5. PAN Information**
- **PAN Status** - Whether PAN is provided
- **Self/Spouse/HUF/Dependent** PAN details

### **6. Other Elections Data**
- **Previous Election Results** - Performance in past elections
- **Historical Assets** - Asset growth over time
- **Election Comparison** - Cross-election analysis

### **7. Technical Metadata**
- **Scraped Timestamp** - When data was extracted
- **Debug Information** - Extraction success metrics
- **Source URLs** - For each data field

## 🔧 **How It Works**

### **Extraction Process:**
1. **Search Mode**: Searches MyNeta by candidate name
2. **Direct URL Mode**: Scrapes specific MyNeta candidate page
3. **Bulk Mode**: Scrapes multiple candidates sequentially

### **Data Structure:**
```json
{
  "_source_url": "https://myneta.info/...",
  "_scraped_at": "2025-11-04 17:29:32",
  "_page_title": "Rahul Gandhi(INC):Constituency-WAYANAD",
  "_candidate_name": "Rahul Gandhi",
  
  "Criminal Cases": {
    "value": "18",
    "sourceUrl": "https://myneta.info/..."
  },
  
  "Declared Assets": {
    "value": "Rs20,39,61,862 ~20 Crore+", 
    "sourceUrl": "https://myneta.info/..."
  },
  
  "Party": {
    "value": "Indian National Congress(INC)",
    "sourceUrl": "https://myneta.info/..."
  },
  
  "_other_elections": [...],
  "_comparison_data": [...],
  "_enhanced_criminal_cases": {...}
}
```

## 🎯 **Current Focus: Criminal Cases**

The scraper specifically handles criminal cases extraction with:
- **Declared Count**: Total cases shown on page (e.g., "18")
- **Visible Cases**: Only cases actually displayed in tables (e.g., "2")
- **Limitation Handling**: Notes when not all cases are accessible
- **Source URLs**: Tracks where each piece of data came from

## 🚀 **Usage Examples**

```bash
# Search for a candidate
python myneta_scraper.py "Rahul Gandhi"

# Direct URL scraping  
python myneta_scraper.py --direct "https://myneta.info/LokSabha2024/candidate.php?candidate_id=2195"

# Bulk scraping
python myneta_scraper.py --bulk "https://myneta.info/LokSabha2024/candidate.php?candidate_id=" 1 50
```

## ⚠️ **Current Limitations**

1. **Criminal Cases**: Only extracts visible cases (2 out of 18 for Rahul Gandhi)
2. **JavaScript Content**: Cannot access dynamically loaded content
3. **Pagination**: Doesn't handle multi-page criminal case data
4. **Rate Limiting**: Has delays to avoid overwhelming MyNeta servers

## 🎯 **For Your Use Case**

Since you only need **"number of cases as of the most recent year"**, the scraper now focuses on:
- Extracting the declared criminal cases count (e.g., "18")
- Storing it in the `"Criminal Cases"` field
- Providing source URL for verification
- Noting any extraction limitations

The simplified version prioritizes getting the **count** rather than detailed case-by-case information.