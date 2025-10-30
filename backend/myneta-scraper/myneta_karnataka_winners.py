# myneta_karnataka_winners.py
"""
MyNeta Karnataka 2023 Winners Scraper
Scrapes from the official winners list page instead of searching
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

def get_karnataka_winners_list():
    """
    Get list of all Karnataka 2023 election winners
    Returns: List of dicts with {name, constituency, party, profile_url}
    """
    print("\n🏛️  Fetching Karnataka 2023 Winners List...")
    
    winners_url = "https://myneta.info/Karnataka2023/index.php?action=show_winners&sort=default"
    resp = make_request(winners_url)
    soup = BeautifulSoup(resp.text, "lxml")
    
    winners = []
    
    # Find all table rows with candidate information
    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            # Look for candidate name links (usually in first or second td)
            link = tr.find("a", href=lambda x: x and "candidate.php" in x)
            if link:
                # Extract candidate info from row
                tds = tr.find_all("td")
                
                name = link.get_text(strip=True)
                profile_url = link["href"]
                
                # Make absolute URL
                if not profile_url.startswith("http"):
                    profile_url = "https://myneta.info/Karnataka2023/" + profile_url.lstrip("./")
                
                # Try to extract constituency and party from adjacent cells
                constituency = ""
                party = ""
                
                if len(tds) >= 2:
                    constituency = tds[1].get_text(strip=True) if len(tds) > 1 else ""
                if len(tds) >= 3:
                    party = tds[2].get_text(strip=True) if len(tds) > 2 else ""
                
                winners.append({
                    "name": name,
                    "constituency": constituency,
                    "party": party,
                    "profile_url": profile_url
                })
    
    print(f"✓ Found {len(winners)} Karnataka 2023 winners\n")
    return winners

def scrape_candidate_profile(url):
    """
    Scrape detailed profile from candidate page
    """
    print(f"\n📄 Scraping profile: {url}")
    
    resp = make_request(url)
    soup = BeautifulSoup(resp.text, "lxml")
    
    data = {
        "_source_url": url,
        "_scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "_election_year": "2023",
        "_state": "Karnataka"
    }
    
    # Extract page title
    title = soup.find("title")
    if title:
        data["_page_title"] = title.get_text(strip=True)
    
    # Parse all tables for key/value pairs
    field_count = 0
    
    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            tds = tr.find_all(["td", "th"])
            
            if len(tds) >= 2:
                key = tds[0].get_text(separator=" ", strip=True)
                val = tds[1].get_text(separator=" ", strip=True)
                
                if key and val and key != val:
                    # Store with source URL
                    data[key] = {
                        "value": val,
                        "sourceUrl": url
                    }
                    field_count += 1
    
    print(f"   ✓ Extracted {field_count} fields")
    
    # Extract affidavit PDF if present
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.lower().endswith(".pdf") or "affidavit" in href.lower():
            pdf_url = href if href.startswith("http") else "https://myneta.info/Karnataka2023/" + href.lstrip("./")
            data["affidavit_pdf"] = {
                "value": pdf_url,
                "sourceUrl": pdf_url
            }
            print(f"   📎 Found affidavit PDF: {pdf_url}")
            break
    
    return data

def find_and_scrape_candidate(candidate_name):
    """
    Find a specific candidate in winners list and scrape their profile
    """
    print(f"\n🔍 Searching for: {candidate_name}")
    
    # Get winners list
    winners = get_karnataka_winners_list()
    
    # Find matching candidate (case-insensitive partial match)
    matches = []
    search_name = candidate_name.lower()
    
    for winner in winners:
        if search_name in winner["name"].lower():
            matches.append(winner)
    
    if not matches:
        print(f"\n❌ No match found for '{candidate_name}' in winners list")
        return {
            "error": f"No winner found for: {candidate_name}",
            "search_name": candidate_name,
            "winners_url": "https://myneta.info/Karnataka2023/index.php?action=show_winners&sort=default"
        }
    
    if len(matches) > 1:
        print(f"\n⚠️  Found {len(matches)} matches:")
        for i, m in enumerate(matches):
            print(f"   {i+1}. {m['name']} ({m['constituency']}) - {m['party']}")
        print(f"\n   Using first match: {matches[0]['name']}")
    
    # Use first match
    winner = matches[0]
    print(f"\n✓ Found: {winner['name']} ({winner['constituency']}) - {winner['party']}")
    
    # Scrape full profile
    profile_data = scrape_candidate_profile(winner["profile_url"])
    
    # Add winner info to profile data
    profile_data["_winner_name"] = winner["name"]
    profile_data["_winner_constituency"] = winner["constituency"]
    profile_data["_winner_party"] = winner["party"]
    
    return profile_data

def get_all_karnataka_winners(output_file="karnataka_2023_winners.json"):
    """
    Scrape ALL Karnataka 2023 winners and save to JSON
    """
    print("\n" + "="*80)
    print("SCRAPING ALL KARNATAKA 2023 WINNERS")
    print("="*80)
    
    winners = get_karnataka_winners_list()
    all_profiles = []
    
    for i, winner in enumerate(winners, 1):
        print(f"\n[{i}/{len(winners)}] Scraping: {winner['name']} ({winner['constituency']})")
        
        try:
            profile = scrape_candidate_profile(winner["profile_url"])
            profile["_winner_name"] = winner["name"]
            profile["_winner_constituency"] = winner["constituency"]
            profile["_winner_party"] = winner["party"]
            all_profiles.append(profile)
            
            # Delay to avoid overwhelming server
            if i < len(winners):
                time.sleep(2)
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            all_profiles.append({
                "error": str(e),
                "_winner_name": winner["name"],
                "_winner_constituency": winner["constituency"]
            })
    
    # Save all profiles
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_profiles, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved {len(all_profiles)} profiles to: {output_file}")
    return all_profiles

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  python myneta_karnataka_winners.py <candidate_name>")
        print("  python myneta_karnataka_winners.py --all")
        print("\nExamples:")
        print("  python myneta_karnataka_winners.py 'Suresh Kumar'")
        print("  python myneta_karnataka_winners.py 'Sowmya Reddy'")
        print("  python myneta_karnataka_winners.py --all  # Scrape all winners")
        sys.exit(1)
    
    if sys.argv[1] == "--all":
        # Scrape all winners
        get_all_karnataka_winners()
    else:
        # Scrape specific candidate
        candidate_name = sys.argv[1]
        result = find_and_scrape_candidate(candidate_name)
        
        # Save to JSON file
        safe_name = candidate_name.lower().replace(" ", "_")
        output_file = f"myneta_{safe_name}_karnataka_2023_0.json"
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Saved to: {output_file}")
