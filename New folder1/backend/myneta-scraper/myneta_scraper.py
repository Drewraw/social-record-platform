# myneta_scraper.py
"""
MyNeta.info Scraper - Extract politician data from MyNeta search results
Uses requests + BeautifulSoup (fast & lightweight approach)
"""
import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import quote_plus
import sys
import io

# Fix Windows console encoding for emojis
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

def make_request(url, retries=3, delay=2):
    """Make HTTP request with retries"""
    for i in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            print(f"✓ Successfully fetched: {url}")
            return resp
        except Exception as e:
            print(f"⚠️  Request error ({i+1}/{retries}) for {url}: {e}")
            time.sleep(delay)
    raise RuntimeError(f"❌ Failed to fetch {url} after {retries} attempts")

def search_candidate(name):
    """
    Search MyNeta for a candidate by name
    Returns list of candidate links found
    """
    print(f"\n🔍 Searching MyNeta for: {name}")
    q = quote_plus(name)
    url = f"https://myneta.info/search_myneta.php?q={q}"
    print(f"   URL: {url}\n")
    
    resp = make_request(url)
    soup = BeautifulSoup(resp.text, "lxml")
    
    # Find candidate links (hrefs containing 'candidate.php')
    anchors = soup.find_all("a", href=True)
    candidate_links = []
    
    for a in anchors:
        href = a["href"]
        if "candidate.php" in href:
            # Normalize URL
            full = href if href.startswith("http") else "https://myneta.info/" + href.lstrip("/")
            text = a.get_text(strip=True)
            candidate_links.append({"text": text, "href": full})
    
    print(f"📋 Found {len(candidate_links)} candidate link(s):\n")
    for i, link in enumerate(candidate_links):
        print(f"   {i}. {link['text']}")
        print(f"      {link['href']}\n")
    
    return candidate_links

def parse_candidate_page(url):
    """
    Parse a MyNeta candidate page
    Extracts key/value pairs from tables with source URLs
    FILTERS: Only keeps most recent election year data
    """
    print(f"\n📄 Parsing candidate page...")
    resp = make_request(url)
    soup = BeautifulSoup(resp.text, "lxml")
    
    data = {
        "_source_url": url,
        "_scraped_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Extract candidate name from title or header
    title = soup.find("title")
    if title:
        data["_page_title"] = title.get_text(strip=True)
        # Extract election year from title (e.g., "Telangana2023" or "LokSabha2024")
        import re
        year_match = re.search(r'(20\d{2})', title.get_text())
        if year_match:
            data["_election_year"] = year_match.group(1)
    
    # Historical election year filters (to skip old data)
    skip_patterns = [
        "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", 
        "2011", "2010", "2009", "2008", "2007", "2006", "2005"
    ]
    
    # Parse tables for key/value pairs
    field_count = 0
    skipped_count = 0
    
    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            tds = tr.find_all(["td", "th"])
            # Only process rows with 2 columns (common pattern on MyNeta)
            if len(tds) >= 2:
                key = tds[0].get_text(separator=" ", strip=True)
                val = tds[1].get_text(separator=" ", strip=True)
                
                if key and val:  # Skip empty rows
                    # Skip historical election year data
                    should_skip = False
                    for old_year in skip_patterns:
                        if old_year in key and ("Lok Sabha" in key or "Assembly" in key or 
                                                 "Telangana" in key or "Andhra Pradesh" in key or
                                                 "Karnataka" in key or "Gujarat" in key or
                                                 any(state in key for state in ["Maharashtra", "Tamil Nadu", "Kerala", "Punjab"])):
                            should_skip = True
                            skipped_count += 1
                            break
                    
                    if not should_skip:
                        # Store value and source for traceability
                        data[key] = {
                            "value": val,
                            "sourceUrl": url
                        }
                        field_count += 1
    
    print(f"   ✓ Extracted {field_count} fields from tables")
    print(f"   ⏭️  Skipped {skipped_count} historical election records\n")
    
    # Try extracting affidavit PDF link if present
    pdf_link = None
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.lower().endswith(".pdf") or "affidavit" in href.lower():
            pdf_link = href if href.startswith("http") else "https://myneta.info/" + href.lstrip("/")
            break
    
    if pdf_link:
        data["affidavit_pdf"] = {
            "value": pdf_link,
            "sourceUrl": pdf_link
        }
        print(f"   📎 Found affidavit PDF: {pdf_link}\n")
    
    return data

def get_nth_candidate_details(name, n=0):
    """
    Search for candidate and get details of the Nth result
    n=0: first result, n=1: second result, etc.
    """
    links = search_candidate(name)
    
    if not links:
        return {
            "error": "No candidate links found for search: " + name,
            "search_url": f"https://myneta.info/search_myneta.php?q={quote_plus(name)}"
        }
    
    if n < 0 or n >= len(links):
        return {
            "error": f"Invalid index: {n}. Found {len(links)} candidate links.",
            "available_candidates": [link["text"] for link in links]
        }
    
    candidate = links[n]
    print(f"✅ Selected candidate #{n}: {candidate['text']}")
    
    details = parse_candidate_page(candidate["href"])
    
    # Attach metadata
    details["_search_result_text"] = candidate["text"]
    details["_search_result_index"] = n
    details["_total_results"] = len(links)
    
    return details

def main():
    """Main function with command-line interface"""
    if len(sys.argv) < 2:
        print("\n❌ Usage: python myneta_scraper.py \"Candidate Name\" [index]")
        print("\nExamples:")
        print('  python myneta_scraper.py "Nara Chandrababu Naidu"')
        print('  python myneta_scraper.py "Nara Chandrababu Naidu" 0   # first result')
        print('  python myneta_scraper.py "Y S Jagan Mohan Reddy" 1    # second result')
        print()
        sys.exit(1)
    
    name = sys.argv[1]
    index = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    
    print("\n" + "="*80)
    print("MyNeta Scraper")
    print("="*80)
    
    result = get_nth_candidate_details(name, n=index)
    
    print("\n" + "="*80)
    print("Result")
    print("="*80 + "\n")
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Save to file
    safe_name = name.replace(" ", "_").lower()
    filename = f"myneta_{safe_name}_{index}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved to: {filename}\n")

if __name__ == "__main__":
    main()
