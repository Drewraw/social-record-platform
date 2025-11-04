# Test script to check comparison page scraping
import requests
from bs4 import BeautifulSoup
import json
import time

def test_comparison_page():
    url = "https://www.myneta.info/compare_profile.php?group_id=ePH7YVorTmeLB3c9EmDT"
    
    print(f"Testing comparison page: {url}")
    
    try:
        resp = requests.get(url, timeout=15)
        print(f"Status code: {resp.status_code}")
        
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "lxml")
            
            # Find all tables
            tables = soup.find_all("table")
            print(f"Found {len(tables)} tables")
            
            data = []
            for table_idx, table in enumerate(tables):
                print(f"\nTable {table_idx + 1}:")
                
                rows = table.find_all("tr")
                print(f"  Rows: {len(rows)}")
                
                for row_idx, tr in enumerate(rows[:5]):  # Show first 5 rows
                    cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                    if cells:
                        print(f"    Row {row_idx}: {cells}")
                        data.append({
                            "table": table_idx,
                            "row": row_idx,
                            "cells": cells
                        })
            
            # Save sample data
            with open("test_comparison_output.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"\nSaved sample data to test_comparison_output.json")
            print(f"Total extracted rows: {len(data)}")
            
        else:
            print(f"Failed with status code: {resp.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_comparison_page()