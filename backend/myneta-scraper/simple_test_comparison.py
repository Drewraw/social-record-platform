#!/usr/bin/env python3
"""
Simple test to check if the comparison page is accessible and contains criminal cases
"""
import requests
from bs4 import BeautifulSoup
import time

def test_comparison_page():
    url = "https://www.myneta.info/compare_profile.php?group_id=rqohbcMW3xRXyaJDtuY"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"Testing comparison page: {url}")
    
    try:
        # Use session like the scraper does
        session = requests.Session()
        session.headers.update(headers)
        
        response = session.get(url, timeout=30)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Check page title
            title = soup.find('title')
            if title:
                print(f"Page title: {title.get_text(strip=True)}")
            
            # Count tables
            tables = soup.find_all('table')
            print(f"Tables found: {len(tables)}")
            
            # Look for criminal cases
            criminal_mentions = len(soup.find_all(string=lambda x: x and 'criminal' in x.lower()))
            print(f"'Criminal' mentions: {criminal_mentions}")
            
            # Look for case numbers (1, 2, 3, etc. in table cells)
            case_numbers = []
            for i in range(1, 26):
                cells = soup.find_all('td', string=str(i))
                if cells:
                    case_numbers.append(i)
            
            print(f"Numbered cases found (1-25): {case_numbers}")
            print(f"Total numbered cases: {len(case_numbers)}")
            
            # Sample a few case details
            if case_numbers:
                print("\nSample case details:")
                for case_num in case_numbers[:3]:  # Show first 3
                    td = soup.find('td', string=str(case_num))
                    if td:
                        row = td.find_parent('tr')
                        if row:
                            cells = row.find_all('td')
                            if len(cells) > 1:
                                case_text = cells[1].get_text(strip=True)
                                print(f"  Case {case_num}: {case_text[:100]}...")
            
        else:
            print(f"Failed to access page: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_comparison_page()