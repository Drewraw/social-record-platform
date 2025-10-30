# myneta_selenium.py
"""
MyNeta.info Scraper - Selenium fallback (acts like real browser)
Use this if the requests approach fails due to bot blocking
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import time
from bs4 import BeautifulSoup
import json
import sys

def get_candidate_with_selenium(name, index=0, headless=True):
    """
    Scrape MyNeta using Selenium (real browser)
    Simulates clicking on search results
    """
    print("\n" + "="*80)
    print("MyNeta Selenium Scraper (Browser Mode)")
    print("="*80 + "\n")
    
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
        print("🌐 Running in HEADLESS mode (no visible browser)")
    else:
        print("🌐 Running with VISIBLE browser")
    
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    print(f"\n🔍 Searching for: {name}")
    print(f"   Index: {index} (0=first, 1=second, etc.)\n")
    
    # Setup ChromeDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    
    try:
        search_url = f"https://myneta.info/search_myneta.php?q={name.replace(' ', '+')}"
        print(f"📍 Navigating to: {search_url}")
        driver.get(search_url)
        
        # Wait for page to load
        time.sleep(3)
        print("✓ Page loaded\n")

        # Find all links to candidate.php
        print("🔎 Looking for candidate links...")
        anchors = driver.find_elements(By.XPATH, "//a[contains(@href,'candidate.php')]")
        
        if not anchors:
            driver.quit()
            return {
                "error": "No candidate links found (selenium)",
                "search_url": search_url
            }
        
        print(f"📋 Found {len(anchors)} candidate link(s):\n")
        for i in range(min(len(anchors), 5)):  # Show first 5
            print(f"   {i}. {anchors[i].text}")
        
        if index < 0 or index >= len(anchors):
            driver.quit()
            return {
                "error": f"Index {index} out of range; found {len(anchors)} candidates",
                "total_found": len(anchors)
            }

        # Click the nth link
        print(f"\n👆 Clicking on candidate #{index}...")
        target_anchor = anchors[index]
        target_text = target_anchor.text
        target_anchor.click()
        
        # Wait for page to load
        time.sleep(3)
        current_url = driver.current_url
        print(f"✓ Navigated to: {current_url}\n")
        
        # Parse the page HTML with BeautifulSoup
        print("📄 Parsing candidate page...")
        soup = BeautifulSoup(driver.page_source, "lxml")
        
        data = {
            "_source_url": current_url,
            "_scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "_search_result_text": target_text,
            "_search_result_index": index,
            "_scraping_method": "selenium"
        }
        
        # Extract title
        title = soup.find("title")
        if title:
            data["_page_title"] = title.get_text(strip=True)
            # Extract election year
            import re
            year_match = re.search(r'(20\d{2})', title.get_text())
            if year_match:
                data["_election_year"] = year_match.group(1)
        
        # Historical election year filters (to skip old data)
        skip_patterns = [
            "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", 
            "2011", "2010", "2009", "2008", "2007", "2006", "2005"
        ]
        
        # Parse tables
        field_count = 0
        skipped_count = 0
        
        for table in soup.find_all("table"):
            for tr in table.find_all("tr"):
                tds = tr.find_all(["td", "th"])
                if len(tds) >= 2:
                    key = tds[0].get_text(strip=True)
                    val = tds[1].get_text(strip=True)
                    if key and val:
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
                            data[key] = {
                                "value": val,
                                "sourceUrl": current_url
                            }
                            field_count += 1
        
        print(f"   ✓ Extracted {field_count} fields")
        print(f"   ⏭️  Skipped {skipped_count} historical election records\n")
        
        # Look for PDF links
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.lower().endswith(".pdf") or "affidavit" in href.lower():
                pdf_link = href if href.startswith("http") else "https://myneta.info/" + href.lstrip("/")
                data["affidavit_pdf"] = {
                    "value": pdf_link,
                    "sourceUrl": pdf_link
                }
                print(f"   📎 Found affidavit PDF: {pdf_link}\n")
                break
        
        return data
        
    except Exception as e:
        print(f"\n❌ Error during scraping: {e}")
        return {"error": str(e)}
    finally:
        driver.quit()
        print("✓ Browser closed\n")

def main():
    """Main function with command-line interface"""
    if len(sys.argv) < 2:
        print("\n❌ Usage: python myneta_selenium.py \"Candidate Name\" [index] [--visible]")
        print("\nExamples:")
        print('  python myneta_selenium.py "Nara Chandrababu Naidu"')
        print('  python myneta_selenium.py "Nara Chandrababu Naidu" 0')
        print('  python myneta_selenium.py "Y S Jagan Mohan Reddy" 1 --visible  # show browser')
        print()
        sys.exit(1)
    
    name = sys.argv[1]
    index = 0
    headless = True
    
    # Parse arguments
    for i, arg in enumerate(sys.argv[2:], start=2):
        if arg == "--visible":
            headless = False
        elif arg.isdigit():
            index = int(arg)
    
    result = get_candidate_with_selenium(name, index=index, headless=headless)
    
    print("="*80)
    print("Result")
    print("="*80 + "\n")
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Save to file
    safe_name = name.replace(" ", "_").lower()
    filename = f"myneta_selenium_{safe_name}_{index}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved to: {filename}\n")

if __name__ == "__main__":
    main()
