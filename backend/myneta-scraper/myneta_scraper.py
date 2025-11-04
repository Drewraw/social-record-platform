# myneta_scraper.py
"""
Universal MyNeta.info Scraper - Extract politician data from MyNeta search results
Enhanced with "Other Elections" and comparison data scraping
Uses requests + BeautifulSoup (fast & lightweight approach)
"""
import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import quote_plus
import sys
import io
import re
import pandas as pd
import wikipedia
from SPARQLWrapper import SPARQLWrapper, JSON
import urllib.parse
import os

# Fix Windows console encoding for emojis
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyNetaScraper/2.0 "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

def get_output_directory():
    """
    Get the correct output directory for JSON files
    Files should be saved in backend/datascraper/ directory
    """
    # Get the directory where this script is located (backend/myneta-scraper/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level to backend/ then into datascraper/
    output_dir = os.path.join(os.path.dirname(script_dir), 'datascraper')
    
    # Create the directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    return output_dir

def sanitize_filename(filename):
    """
    Sanitize filename to be valid on Windows
    Remove or replace invalid characters: < > : " | ? * \
    """
    # Replace invalid characters with underscores
    invalid_chars = '<>:"|?*\\'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Also replace forward slashes
    filename = filename.replace('/', '_')
    
    # Replace multiple underscores with single
    filename = re.sub('_+', '_', filename)
    
    # Remove leading/trailing underscores and dots
    filename = filename.strip('_.')
    
    return filename

def get_output_filepath(filename):
    """
    Get the full path for output JSON file in datascraper directory
    """
    output_dir = get_output_directory()
    sanitized_filename = sanitize_filename(filename)
    return os.path.join(output_dir, sanitized_filename)

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

def extract_criminal_cases_count(soup, source_url):
    """
    Simple extraction of just the criminal cases count from the most recent year
    """
    print(f"   🔍 Extracting criminal cases count...")
    
    # Find the "Number of Criminal Cases: X" declaration
    declared_count_element = soup.find(string=re.compile(r'Number of Criminal Cases.*?(\d+)', re.I))
    if declared_count_element:
        match = re.search(r'(\d+)', declared_count_element)
        if match:
            criminal_cases_count = int(match.group(1))
            print(f"      ✅ Criminal cases (most recent): {criminal_cases_count}")
            return criminal_cases_count
    
    # Fallback: look for bold number near "Criminal Cases" text
    for element in soup.find_all(['span', 'b', 'strong']):
        if element.get('style') and 'font-weight:bold' in element.get('style'):
            text = element.get_text(strip=True)
            if text.isdigit():
                # Check if this number is near criminal cases text
                parent_text = ""
                if element.parent:
                    parent_text = element.parent.get_text().lower()
                if 'criminal' in parent_text and 'cases' in parent_text:
                    criminal_cases_count = int(text)
                    print(f"      ✅ Criminal cases (fallback): {criminal_cases_count}")
                    return criminal_cases_count
    
    print(f"      ❌ Could not find criminal cases count")
    return 0

def search_wikidata_for_politician(politician_name):
    """
    Search Wikidata for structured political information
    SECONDARY SOURCE: Only used to fill gaps where MyNeta data is missing
    """
    print(f"   🔍 Searching Wikidata (secondary source) for: {politician_name}")
    
    try:
        sparql = SPARQLWrapper("https://query.wikidata.org/sparql")
        
        # SPARQL query to find politician by name
        query = f"""
        SELECT ?person ?personLabel ?partyLabel ?positionLabel ?constituencyLabel 
               ?birthDate ?educationLabel ?spouseLabel ?childrenLabel ?fatherLabel ?motherLabel
        WHERE {{
          ?person ?label "{politician_name}"@en .
          ?person wdt:P31 wd:Q5 .  # human
          ?person wdt:P106 ?occupation .
          ?occupation wdt:P279* wd:Q82955 .  # politician or subclass
          
          OPTIONAL {{ ?person wdt:P102 ?party . }}
          OPTIONAL {{ ?person wdt:P39 ?position . }}
          OPTIONAL {{ ?person wdt:P768 ?constituency . }}
          OPTIONAL {{ ?person wdt:P569 ?birthDate . }}
          OPTIONAL {{ ?person wdt:P69 ?education . }}
          OPTIONAL {{ ?person wdt:P26 ?spouse . }}
          OPTIONAL {{ ?person wdt:P40 ?children . }}
          OPTIONAL {{ ?person wdt:P22 ?father . }}
          OPTIONAL {{ ?person wdt:P25 ?mother . }}
          
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        }}
        LIMIT 1
        """
        
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()
        
        if results["results"]["bindings"]:
            result = results["results"]["bindings"][0]
            print(f"      ✅ Found Wikidata entry for: {politician_name}")
            return result
        else:
            print(f"      ⚠️ No Wikidata entry found for: {politician_name}")
            return None
            
    except Exception as e:
        print(f"      ❌ Wikidata search error: {e}")
        return None

