# MyNeta Scraper

Extracts real politician data directly from MyNeta.info with verified source URLs.

## 📁 Project Structure

```
myneta-scraper/
├── setup.bat              # Windows setup script
├── myneta_scraper.py      # Main scraper (requests + BeautifulSoup)
├── myneta_selenium.py     # Fallback scraper (Selenium browser)
└── README.md              # This file
```

## 🚀 Quick Start

### Step 1: Setup Environment

**Windows:**
```bash
setup.bat
```

**Manual Setup:**
```bash
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac

pip install requests beautifulsoup4 lxml pandas
pip install selenium webdriver-manager  # Optional, for fallback
```

### Step 2: Run the Scraper

**Method 1: Requests (Fast & Lightweight)**
```bash
python myneta_scraper.py "Nara Chandrababu Naidu"
python myneta_scraper.py "Y S Jagan Mohan Reddy" 0    # First result
python myneta_scraper.py "Amit Shah" 1                # Second result
```

**Method 2: Selenium (If blocked by MyNeta)**
```bash
python myneta_selenium.py "Nara Chandrababu Naidu"
python myneta_selenium.py "Rahul Gandhi" 0 --visible  # Show browser
```

## 📊 Output Format

The scraper produces JSON with structure:

```json
{
  "_source_url": "https://myneta.info/...",
  "_scraped_at": "2025-10-26 10:30:00",
  "_search_result_text": "Nara Chandrababu Naidu",
  "_search_result_index": 0,
  "_total_results": 3,
  "Candidate": {
    "value": "Nara Chandrababu Naidu",
    "sourceUrl": "https://myneta.info/..."
  },
  "Party": {
    "value": "Telugu Desam Party",
    "sourceUrl": "https://myneta.info/..."
  },
  "Constituency": {
    "value": "Kuppam",
    "sourceUrl": "https://myneta.info/..."
  },
  "Total Assets": {
    "value": "Rs 9,17,64,500",
    "sourceUrl": "https://myneta.info/..."
  }
}
```

**Key Features:**
- ✅ Every field has a `sourceUrl` for verification
- ✅ Metadata includes scraping timestamp
- ✅ Search result index for disambiguation
- ✅ Affidavit PDF links extracted automatically

## 🔧 Advanced Usage

### Search for Multiple Candidates

```bash
# Get first 3 results for same name
python myneta_scraper.py "Amit Shah" 0
python myneta_scraper.py "Amit Shah" 1
python myneta_scraper.py "Amit Shah" 2
```

### Integration with Node.js

```javascript
const { spawn } = require('child_process');

function scrapeMyNeta(name, index = 0) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['myneta_scraper.py', name, index.toString()]);
    let output = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        // Parse JSON from output
        const jsonStart = output.indexOf('{');
        const jsonData = JSON.parse(output.substring(jsonStart));
        resolve(jsonData);
      } else {
        reject(new Error('Python script failed'));
      }
    });
  });
}

// Usage
scrapeMyNeta('Nara Chandrababu Naidu')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

## 🛠️ Troubleshooting

### Issue: "No candidate links found"
- **Solution**: Check if name spelling matches MyNeta exactly
- Try variations: "Chandrababu Naidu" vs "Chandra Babu Naidu"

### Issue: Requests blocked by MyNeta
- **Solution**: Use Selenium fallback
```bash
python myneta_selenium.py "Name" 0
```

### Issue: ChromeDriver error
- **Solution**: Make sure Chrome browser is installed
- webdriver-manager will auto-download compatible driver

### Issue: Slow performance
- **Solution**: Requests method is faster, use Selenium only if blocked
- Add delays between requests to respect rate limits

## 📝 Best Practices

1. **Respect Rate Limits**: Add delays between requests
2. **Cache Results**: Save JSON files to avoid re-scraping
3. **Verify Data**: Always check source URLs for accuracy
4. **Handle Errors**: MyNeta structure may change over time
5. **Terms of Service**: Use responsibly and within MyNeta's ToS

## 🔗 Integration with OpenAI Service

You can now update the OpenAI prompt to reference real MyNeta URLs:

```python
# Get real MyNeta URL
import subprocess
result = subprocess.run(
    ['python', 'myneta_scraper.py', 'Amit Shah', '0'],
    capture_output=True,
    text=True
)
myneta_url = json.loads(result.stdout)['_source_url']

# Use in OpenAI prompt
prompt += f"\nUse this MyNeta URL: {myneta_url}"
```

## 📚 Next Steps

1. Test with multiple politicians
2. Map MyNeta fields to your scorecard template
3. Create auto-verification script
4. Integrate with `add-politician-universal.js`

---

**Note**: Always respect MyNeta.info's terms of service and add appropriate delays between requests to avoid overloading their servers.
