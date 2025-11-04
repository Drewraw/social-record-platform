#!/usr/bin/env python3
"""
Enhanced MyNeta scraper that properly handles criminal cases extraction
Addresses the issue where only 2 out of 18 criminal cases are visible on the main page
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import urljoin, urlparse

def enhanced_criminal_cases_extraction(soup, source_url):
    """
    Enhanced extraction of criminal cases with proper handling of visible vs declared counts
    """
    criminal_cases_data = {
        "declared_count": 0,
        "visible_cases": [],
        "extraction_notes": [],
        "source_url": source_url
    }
    
    print(f"   🔍 Enhanced criminal cases extraction...")
    
    # 1. Find the declared count
    declared_count_element = soup.find(string=re.compile(r'Number of Criminal Cases.*?(\d+)', re.I))
    if declared_count_element:
        # Extract the number from the text
        match = re.search(r'(\d+)', declared_count_element)
        if match:
            criminal_cases_data["declared_count"] = int(match.group(1))
            print(f"      ✅ Declared criminal cases: {criminal_cases_data['declared_count']}")
        else:
            print(f"      ❌ Could not parse criminal cases count from: {declared_count_element}")
    
    # 2. Extract all visible criminal cases from tables
    print(f"      🔍 Extracting visible criminal cases...")
    
    tables = soup.find_all('table')
    total_visible_cases = 0
    
    for table_idx, table in enumerate(tables):
        table_text = table.get_text().lower()
        
        # Check if this table contains criminal case information
        if any(keyword in table_text for keyword in ['criminal', 'complaint', 'fir', 'case no', 'police station']):
            print(f"         📋 Processing criminal table {table_idx + 1}")
            
            rows = table.find_all('tr')
            table_cases = []
            
            for row_idx, row in enumerate(rows):
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    first_cell = cells[0].get_text(strip=True)
                    
                    # Check if this row contains a criminal case
                    case_info = ""
                    for cell in cells[1:]:  # Check all cells except the first
                        cell_text = cell.get_text(strip=True)
                        if any(keyword in cell_text.lower() for keyword in ['complaint', 'case', 'fir', 'police', 'court', 'section']):
                            case_info = cell_text
                            break
                    
                    if case_info and len(case_info) > 10:  # Avoid empty or very short entries
                        case_data = {
                            "case_number": first_cell if first_cell.isdigit() else f"case_{total_visible_cases + 1}",
                            "description": case_info,
                            "table_index": table_idx,
                            "row_index": row_idx,
                            "full_row_data": [cell.get_text(strip=True) for cell in cells]
                        }
                        
                        table_cases.append(case_data)
                        total_visible_cases += 1
                        print(f"            Case {case_data['case_number']}: {case_info[:80]}...")
            
            if table_cases:
                criminal_cases_data["visible_cases"].extend(table_cases)
    
    print(f"      ✅ Extracted {total_visible_cases} visible criminal cases")
    
    # 3. Analysis and notes
    if criminal_cases_data["declared_count"] > 0:
        if total_visible_cases == criminal_cases_data["declared_count"]:
            criminal_cases_data["extraction_notes"].append("All declared cases successfully extracted")
        elif total_visible_cases < criminal_cases_data["declared_count"]:
            missing_cases = criminal_cases_data["declared_count"] - total_visible_cases
            criminal_cases_data["extraction_notes"].append(
                f"Partial extraction: {total_visible_cases}/{criminal_cases_data['declared_count']} cases visible. "
                f"{missing_cases} cases may be hidden or require additional page navigation."
            )
        else:
            criminal_cases_data["extraction_notes"].append(
                f"Extracted {total_visible_cases} cases, more than declared count of {criminal_cases_data['declared_count']}"
            )
    
    # 4. Check for "Click here for more details" link
    click_links = soup.find_all("a", string=lambda x: x and "click here" in x.lower())
    for link in click_links:
        href = link.get('href', '')
        if href:
            full_url = urljoin(source_url, href)
            criminal_cases_data["additional_details_url"] = full_url
            criminal_cases_data["extraction_notes"].append(f"Additional details may be available at: {full_url}")
            break
    
    return criminal_cases_data

def enhanced_scrape_myneta_candidate(candidate_url):
    """
    Enhanced scraping function with better criminal cases handling
    """
    print(f"🌐 Enhanced scraping: {candidate_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    session = requests.Session()
    session.headers.update(headers)
    
    try:
        response = session.get(candidate_url, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Basic candidate info
        page_title = soup.find('title')
        title_text = page_title.get_text(strip=True) if page_title else "No title"
        
        # Extract candidate name from title
        candidate_name = "Unknown"
        if "(" in title_text:
            candidate_name = title_text.split("(")[0].strip()
        
        print(f"   ✅ Candidate: {candidate_name}")
        
        # Enhanced criminal cases extraction
        criminal_cases_data = enhanced_criminal_cases_extraction(soup, candidate_url)
        
        # Build result with enhanced structure
        result = {
            "_source_url": candidate_url,
            "_scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "_page_title": title_text,
            "_candidate_name": candidate_name,
            
            # Enhanced criminal cases section
            "criminal_cases_summary": {
                "declared_total": criminal_cases_data["declared_count"],
                "visible_extracted": len(criminal_cases_data["visible_cases"]),
                "extraction_notes": criminal_cases_data["extraction_notes"],
                "additional_details_url": criminal_cases_data.get("additional_details_url", "")
            },
            
            "criminal_cases_details": criminal_cases_data["visible_cases"],
            
            # Debug information
            "_debug_info": {
                "tables_processed": len(soup.find_all('table')),
                "criminal_mentions": len(soup.find_all(string=re.compile(r'criminal', re.I))),
                "click_links_found": len(soup.find_all("a", string=lambda x: x and "click" in x.lower())),
                "extraction_success": len(criminal_cases_data["visible_cases"]) > 0
            }
        }
        
        # Add basic profile data (simplified for focus on criminal cases)
        basic_data = extract_basic_profile_data(soup, candidate_url)
        result.update(basic_data)
        
        return result
        
    except Exception as e:
        print(f"❌ Error scraping candidate: {e}")
        return None

def extract_basic_profile_data(soup, source_url):
    """
    Extract basic profile information (assets, party, etc.)
    """
    basic_data = {}
    
    # Find tables with candidate information
    tables = soup.find_all('table')
    
    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) == 2:
                key = cells[0].get_text(strip=True)
                value = cells[1].get_text(strip=True)
                
                # Store important fields with source URLs
                if key and value and len(key) > 2:
                    basic_data[key] = {
                        "value": value,
                        "sourceUrl": source_url
                    }
    
    return basic_data

if __name__ == "__main__":
    # Test with Rahul Gandhi
    url = "https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=2195"
    result = enhanced_scrape_myneta_candidate(url)
    
    if result:
        # Save enhanced result
        output_file = "enhanced_rahul_gandhi_criminal_cases.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n" + "="*80)
        print(f"🎯 ENHANCED EXTRACTION SUMMARY")
        print(f"   Candidate: {result['_candidate_name']}")
        print(f"   Declared criminal cases: {result['criminal_cases_summary']['declared_total']}")
        print(f"   Visible cases extracted: {result['criminal_cases_summary']['visible_extracted']}")
        print(f"   Extraction notes: {result['criminal_cases_summary']['extraction_notes']}")
        print(f"   Saved to: {output_file}")
        
        # Show sample cases
        if result['criminal_cases_details']:
            print(f"\n📋 SAMPLE CRIMINAL CASES:")
            for i, case in enumerate(result['criminal_cases_details'][:3]):
                print(f"   Case {case['case_number']}: {case['description'][:100]}...")
    else:
        print(f"❌ Failed to scrape candidate data")