def extract_wikidata_fields(wikidata_result, politician_name):
    """
    Extract structured data from Wikidata result
    SECONDARY SOURCE: Only extracts data to supplement missing MyNeta fields
    """
    if not wikidata_result:
        return {}
    
    print(f"   📊 Extracting supplementary data from Wikidata (secondary source)...")
    
    wikidata_fields = {}
    
    try:
        # Extract party information
        if "partyLabel" in wikidata_result and wikidata_result["partyLabel"]["value"]:
            party = wikidata_result["partyLabel"]["value"]
            wikidata_fields["Political Party"] = {
                "value": party,
                "sourceUrl": "https://www.wikidata.org"
            }
            print(f"      ✅ Political Party: {party}")
        
        # Extract position/office
        if "positionLabel" in wikidata_result and wikidata_result["positionLabel"]["value"]:
            position = wikidata_result["positionLabel"]["value"]
            wikidata_fields["Political Position"] = {
                "value": position,
                "sourceUrl": "https://www.wikidata.org"
            }
            print(f"      ✅ Political Position: {position}")
        
        # Extract constituency
        if "constituencyLabel" in wikidata_result and wikidata_result["constituencyLabel"]["value"]:
            constituency = wikidata_result["constituencyLabel"]["value"]
            wikidata_fields["Electoral Constituency"] = {
                "value": constituency,
                "sourceUrl": "https://www.wikidata.org"
            }
            print(f"      ✅ Electoral Constituency: {constituency}")
        
        # Extract birth date and calculate age
        if "birthDate" in wikidata_result and wikidata_result["birthDate"]["value"]:
            birth_date = wikidata_result["birthDate"]["value"]
            wikidata_fields["Birth Date"] = {
                "value": birth_date,
                "sourceUrl": "https://www.wikidata.org"
            }
            
            # Calculate age
            try:
                from datetime import datetime
                birth_year = int(birth_date.split("-")[0])
                current_year = datetime.now().year
                age = current_year - birth_year
                wikidata_fields["Calculated Age"] = {
                    "value": str(age),
                    "sourceUrl": "https://www.wikidata.org"
                }
                print(f"      ✅ Birth Date: {birth_date} (Age: {age})")
            except:
                print(f"      ✅ Birth Date: {birth_date}")
        
        # Extract education
        if "educationLabel" in wikidata_result and wikidata_result["educationLabel"]["value"]:
            education = wikidata_result["educationLabel"]["value"]
            wikidata_fields["Educational Institution"] = {
                "value": education,
                "sourceUrl": "https://www.wikidata.org"
            }
            print(f"      ✅ Educational Institution: {education}")
        
        # Extract family information for dynasty analysis
        family_members = []
        
        if "fatherLabel" in wikidata_result and wikidata_result["fatherLabel"]["value"]:
            father = wikidata_result["fatherLabel"]["value"]
            family_members.append(f"Father: {father}")
        
        if "motherLabel" in wikidata_result and wikidata_result["motherLabel"]["value"]:
            mother = wikidata_result["motherLabel"]["value"]
            family_members.append(f"Mother: {mother}")
        
        if "spouseLabel" in wikidata_result and wikidata_result["spouseLabel"]["value"]:
            spouse = wikidata_result["spouseLabel"]["value"]
            family_members.append(f"Spouse: {spouse}")
        
        if "childrenLabel" in wikidata_result and wikidata_result["childrenLabel"]["value"]:
            children = wikidata_result["childrenLabel"]["value"]
            family_members.append(f"Children: {children}")
        
        if family_members:
            wikidata_fields["Family Members"] = {
                "value": "; ".join(family_members),
                "sourceUrl": "https://www.wikidata.org"
            }
            print(f"      ✅ Family Members: {len(family_members)} found")
        
        return wikidata_fields
        
    except Exception as e:
        print(f"      ❌ Error extracting Wikidata fields: {e}")
        return {}

def search_wikipedia_for_politician(politician_name):
    """
    Search Wikipedia for politician information to fill missing fields
    TERTIARY SOURCE: Only used after MyNeta and Wikidata to fill remaining gaps
    """
    print(f"   🔍 Searching Wikipedia (tertiary source) for: {politician_name}")
    
    try:
        # Set Wikipedia language to English
        wikipedia.set_lang("en")
        
        # Search for the politician
        search_results = wikipedia.search(politician_name + " politician", results=5)
        
        if not search_results:
            # Try without "politician" keyword
            search_results = wikipedia.search(politician_name, results=3)
        
        if not search_results:
            print(f"      ❌ No Wikipedia results found for: {politician_name}")
            return None
        
        # Try the first few results to find the right page
        for result in search_results[:3]:
            try:
                page = wikipedia.page(result)
                
                # Check if this is likely the right person (contains political keywords)
                summary = page.summary.lower()
                if any(keyword in summary for keyword in ['politician', 'member of parliament', 'congress', 'minister', 'election', 'political']):
                    print(f"      ✅ Found Wikipedia page: {page.title}")
                    return page
                
            except wikipedia.exceptions.DisambiguationError as e:
                # Try the first disambiguation option
                try:
                    page = wikipedia.page(e.options[0])
                    print(f"      ✅ Found Wikipedia page (disambiguated): {page.title}")
                    return page
                except:
                    continue
            except:
                continue
        
        print(f"      ⚠️ No suitable Wikipedia page found for: {politician_name}")
        return None
        
    except Exception as e:
        print(f"      ❌ Wikipedia search error: {e}")
        return None

