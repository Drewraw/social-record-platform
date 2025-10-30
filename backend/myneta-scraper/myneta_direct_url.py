# myneta_direct_url.py
"""
Scrape MyNeta data from a direct candidate URL
Usage: python myneta_direct_url.py <url> <output_name>
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

def scrape_candidate_url(url):
    """Scrape candidate data from direct MyNeta URL"""
    print(f"\n📄 Scraping: {url}\n")
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        print("✓ Successfully fetched page\n")
    except Exception as e:
        return {"error": f"Failed to fetch: {e}", "url": url}
    
    soup = BeautifulSoup(resp.text, "lxml")
    
    data = {
        "_source_url": url,
        "_scraped_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Extract page title
    title = soup.find("title")
    if title:
        data["_page_title"] = title.get_text(strip=True)
    
    # Extract candidate name from heading
    heading = soup.find("h2")
    if heading:
        data["_candidate_name"] = heading.get_text(strip=True).replace("(Winner)", "").strip()
    
    # Parse all tables for key/value pairs
    field_count = 0
    
    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            tds = tr.find_all(["td", "th"])
            
            if len(tds) >= 2:
                key = tds[0].get_text(separator=" ", strip=True)
                val = tds[1].get_text(separator=" ", strip=True)
                
                if key and val and key != val:
                    data[key] = {
                        "value": val,
                        "sourceUrl": url
                    }
                    field_count += 1
    
    print(f"✓ Extracted {field_count} fields from tables\n")
    
    # Extract CRITICAL FIELDS from page content (not in tables)
    page_text = resp.text
    
    # Education
    if "Post Graduate" in page_text or "Graduate" in page_text or "Matriculation" in page_text:
        # Find education in the page
        for elem in soup.find_all(text=True):
            text = elem.strip()
            if any(edu_keyword in text for edu_keyword in ["Post Graduate", "Graduate", "Matriculation", "12th Pass", "10th Pass", "8th Pass"]):
                if "Education" not in data:
                    data["Education"] = {"value": text, "sourceUrl": url}
                    print(f"✓ Found Education: {text[:100]}\n")
                    break
    
    # Age
    age_match = soup.find(text=lambda x: x and "Age" in x and "as on" in x)
    if age_match:
        age_text = age_match.strip()
        # Extract just the number
        import re
        age_num = re.search(r'(\d+)\s+(?:Yrs?|Years?)', age_text)
        if age_num:
            data["Age"] = {"value": age_num.group(1), "sourceUrl": url}
            print(f"✓ Found Age: {age_num.group(1)}\n")
    
    # Party
    for elem in soup.find_all(["b", "strong", "td"]):
        text = elem.get_text(strip=True)
        if "Bharatiya Janata Party" in text or "BJP" in text or "Indian National Congress" in text or "INC" in text:
            if "Party" not in data and len(text) < 100:
                data["Party"] = {"value": text, "sourceUrl": url}
                print(f"✓ Found Party: {text}\n")
                break
    
    # Criminal Cases
    if "Criminal Cases" not in data:
        for elem in soup.find_all(text=lambda x: x and "Criminal Case" in x):
            text = elem.strip()
            if text:
                data["Criminal Cases"] = {"value": text, "sourceUrl": url}
                print(f"✓ Found Criminal Cases: {text}\n")
                break
    
    # Constituency  
    if "_constituency" not in data:
        const_elem = soup.find(text=lambda x: x and "KARNATAKA" in x.upper() if x else False)
        if const_elem:
            data["_constituency"] = const_elem.strip()
            # Also add as regular field
            data["Constituency"] = {"value": const_elem.strip(), "sourceUrl": url}
            print(f"✓ Found Constituency: {const_elem.strip()}\n")
    
    # Extract affidavit PDF if present
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.lower().endswith(".pdf") or "affidavit" in href.lower():
            pdf_url = href if href.startswith("http") else url.rsplit('/', 1)[0] + "/" + href.lstrip("./")
            data["affidavit_pdf"] = {
                "value": pdf_url,
                "sourceUrl": pdf_url
            }
            print(f"📎 Found affidavit PDF: {pdf_url}\n")
            break
    
    return data

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("\nUsage: python myneta_direct_url.py <url> <output_name>")
        print("\nExample:")
        print('  python myneta_direct_url.py "https://myneta.info/LokSabha2024/candidate.php?candidate_id=2178" "shobha_karandlaje"')
        sys.exit(1)
    
    url = sys.argv[1]
    output_name = sys.argv[2]
    
    result = scrape_candidate_url(url)
    
    # Save to JSON file
    output_file = f"myneta_{output_name}_0.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved to: {output_file}\n")
