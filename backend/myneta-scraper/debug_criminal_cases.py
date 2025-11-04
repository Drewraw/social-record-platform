#!/usr/bin/env python3
"""
Debug script to analyze why MyNeta scraper isn't finding criminal cases details
"""
import requests
from bs4 import BeautifulSoup
import re

def debug_criminal_cases_extraction(url):
    print(f"🔍 DEBUGGING CRIMINAL CASES EXTRACTION")
    print(f"URL: {url}")
    print("="*80)
    
    # Fetch the page
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        print(f"✅ Page fetched successfully")
        print(f"Page title: {soup.find('title').get_text(strip=True) if soup.find('title') else 'No title'}")
        print()
        
        # 1. Look for all "Click here" links
        print("🔍 STEP 1: Finding all 'Click here' links")
        print("-" * 50)
        click_links = soup.find_all("a", string=lambda x: x and "click" in x.lower())
        if click_links:
            for i, link in enumerate(click_links):
                text = link.get_text(strip=True)
                href = link.get('href', 'No href')
                print(f"   {i+1}. '{text}' -> {href}")
        else:
            print("   ❌ NO 'Click here' links found!")
        print()
        
        # 2. Look for criminal cases section
        print("🔍 STEP 2: Finding Criminal Cases section")
        print("-" * 50)
        
        # Find Criminal Cases text
        criminal_elements = soup.find_all(string=re.compile(r"Criminal\s*Cases", re.I))
        for i, elem in enumerate(criminal_elements):
            parent = elem.parent if hasattr(elem, 'parent') else None
            if parent:
                print(f"   {i+1}. Found 'Criminal Cases' in: {parent.name}")
                print(f"      Text: {elem[:100]}...")
                print(f"      Parent HTML: {str(parent)[:200]}...")
                
                # Look for nearby tables
                table = parent.find_parent("table")
                if table:
                    print(f"      ✅ Found parent table")
                    # Look for "Click here" links in this table
                    table_links = table.find_all("a", string=lambda x: x and "click" in x.lower())
                    if table_links:
                        for j, tlink in enumerate(table_links):
                            print(f"         Link {j+1}: '{tlink.get_text(strip=True)}' -> {tlink.get('href', 'No href')}")
                    else:
                        print(f"         ❌ No 'Click here' links in this table")
                else:
                    print(f"      ❌ No parent table found")
                print()
        
        # 3. Look for numbered criminal cases (1, 2, 3, etc.)
        print("🔍 STEP 3: Finding numbered criminal cases")
        print("-" * 50)
        
        found_cases = {}
        for i in range(1, 25):  # Check for cases 1-24
            # Look for table cells that might contain case numbers
            for td in soup.find_all("td"):
                text = td.get_text(strip=True)
                if text == str(i):
                    # Found a cell with just the number, check adjacent cells
                    tr = td.find_parent("tr")
                    if tr:
                        cells = tr.find_all("td")
                        if len(cells) >= 2:
                            case_text = cells[1].get_text(strip=True)
                            if any(keyword in case_text.lower() for keyword in ["case", "complaint", "police", "court", "fir"]):
                                found_cases[i] = case_text
                                print(f"   Case {i}: {case_text[:100]}...")
        
        if found_cases:
            print(f"\n✅ Found {len(found_cases)} criminal cases in main table")
        else:
            print("\n❌ No criminal cases found in main table")
        
        # 4. Look for "Other Elections" section
        print("\n🔍 STEP 4: Finding Other Elections section")
        print("-" * 50)
        
        other_elections = soup.find_all(string=re.compile(r"Other\s*Elections", re.I))
        if other_elections:
            for i, elem in enumerate(other_elections):
                print(f"   {i+1}. Found 'Other Elections': {elem[:50]}...")
                parent = elem.parent if hasattr(elem, 'parent') else None
                if parent:
                    table = parent.find_parent("table")
                    if table:
                        # Look for "Click here" in this section
                        section_links = table.find_all("a", string=lambda x: x and "click" in x.lower())
                        if section_links:
                            for link in section_links:
                                print(f"      ✅ Found link: '{link.get_text(strip=True)}' -> {link.get('href', 'No href')}")
                        else:
                            print(f"      ❌ No 'Click here' links in Other Elections section")
        else:
            print("   ❌ No 'Other Elections' section found")
        
        # 5. Check for any comparison or detailed links
        print("\n🔍 STEP 5: Looking for comparison/detail links")
        print("-" * 50)
        
        all_links = soup.find_all("a", href=True)
        detail_links = []
        for link in all_links:
            href = link.get('href', '')
            text = link.get_text(strip=True).lower()
            
            if any(keyword in href.lower() for keyword in ['compare', 'detail', 'more']) or \
               any(keyword in text for keyword in ['detail', 'more', 'compare', 'click']):
                detail_links.append((text, href))
        
        if detail_links:
            print("   Potential detail/comparison links found:")
            for i, (text, href) in enumerate(detail_links[:10]):  # Show first 10
                print(f"   {i+1}. '{text[:50]}' -> {href}")
        else:
            print("   ❌ No detail/comparison links found")
        
        print("\n" + "="*80)
        print("🎯 SUMMARY")
        print(f"   Click links found: {len(click_links)}")
        print(f"   Criminal cases in main table: {len(found_cases)}")
        print(f"   Other Elections sections: {len(other_elections)}")
        print(f"   Potential detail links: {len(detail_links)}")
        
        return {
            'click_links': len(click_links),
            'criminal_cases': len(found_cases),
            'other_elections': len(other_elections),
            'detail_links': len(detail_links)
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    # Debug Rahul Gandhi's page
    url = "https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=2195"
    debug_criminal_cases_extraction(url)