def extract_wikipedia_fields(wiki_page, politician_name):
    """
    Extract missing fields from Wikipedia page
    TERTIARY SOURCE: Only extracts data for fields still missing after MyNeta + Wikidata
    """
    if not wiki_page:
        return {}
    
    print(f"   📖 Extracting supplementary data from Wikipedia (tertiary source)...")
    
    wikipedia_data = {}
    summary = wiki_page.summary
    content = wiki_page.content
    
    try:
        # Extract dynasty/family information
        dynasty_keywords = ['son of', 'daughter of', 'grandson of', 'granddaughter of', 'nephew of', 'niece of', 
                          'political family', 'dynasty', 'father was', 'mother was', 'political legacy']
        
        dynasty_found = False
        for keyword in dynasty_keywords:
            if keyword in summary.lower() or keyword in content.lower():
                dynasty_found = True
                break
        
        wikipedia_data["Dynasty Status"] = {
            "value": "Yes" if dynasty_found else "No",
            "sourceUrl": wiki_page.url
        }
        print(f"      ✅ Dynasty Status: {'Yes' if dynasty_found else 'No'}")
        
        # Extract political relatives from content
        relatives = []
        relative_patterns = [
            r'(son|daughter|grandson|granddaughter|nephew|niece) of ([A-Z][a-z]+ [A-Z][a-z]+)',
            r'(father|mother|grandfather|grandmother|uncle|aunt) ([A-Z][a-z]+ [A-Z][a-z]+)',
            r'married to ([A-Z][a-z]+ [A-Z][a-z]+)',
            r'his (father|mother|brother|sister|wife|husband) ([A-Z][a-z]+ [A-Z][a-z]+)'
        ]
        
        for pattern in relative_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches[:3]:  # Limit to first 3 relatives
                if len(match) == 2:
                    relation, relative_name = match
                    relatives.append(f"{relative_name} ({relation})")
        
        if relatives:
            wikipedia_data["Political Relatives"] = {
                "value": "; ".join(relatives),
                "sourceUrl": wiki_page.url
            }
            print(f"      ✅ Political Relatives: {len(relatives)} found")
        
        # Extract better education details
        education_patterns = [
            r'graduated from ([^.,]+)',
            r'studied at ([^.,]+)',
            r'degree from ([^.,]+)',
            r'alumni of ([^.,]+)',
            r'education at ([^.,]+)'
        ]
        
        for pattern in education_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                education = match.group(1).strip()
                if len(education) > 10 and len(education) < 100:  # Reasonable length
                    wikipedia_data["Education Details"] = {
                        "value": education,
                        "sourceUrl": wiki_page.url
                    }
                    print(f"      ✅ Education Details: {education[:50]}...")
                    break
        
        # Extract profession/background
        profession_patterns = [
            r'is an? ([^.,]+) and politician',
            r'before entering politics.*?was an? ([^.,]+)',
            r'worked as an? ([^.,]+)',
            r'profession.*?([^.,]+) before'
        ]
        
        for pattern in profession_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                profession = match.group(1).strip()
                if len(profession) > 5 and len(profession) < 50:
                    wikipedia_data["Profession"] = {
                        "value": profession,
                        "sourceUrl": wiki_page.url
                    }
                    print(f"      ✅ Profession: {profession}")
                    break
        
        # Extract age/birth year if missing
        birth_patterns = [
            r'born.*?(\d{1,2}\s+\w+\s+\d{4})',
            r'\(born.*?(\d{4})\)',
            r'age (\d{2})',
            r'(\d{4}).*?birth'
        ]
        
        for pattern in birth_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                birth_info = match.group(1).strip()
                wikipedia_data["Birth Info"] = {
                    "value": birth_info,
                    "sourceUrl": wiki_page.url
                }
                print(f"      ✅ Birth Info: {birth_info}")
                break
        
        # Extract constituency details
        constituency_patterns = [
            r'represents? ([^.,]+) constituency',
            r'elected from ([^.,]+)',
            r'member.*?from ([^.,]+)'
        ]
        
        for pattern in constituency_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                constituency = match.group(1).strip()
                if len(constituency) > 5 and len(constituency) < 50:
                    wikipedia_data["Constituency Details"] = {
                        "value": constituency,
                        "sourceUrl": wiki_page.url
                    }
                    print(f"      ✅ Constituency Details: {constituency}")
                    break
        
        # Extract image URL from Wikipedia page
        try:
            if hasattr(wiki_page, 'images') and wiki_page.images:
                # Look for the main page image (usually the first one that's not an icon)
                for image_url in wiki_page.images[:5]:  # Check first 5 images
                    if image_url and any(ext in image_url.lower() for ext in ['.jpg', '.jpeg', '.png']):
                        # Skip small icons and logos
                        if not any(skip in image_url.lower() for skip in [
                            'commons-logo', 'wiki.png', 'edit-icon', 'wikimedia',
                            'commons.wikimedia.org/wiki/File:Commons-logo',
                            'upload.wikimedia.org/wikipedia/commons/thumb'
                        ]):
                            wikipedia_data["Wikipedia Image"] = {
                                "value": image_url,
                                "sourceUrl": wiki_page.url
                            }
                            print(f"      🖼️ Wikipedia Image: {image_url}")
                            break
        except Exception as img_error:
            print(f"      ⚠️ Could not extract Wikipedia image: {img_error}")
        
        return wikipedia_data
        
    except Exception as e:
        print(f"      ❌ Error extracting Wikipedia data: {e}")
        return {}

def extract_derived_fields(data, soup, url):
    """
    Extract essential derived fields like position, state from existing data
    """
    print(f"   🔍 Extracting derived fields...")
    
    candidate_name = None
    
    # Extract candidate name from page title
    title = soup.find("title")
    if title:
        title_text = title.get_text(strip=True)
        
        # Extract candidate name (before first parenthesis)
        if "(" in title_text:
            name = title_text.split("(")[0].strip()
            candidate_name = name
            data["Name"] = {
                "value": name,
                "sourceUrl": url
            }
            print(f"      ✅ Name: {name}")
        
        # Extract state from title (like "WAYANAD(KERALA)")
        state_match = re.search(r'\(([A-Z\s]+)\)', title_text)
        if state_match:
            state = state_match.group(1).strip()
            data["State"] = {
                "value": state,
                "sourceUrl": url
            }
            print(f"      ✅ State: {state}")
    
    # Set default position (most politicians on MyNeta are MPs or MLAs)
    if "Lok Sabha" in url or "LokSabha" in url:
        data["Position"] = {
            "value": "Member of Parliament",
            "sourceUrl": url
        }
        print(f"      ✅ Position: Member of Parliament")
    elif "Assembly" in url or "MLA" in url:
        data["Position"] = {
            "value": "Member of Legislative Assembly",
            "sourceUrl": url
        }
        print(f"      ✅ Position: Member of Legislative Assembly")
    
    # Extract party from title (between parentheses)
    title = soup.find("title")
    if title:
        title_text = title.get_text(strip=True)
        party_match = re.search(r'\(([^)]+)\):', title_text)
        if party_match:
            party = party_match.group(1).strip()
            data["Party"] = {
                "value": party,
                "sourceUrl": url
            }
            print(f"      ✅ Party: {party}")
    
    # Use Wikipedia and Wikidata ONLY to fill missing fields after MyNeta extraction
    if candidate_name:
        print(f"   📋 MyNeta extraction complete. Checking for missing fields...")
        
        # Count how many fields MyNeta provided
        myneta_fields = len([k for k in data.keys() if not k.startswith('_')])
        print(f"      ✅ MyNeta provided {myneta_fields} fields")
        
        # Define essential fields that should be present for a complete profile
        essential_fields = [
            'Name', 'Party', 'Position', 'State', 'Criminal Cases', 
            'Education', 'Age', 'Dynasty Status', 'Political Relatives'
        ]
        
        missing_fields = [field for field in essential_fields if field not in data]
        
        if missing_fields:
            print(f"      ⚠️ Missing fields: {', '.join(missing_fields)}")
            print(f"      🔍 Attempting to fill gaps with Wikidata (structured data)...")
            
            # Try Wikidata for structured data ONLY for missing fields
            wikidata_result = search_wikidata_for_politician(candidate_name)
            if wikidata_result:
                wikidata_fields = extract_wikidata_fields(wikidata_result, candidate_name)
                
                filled_count = 0
                for key, value in wikidata_fields.items():
                    if key not in data:  # STRICT: Only add if MyNeta doesn't have it
                        data[key] = value
                        filled_count += 1
                
                if filled_count > 0:
                    print(f"      ✅ Wikidata filled {filled_count} missing fields")
                else:
                    print(f"      ❌ Wikidata couldn't fill any missing fields")
            
            # Check what's still missing after Wikidata
            still_missing = [field for field in essential_fields if field not in data]
            
            if still_missing:
                print(f"      ⚠️ Still missing: {', '.join(still_missing)}")
                print(f"      🔍 Attempting to fill remaining gaps with Wikipedia...")
                
                # Try Wikipedia for narrative data ONLY for remaining missing fields
                wiki_page = search_wikipedia_for_politician(candidate_name)
                if wiki_page:
                    wikipedia_data = extract_wikipedia_fields(wiki_page, candidate_name)
                    
                    wiki_filled = 0
                    for key, value in wikipedia_data.items():
                        if key not in data:  # STRICT: Only add if not in MyNeta OR Wikidata
                            data[key] = value
                            wiki_filled += 1
                    
                    if wiki_filled > 0:
                        print(f"      ✅ Wikipedia filled {wiki_filled} remaining fields")
                    else:
                        print(f"      ❌ Wikipedia couldn't fill remaining fields")
        
        else:
            print(f"      ✅ MyNeta provided all essential fields - no external sources needed")
        
        # Final summary
        final_fields = len([k for k in data.keys() if not k.startswith('_')])
        external_fields = final_fields - myneta_fields
        
        print(f"   📊 FINAL SUMMARY:")
        print(f"      🏛️ MyNeta fields: {myneta_fields}")
        print(f"      🌐 External fields: {external_fields}")
        print(f"      📋 Total fields: {final_fields}")

def extract_candidate_image(soup, base_url, source_url):
    """
    Extract candidate image/photo from MyNeta page
    """
    print(f"   🖼️ Looking for candidate image...")
    
    # Common image selectors on MyNeta pages
    image_selectors = [
        # Direct img tags
        'img[src*="candidate"]',
        'img[src*="photo"]', 
        'img[src*="image"]',
        'img[alt*="candidate"]',
        'img[alt*="photo"]',
        # Images in specific table cells or containers
        'td img',
        'table img',
        # Images with common candidate photo patterns
        'img[src*=".jpg"]',
        'img[src*=".jpeg"]',
        'img[src*=".png"]'
    ]
    
    for selector in image_selectors:
        images = soup.select(selector)
        for img in images:
            src = img.get('src')
            alt = img.get('alt', '')
            
            if src:
                # Skip small icons, logos, and UI elements
                if any(skip in src.lower() for skip in [
                    'icon', 'logo', 'arrow', 'bullet', 'button', 
                    'banner', 'menu', 'nav', 'footer', 'header'
                ]):
                    continue
                
                # Skip very small images (likely icons)
                width = img.get('width')
                height = img.get('height')
                if width and height:
                    try:
                        w, h = int(width), int(height)
                        if w < 50 or h < 50:  # Skip images smaller than 50x50
                            continue
                    except ValueError:
                        pass
                
                # Convert relative URLs to absolute
                if src.startswith('//'):
                    image_url = 'https:' + src
                elif src.startswith('/'):
                    image_url = base_url.rstrip('/') + src
                elif src.startswith('http'):
                    image_url = src
                else:
                    image_url = base_url.rstrip('/') + '/' + src.lstrip('./')
                
                # Prioritize images with candidate-related alt text or file names
                if any(keyword in (alt + src).lower() for keyword in [
                    'candidate', 'photo', 'profile', 'picture'
                ]):
                    print(f"      ✅ Found candidate image (priority): {image_url}")
                    return image_url
                
                # Store as potential candidate image
                print(f"      📷 Found potential image: {image_url}")
                return image_url
    
    print(f"      ❌ No candidate image found")
    return None

def scrape_other_elections(soup, base_url, session):
    """
    Scrape "Other Elections" section and follow the single "Click here for more details" link
    """
    print(f"   🔍 Looking for Other Elections section...")
    other_elections = []
    comparison_data = []
    
    # Find "Other Elections" table - try multiple patterns
    section = None
    
    # Pattern 1: Bold text with "Other Elections"
    section = soup.find("b", string=re.compile(r"Other Elections", re.I))
    
    # Pattern 2: TD cell with "Other Elections"
    if not section:
        section = soup.find("td", string=re.compile(r"Other Elections", re.I))
    
    # Pattern 3: Any element with "Other Elections" text
    if not section:
        section = soup.find(string=re.compile(r"Other Elections", re.I))
        if section:
            section = section.parent if hasattr(section, 'parent') else None
    
    # Pattern 4: Look for similar variations
    if not section:
        for pattern in ["Previous Elections", "Earlier Elections", "Past Elections", "Election History"]:
            section = soup.find("b", string=re.compile(pattern, re.I))
            if section:
                print(f"      ✓ Found section with pattern: {pattern}")
                break
    
    # Pattern 5: Search in all text for election-related tables
    if not section:
        for element in soup.find_all(["b", "td", "th", "div", "span"]):
            text = element.get_text(strip=True)
            if any(keyword in text.lower() for keyword in ["other election", "previous election", "past election", "election history"]):
                section = element
                print(f"      ✓ Found section with text: {text[:50]}...")
                break
    
    if section:
        print(f"   ✓ Found Other Elections section")
        table = section.find_parent("table")
        if table:
            # Extract election data from table rows
            rows = table.find_all("tr")[1:]  # Skip header row
            for row in rows:
                cols = [c.get_text(strip=True) for c in row.find_all("td")]
                if len(cols) >= 3:
                    election_data = {
                        "Election": cols[0],
                        "Declared Assets": cols[1],
                        "Declared Cases": cols[2]
                    }
                    other_elections.append(election_data)
            
            # Look for the single "Click here for more details" link below the table
            details_link = None
            
            # Search in the table and nearby elements for the details link
            for link in table.find_all("a", string=lambda x: x and "Click here" in x):
                href = link.get("href")
                if href:
                    if href.startswith("http"):
                        details_link = href
                    elif href.startswith("compare_profile.php") or "compare_profile.php" in href:
                        # Comparison URLs should be at root level, not state-specific
                        details_link = "https://www.myneta.info/" + href.lstrip("./")
                    else:
                        details_link = base_url + href.lstrip("./")
                    break
            
            # If not found in table, search in the parent container
            if not details_link:
                parent_container = table.find_parent()
                if parent_container:
                    for link in parent_container.find_all("a", string=lambda x: x and "Click here" in x):
                        href = link.get("href")
                        if href:
                            if href.startswith("http"):
                                details_link = href
                            elif href.startswith("compare_profile.php") or "compare_profile.php" in href:
                                # Comparison URLs should be at root level, not state-specific
                                details_link = "https://www.myneta.info/" + href.lstrip("./")
                            else:
                                details_link = base_url + href.lstrip("./")
                            break
            
            # Follow the single comparison link if found
            if details_link:
                print(f"      ↳ Found details link: {details_link}")
                
                # Validate the URL before trying to scrape it
                if "compare_profile.php" in details_link or "candidate.php" in details_link:
                    try:
                        compare_data = scrape_comparison_page(details_link, session, "All Elections")
                        if compare_data:
                            comparison_data.extend(compare_data)
                            print(f"      ✅ Successfully scraped {len(compare_data)} comparison records")
                        else:
                            print(f"      ℹ️ No comparison data found on the linked page")
                        
                        # Add the details URL to the data for reference
                        for election in other_elections:
                            election["Details URL"] = details_link
                            
                    except Exception as e:
                        print(f"      ⚠️ Failed to scrape comparison page: {str(e)}")
                        print(f"      🔗 Problematic URL: {details_link}")
                else:
                    print(f"      ⚠️ Skipping invalid or unexpected link format: {details_link}")
                
                time.sleep(1)  # Rate limiting
            else:
                print(f"      ⏭️  No 'Click here for more details' link found")
        
        print(f"   ✓ Found {len(other_elections)} other elections")
        if comparison_data:
            print(f"   ✓ Extracted {len(comparison_data)} comparison records")
    else:
        print(f"   ⏭️  No Other Elections section found")
    
    return other_elections, comparison_data

def analyze_criminal_cases_conviction_status(comparison_data):
    """
    Analyze criminal cases data from comparison tables to extract conviction status
    Looks for tables containing criminal case details and conviction information
    Key Logic: If no conviction box found or conviction box is empty = ZERO convictions
    """
    conviction_analysis = {
        "total_cases": 0,
        "convicted_cases": 0,
        "pending_cases": 0,
        "acquitted_cases": 0,
        "detailed_cases": [],
        "conviction_status": "Unknown",
        "conviction_box_found": False,
        "conviction_box_empty": False
    }
    
    print(f"      🔍 Analyzing criminal cases for conviction status...")
    
    # First, look for conviction-related sections/boxes
    conviction_section_found = False
    conviction_data_found = False
    
    for row in comparison_data:
        cells = row.get("cells", [])
        
        # Check if this row contains conviction-related headers or labels
        for cell in cells:
            cell_lower = cell.lower()
            if any(term in cell_lower for term in ["conviction", "convicted", "sentence", "punishment"]):
                conviction_section_found = True
                conviction_analysis["conviction_box_found"] = True
                print(f"         📋 Found conviction section: {cell[:50]}...")
                
                # Check if the conviction section has actual data
                for other_cell in cells:
                    other_cell_clean = other_cell.strip().lower()
                    if other_cell_clean and other_cell_clean not in ["conviction", "convicted", "sentence", "punishment", "-", "nil", "none", "na", "n/a"]:
                        conviction_data_found = True
                        break
        
        # Look for criminal case details in various table formats
        for i, cell in enumerate(cells):
            cell_lower = cell.lower()
            
            # Look for conviction status keywords
            if any(keyword in cell_lower for keyword in ["convicted", "conviction", "guilty"]) and len(cell.strip()) > 10:
                conviction_analysis["convicted_cases"] += 1
                conviction_analysis["detailed_cases"].append({
                    "case_info": cell,
                    "status": "Convicted",
                    "table_index": row.get("table_index"),
                    "row_index": row.get("row_index")
                })
                print(f"         ⚖️ Found convicted case: {cell[:50]}...")
                conviction_data_found = True
                
            elif any(keyword in cell_lower for keyword in ["acquitted", "discharged", "not guilty"]) and len(cell.strip()) > 10:
                conviction_analysis["acquitted_cases"] += 1 
                conviction_analysis["detailed_cases"].append({
                    "case_info": cell,
                    "status": "Acquitted",
                    "table_index": row.get("table_index"),
                    "row_index": row.get("row_index")
                })
                print(f"         ✅ Found acquitted case: {cell[:50]}...")
                conviction_data_found = True
                
            elif any(keyword in cell_lower for keyword in ["pending", "under trial", "ongoing", "not disposed"]) and len(cell.strip()) > 10:
                conviction_analysis["pending_cases"] += 1
                conviction_analysis["detailed_cases"].append({
                    "case_info": cell,
                    "status": "Pending",
                    "table_index": row.get("table_index"),
                    "row_index": row.get("row_index")
                })
                print(f"         ⏳ Found pending case: {cell[:50]}...")
                conviction_data_found = True
            
            # Look for case numbers or FIR numbers to identify case rows
            elif re.search(r'(fir|case|cr\.?\s*no|complaint|charges?)', cell_lower) and len(cell) > 10:
                conviction_analysis["detailed_cases"].append({
                    "case_info": cell,
                    "status": "Status Unknown",
                    "table_index": row.get("table_index"),
                    "row_index": row.get("row_index")
                })
                print(f"         📋 Found case details: {cell[:50]}...")
    
    # Set conviction box status
    if conviction_section_found and not conviction_data_found:
        conviction_analysis["conviction_box_empty"] = True
        print(f"         ✅ Conviction box found but EMPTY - indicating ZERO convictions")
    elif not conviction_section_found:
        print(f"         ✅ No conviction box found - indicating ZERO convictions")
    
    # Calculate totals
    conviction_analysis["total_cases"] = len(conviction_analysis["detailed_cases"])
    
    # Determine overall conviction status with special handling for zero convictions
    if conviction_analysis["conviction_box_found"] and conviction_analysis["conviction_box_empty"]:
        conviction_analysis["conviction_status"] = "Zero Convictions (Empty conviction box)"
    elif not conviction_analysis["conviction_box_found"] and conviction_analysis["convicted_cases"] == 0:
        conviction_analysis["conviction_status"] = "Zero Convictions (No conviction box found)"
    elif conviction_analysis["convicted_cases"] > 0:
        if conviction_analysis["pending_cases"] > 0:
            conviction_analysis["conviction_status"] = f"Some Convicted ({conviction_analysis['convicted_cases']} convicted, {conviction_analysis['pending_cases']} pending)"
        else:
            conviction_analysis["conviction_status"] = f"Convicted ({conviction_analysis['convicted_cases']} cases)"
    elif conviction_analysis["acquitted_cases"] > 0:
        if conviction_analysis["pending_cases"] > 0:
            conviction_analysis["conviction_status"] = f"Some Acquitted ({conviction_analysis['acquitted_cases']} acquitted, {conviction_analysis['pending_cases']} pending)"
        else:
            conviction_analysis["conviction_status"] = f"Acquitted ({conviction_analysis['acquitted_cases']} cases)"
    elif conviction_analysis["pending_cases"] > 0:
        conviction_analysis["conviction_status"] = f"All Pending ({conviction_analysis['pending_cases']} cases)"
    elif conviction_analysis["total_cases"] == 0 and conviction_analysis["convicted_cases"] == 0:
        conviction_analysis["conviction_status"] = "Zero Convictions (No conviction data found)"
    else:
        conviction_analysis["conviction_status"] = "Status Unknown"
    
    print(f"      📊 Conviction Analysis: {conviction_analysis['conviction_status']}")
    
    return conviction_analysis

def enhance_criminal_cases_with_conviction_status(main_data, comparison_data):
    """
    Enhance criminal cases information with conviction status from comparison data
    Creates a comprehensive criminal cases summary with conviction details
    """
    enhanced_cases = {
        "total_cases_count": 0,
        "cases_with_conviction_status": "Unknown",
        "conviction_breakdown": {
            "convicted": 0,
            "pending": 0,
            "acquitted": 0,
            "unknown": 0
        },
        "detailed_summary": "",
        "source_info": "Enhanced from MyNeta comparison data"
    }
    
    print(f"      🔍 Enhancing criminal cases with conviction status...")
    
    # Extract basic criminal cases count from main data
    basic_cases_count = 0
    for key, field_data in main_data.items():
        if isinstance(field_data, dict) and "value" in field_data:
            field_key = key.lower()
            field_value = field_data["value"].lower()
            
            if any(term in field_key for term in ["criminal", "cases", "declared cases"]):
                # Try to extract number from the value
                case_match = re.search(r'(\d+)', field_data["value"])
                if case_match:
                    basic_cases_count = int(case_match.group(1))
                    print(f"         📊 Found {basic_cases_count} cases in main data")
                    break
    
    enhanced_cases["total_cases_count"] = basic_cases_count
    
    # Analyze conviction status from comparison data
    conviction_analysis = None
    if comparison_data:
        for row in comparison_data:
            if isinstance(row, dict) and "_conviction_analysis" in row:
                conviction_analysis = row["_conviction_analysis"]
                break
        
        # If no analysis found, create one
        if not conviction_analysis:
            conviction_analysis = analyze_criminal_cases_conviction_status(comparison_data)
    
    # Build enhanced criminal cases summary
    if conviction_analysis:
        enhanced_cases["conviction_breakdown"] = {
            "convicted": conviction_analysis.get("convicted_cases", 0),
            "pending": conviction_analysis.get("pending_cases", 0),
            "acquitted": conviction_analysis.get("acquitted_cases", 0),
            "unknown": max(0, basic_cases_count - conviction_analysis.get("convicted_cases", 0) - 
                          conviction_analysis.get("pending_cases", 0) - conviction_analysis.get("acquitted_cases", 0))
        }
        
        enhanced_cases["cases_with_conviction_status"] = conviction_analysis.get("conviction_status", "Unknown")
        
        # Create detailed summary with special handling for zero convictions
        if basic_cases_count > 0:
            summary_parts = [f"Total Cases: {basic_cases_count}"]
            
            # Check for zero convictions scenario
            if "Zero Convictions" in conviction_analysis.get("conviction_status", ""):
                summary_parts.append("Convictions: 0")
            else:
                if conviction_analysis.get("convicted_cases", 0) > 0:
                    summary_parts.append(f"Convicted: {conviction_analysis['convicted_cases']}")
                else:
                    # Explicitly mention zero convictions if no conviction data found
                    summary_parts.append("Convictions: 0")
                
            if conviction_analysis.get("pending_cases", 0) > 0:
                summary_parts.append(f"Pending: {conviction_analysis['pending_cases']}")
            if conviction_analysis.get("acquitted_cases", 0) > 0:
                summary_parts.append(f"Acquitted: {conviction_analysis['acquitted_cases']}")
            
            enhanced_cases["detailed_summary"] = " | ".join(summary_parts)
        else:
            enhanced_cases["detailed_summary"] = "No criminal cases found"
    else:
        # Fallback if no comparison data available
        if basic_cases_count > 0:
            enhanced_cases["cases_with_conviction_status"] = f"{basic_cases_count} cases (conviction status not available)"
            enhanced_cases["detailed_summary"] = f"Total Cases: {basic_cases_count} | Conviction Status: Not Available"
            enhanced_cases["conviction_breakdown"]["unknown"] = basic_cases_count
        else:
            enhanced_cases["cases_with_conviction_status"] = "No criminal cases"
            enhanced_cases["detailed_summary"] = "No criminal cases found"
    
    print(f"      ✅ Enhanced summary: {enhanced_cases['detailed_summary']}")
    
    return enhanced_cases

def scrape_comparison_page(compare_url, session, context_name):
    """
    Scrape raw table data from comparison pages - extract rows and columns as-is
    Enhanced with criminal cases conviction status analysis
    """
    comparison_data = []
    
    try:
        print(f"      🌐 Fetching comparison page: {compare_url}")
        resp = session.get(compare_url, timeout=15)
        
        # Check for specific error responses
        if resp.status_code == 404:
            print(f"      ⚠️ Comparison page not found (404): {compare_url}")
            return comparison_data
        elif resp.status_code != 200:
            print(f"      ⚠️ HTTP {resp.status_code} error for: {compare_url}")
            return comparison_data
            
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        
        # Extract page title for context
        page_title = ""
        title_tag = soup.find("title")
        if title_tag:
            page_title = title_tag.get_text(strip=True)
        
        # Find all tables and extract ALL rows and columns as-is
        tables_found = soup.find_all("table")
        print(f"      📋 Found {len(tables_found)} tables on comparison page")
        
        for table_idx, table in enumerate(tables_found):
            print(f"         📊 Processing table {table_idx + 1}/{len(tables_found)}")
            
            # Extract EVERY row from the table - no filtering or interpretation
            for row_idx, tr in enumerate(table.find_all("tr")):
                # Extract all cells (both td and th) with their raw content
                cells = []
                for cell in tr.find_all(["td", "th"]):
                    cell_text = cell.get_text(strip=True)
                    cells.append(cell_text)
                
                # Store the row if it has any content
                if cells and any(cell.strip() for cell in cells):
                    row_data = {
                        "page_url": compare_url,
                        "page_title": page_title,
                        "table_index": table_idx,
                        "row_index": row_idx,
                        "cells": cells,
                        "column_count": len(cells),
                        "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S")
                    }
                    comparison_data.append(row_data)
        
        print(f"      ✅ Extracted {len(comparison_data)} total rows from all tables")
        
        # Analyze criminal cases for conviction status
        if comparison_data:
            conviction_analysis = analyze_criminal_cases_conviction_status(comparison_data)
            # Add conviction analysis to the first row as metadata
            if comparison_data:
                comparison_data[0]["_conviction_analysis"] = conviction_analysis
        
    except requests.exceptions.HTTPError as e:
        if "404" in str(e):
            print(f"      ⚠️ Comparison page not found (404) - this is normal for some candidates")
        else:
            print(f"      ❌ HTTP error scraping comparison page: {e}")
    except requests.exceptions.RequestException as e:
        print(f"      ❌ Network error scraping comparison page: {e}")
    except Exception as e:
        print(f"      ❌ Unexpected error scraping comparison page: {e}")
    
    return comparison_data

def extract_additional_comparison_data(soup, source_url):
    """
    Extract additional data from comparison pages like summaries, links, etc.
    """
    additional_data = []
    
    # Look for summary information
    for elem in soup.find_all(["div", "p", "span"], string=re.compile(r"(summary|total|overview)", re.I)):
        parent = elem.find_parent()
        if parent:
            text = parent.get_text(strip=True)
            if text and len(text) > 10:  # Avoid empty or very short text
                additional_data.append({
                    "data_type": "summary",
                    "content": text,
                    "source_url": source_url
                })
    
    # Look for additional PDF or document links
    for link in soup.find_all("a", href=True):
        href = link.get("href", "")
        text = link.get_text(strip=True)
        
        if any(doc_type in href.lower() for doc_type in [".pdf", "affidavit", "document"]):
            full_url = href if href.startswith("http") else f"https://myneta.info/{href.lstrip('/')}"
            additional_data.append({
                "data_type": "document_link",
                "link_text": text,
                "document_url": full_url,
                "source_url": source_url
            })
    
    return additional_data

def parse_candidate_page_universal(url):
    """
    Universal MyNeta candidate page parser with enhanced data extraction
    Extracts main data + other elections + comparison data
    """
    print(f"\n📄 Parsing candidate page (Universal Mode)...")
    
    # Create session for persistent connections
    session = requests.Session()
    session.headers.update(HEADERS)
    
    resp = session.get(url, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")
    
    # Extract base URL for relative links
    match = re.match(r"(https://[^/]+/[^/]+/)", url)
    base_url = match.group(1) if match else "https://myneta.info/"
    
    data = {
        "_source_url": url,
        "_scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "_base_url": base_url
    }
    
    # Extract page title and election year
    title = soup.find("title")
    if title:
        data["_page_title"] = title.get_text(strip=True)
        year_match = re.search(r'(20\d{2})', title.get_text())
        if year_match:
            data["_election_year"] = year_match.group(1)
    
    # Parse main candidate data from tables - Filter out noise data
    field_count = 0
    
    # Define noise patterns to skip
    noise_patterns = [
        # PAN-related noise
        'pan given', 'self', 'spouse', 'huf', 'dependent', 'relation type',
        # Contract-related noise
        'details of contracts', 'not applicable', 'partnership firms', 'private companies', 'hindu undivided family',
        # UI elements noise
        'donate now', 'share on', 'download app', 'follow us',
        # Table header noise
        'serial no', 'case no', 'name', 'constituency', 'age', 'party code'
    ]
    
    for table in soup.find_all("table"):
        # Check if this is a main data table (not comparison table)
        if not table.find("a", string=lambda x: x and "Click here" in x):
            for tr in table.find_all("tr"):
                tds = tr.find_all(["td", "th"])
                if len(tds) >= 2:
                    key = tds[0].get_text(separator=" ", strip=True)
                    val = tds[1].get_text(separator=" ", strip=True)
                    
                    # Skip noise data
                    if key and val and key != val:
                        key_lower = key.lower()
                        val_lower = val.lower()
                        
                        # Skip if key or value matches noise patterns
                        is_noise = any(pattern in key_lower for pattern in noise_patterns)
                        is_noise = is_noise or any(pattern in val_lower for pattern in noise_patterns)
                        is_noise = is_noise or len(key) < 3 or len(val) < 3  # Skip very short entries
                        is_noise = is_noise or key.isdigit()  # Skip numbered entries like "1", "2"
                        
                        if not is_noise:
                            data[key] = {
                                "value": val,
                                "sourceUrl": url
                            }
                            field_count += 1
    
    print(f"   ✓ Extracted {field_count} clean main fields")
    
    # Extract candidate image/photo
    image_url = extract_candidate_image(soup, base_url, url)
    if image_url:
        data["Image URL"] = {
            "value": image_url,
            "sourceUrl": url
        }
        print(f"   🖼️ Found candidate image: {image_url}")
    
    # Extract criminal cases count (most recent year)
    criminal_cases_count = extract_criminal_cases_count(soup, url)
    if criminal_cases_count > 0:
        data["Criminal Cases"] = {
            "value": str(criminal_cases_count),
            "sourceUrl": url
        }
    
    # Extract essential derived fields
    extract_derived_fields(data, soup, url)
    
    # Scrape Other Elections and comparison data
    other_elections, comparison_data = scrape_other_elections(soup, base_url, session)
    
    if other_elections:
        data["_other_elections"] = other_elections
    if comparison_data:
        data["_comparison_data"] = comparison_data
    
    # Enhance criminal cases information with conviction status
    enhanced_criminal_data = enhance_criminal_cases_with_conviction_status(data, comparison_data)
    if enhanced_criminal_data:
        data["_enhanced_criminal_cases"] = enhanced_criminal_data
    
    # Extract affidavit PDF link
    pdf_link = None
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.lower().endswith(".pdf") or "affidavit" in href.lower():
            pdf_link = href if href.startswith("http") else base_url + href.lstrip("./")
            break
    
    if pdf_link:
        data["affidavit_pdf"] = {
            "value": pdf_link,
            "sourceUrl": pdf_link
        }
        print(f"   📎 Found affidavit PDF: {pdf_link}")
    
    print(f"   ✅ Universal scraping completed\n")
    return data

def parse_candidate_page(url):
    """
    Enhanced candidate page parser with fallback to universal mode
    """
    try:
        # Try universal mode first for enhanced data
        return parse_candidate_page_universal(url)
    except Exception as e:
        print(f"   ⚠️ Universal mode failed: {e}")
        print(f"   🔄 Falling back to legacy mode...")
        return parse_candidate_page_legacy(url)

def parse_candidate_page_legacy(url):
    """
    Legacy parsing method (original functionality)
    """
    print(f"\n📄 Parsing candidate page (Legacy Mode)...")
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
                        data[key] = {
                            "value": val,
                            "sourceUrl": url
                        }
                        field_count += 1
    
    print(f"   ✓ Extracted {field_count} fields from tables")
    print(f"   ⏭️  Skipped {skipped_count} historical election records")
    
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
        print(f"   📎 Found affidavit PDF: {pdf_link}")
    
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

def scrape_direct_url(candidate_url):
    """
    Scrape a candidate page directly from a full MyNeta URL
    Useful for bulk scraping or when you have the exact URL
    """
    print(f"\n🎯 Direct URL scraping: {candidate_url}")
    
    try:
        result = parse_candidate_page_universal(candidate_url)
        
        # Extract candidate name from page title if available
        if "_page_title" in result:
            title = result["_page_title"]
            name_match = re.match(r"^([^(]+)", title)
            if name_match:
                result["_extracted_name"] = name_match.group(1).strip()
        
        return result
    except Exception as e:
        return {
            "error": f"Failed to scrape {candidate_url}: {str(e)}",
            "_source_url": candidate_url,
            "_scraped_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

def bulk_scrape_candidates(base_url_pattern, start_id=1, end_id=100, output_dir=None):
    """
    Bulk scrape multiple candidates from a state/year
    Example: bulk_scrape_candidates("https://www.myneta.info/AndhraPradesh2024/candidate.php?candidate_id=", 1, 50)
    """
    # Use datascraper directory if no custom output_dir specified
    if output_dir is None:
        output_dir = os.path.join(get_output_directory(), "bulk_output")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print(f"\n🚀 Bulk scraping candidates {start_id} to {end_id}")
    print(f"   Pattern: {base_url_pattern}[ID]")
    print(f"   Output: {output_dir}/")
    
    successful = 0
    failed = 0
    
    for candidate_id in range(start_id, end_id + 1):
        url = f"{base_url_pattern}{candidate_id}"
        print(f"\n[{candidate_id}/{end_id}] Scraping candidate ID {candidate_id}...")
        
        try:
            result = scrape_direct_url(url)
            
            if "error" not in result:
                # Save successful result in the output directory
                filename = os.path.join(output_dir, f"myneta_candidate_{candidate_id}.json")
                with open(filename, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
                successful += 1
                print(f"   ✅ Saved: {filename}")
            else:
                failed += 1
                print(f"   ❌ Failed: {result['error']}")
            
            # Rate limiting
            time.sleep(2)
            
        except Exception as e:
            failed += 1
            print(f"   ❌ Exception: {str(e)}")
    
    print(f"\n📊 Bulk scraping completed:")
    print(f"   ✅ Successful: {successful}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📁 Output directory: {output_dir}")

def main():
    """Enhanced main function with multiple operation modes"""
    if len(sys.argv) < 2:
        print("\n❌ Usage:")
        print("  python myneta_scraper.py \"Candidate Name\" [index]           # Search mode")
        print("  python myneta_scraper.py --direct \"https://myneta.info/...\"  # Direct URL mode")
        print("  python myneta_scraper.py --bulk \"base_url\" start end        # Bulk scraping mode")
        print("\nExamples:")
        print('  python myneta_scraper.py "Nara Chandrababu Naidu"')
        print('  python myneta_scraper.py "Y S Jagan Mohan Reddy" 1')
        print('  python myneta_scraper.py --direct "https://myneta.info/AndhraPradesh2024/candidate.php?candidate_id=108"')
        print('  python myneta_scraper.py --bulk "https://myneta.info/AndhraPradesh2024/candidate.php?candidate_id=" 1 50')
        print()
        sys.exit(1)
    
    mode = sys.argv[1]
    
    print("\n" + "="*80)
    print("Universal MyNeta Scraper v2.0")
    print("="*80)
    
    if mode == "--direct" and len(sys.argv) >= 3:
        # Direct URL mode
        url = sys.argv[2]
        result = scrape_direct_url(url)
        
        print("\n" + "="*80)
        print("Direct Scraping Result")
        print("="*80 + "\n")
        
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Save to file in datascraper directory
        url_hash = str(hash(url))[-8:]
        filename = f"myneta_direct_{url_hash}.json"
        filepath = get_output_filepath(filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Saved to: {filepath}\n")
    
    elif mode == "--bulk" and len(sys.argv) >= 5:
        # Bulk scraping mode
        base_url = sys.argv[2]
        start_id = int(sys.argv[3])
        end_id = int(sys.argv[4])
        output_dir = sys.argv[5] if len(sys.argv) > 5 else "bulk_output"
        
        bulk_scrape_candidates(base_url, start_id, end_id, output_dir)
    
    else:
        # Search mode (original functionality)
        name = sys.argv[1]
        index = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        
        result = get_nth_candidate_details(name, n=index)
        
        print("\n" + "="*80)
        print("Search Result")
        print("="*80 + "\n")
        
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Save to file in datascraper directory
        # Handle URL inputs by extracting candidate_id
        if name.startswith('http') and 'candidate_id=' in name:
            candidate_id = re.search(r'candidate_id=(\d+)', name)
            if candidate_id:
                safe_name = f"candidate_{candidate_id.group(1)}"
            else:
                safe_name = "unknown_candidate"
        else:
            safe_name = name.replace(" ", "_").lower()
        
        filename = f"myneta_{safe_name}_{index}.json"
        filepath = get_output_filepath(filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Saved to: {filepath}\n")

if __name__ == "__main__":
    main()
