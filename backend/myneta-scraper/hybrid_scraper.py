# hybrid_scraper.py
"""
Enhanced MyNeta scraper that combines:
1. Direct URL scraping for precise MyNeta data
2. Name-based Wikipedia/Wikidata lookup for family/dynasty information

Usage: python hybrid_scraper.py <myneta_url> <politician_name>
Example: python hybrid_scraper.py "https://www.myneta.info/AndhraPradesh2024/candidate.php?candidate_id=357" "T.G. Bharath"
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import io
import re
import wikipedia
from SPARQLWrapper import SPARQLWrapper, JSON

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

def scrape_myneta_url(url):
    """Scrape MyNeta data from direct URL including profile image"""
    print(f"\n🏛️  STEP 1: Scraping MyNeta URL")
    print(f"📄 URL: {url}\n")
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        print("✅ MyNeta page fetched successfully\n")
    except Exception as e:
        return {"error": f"Failed to fetch MyNeta: {e}", "url": url}
    
    soup = BeautifulSoup(resp.text, "lxml")
    
    data = {
        "_source_url": url,
        "_scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "_source_type": "myneta_primary"
    }
    
    # Extract page title
    title = soup.find("title")
    if title:
        data["_page_title"] = title.get_text(strip=True)
    
    # Extract profile image from MyNeta
    myneta_image = extract_myneta_image(soup, url)
    if myneta_image:
        data["profile_image_myneta"] = {
            "value": myneta_image,
            "sourceUrl": url
        }
        print(f"📸 Found MyNeta profile image: {myneta_image}\n")
    
    # Extract education information from MyNeta
    myneta_education = extract_myneta_education(soup, url)
    if myneta_education:
        data["education"] = {
            "value": myneta_education,
            "sourceUrl": url
        }
        print(f"🎓 Found MyNeta education: {myneta_education}")
    
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
    
    print(f"✅ Extracted {field_count} fields from MyNeta\n")
    return data

def extract_myneta_image(soup, base_url):
    """Extract profile image from MyNeta page"""
    try:
        # Look for candidate photo - common patterns in MyNeta
        image_selectors = [
            'img[src*="candidate"]',
            'img[src*="photo"]', 
            'img[src*="image"]',
            'img[alt*="candidate"]',
            'img[alt*="photo"]'
        ]
        
        for selector in image_selectors:
            img_elements = soup.select(selector)
            for img in img_elements:
                src = img.get('src')
                if src:
                    # Handle relative URLs
                    if src.startswith('/'):
                        # Get base domain from URL
                        from urllib.parse import urlparse
                        parsed = urlparse(base_url)
                        full_url = f"{parsed.scheme}://{parsed.netloc}{src}"
                    elif src.startswith('http'):
                        full_url = src
                    else:
                        # Relative path
                        full_url = base_url.rsplit('/', 1)[0] + '/' + src
                    
                    # Validate it's an actual image
                    if any(ext in src.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                        return full_url
        
        # Fallback: look for any image in the page content area
        content_imgs = soup.find_all('img')
        for img in content_imgs:
            src = img.get('src', '')
            if src and any(ext in src.lower() for ext in ['.jpg', '.jpeg', '.png']):
                if not any(exclude in src.lower() for exclude in ['logo', 'banner', 'ad', 'icon']):
                    if src.startswith('/'):
                        from urllib.parse import urlparse
                        parsed = urlparse(base_url)
                        return f"{parsed.scheme}://{parsed.netloc}{src}"
                    elif src.startswith('http'):
                        return src
        
        return None
        
    except Exception as e:
        print(f"   ⚠️ Error extracting MyNeta image: {e}")
        return None

def extract_myneta_education(soup, base_url):
    """Extract education information from MyNeta page"""
    try:
        print("🎓 Searching for education information on MyNeta page...")
        
        # Strategy 1: Look for education-related table headers or cells
        education_keywords = ['education', 'qualification', 'educational', 'degree', 'college', 'university', 'school']
        
        # Check all table cells for education information
        for table in soup.find_all('table'):
            for row in table.find_all('tr'):
                cells = row.find_all(['td', 'th'])
                for i, cell in enumerate(cells):
                    cell_text = cell.get_text(strip=True).lower()
                    
                    # If we find a cell with education keywords
                    if any(keyword in cell_text for keyword in education_keywords):
                        # Check if there's a next cell with the actual education value
                        if i + 1 < len(cells):
                            education_value = cells[i + 1].get_text(strip=True)
                            if education_value and len(education_value) > 3:  # Avoid empty or very short values
                                print(f"📚 Found education in table: {education_value}")
                                return education_value
        
        # Strategy 2: Look for dedicated education sections
        education_sections = soup.find_all(['div', 'section', 'p'], string=lambda text: text and any(
            keyword in text.lower() for keyword in education_keywords
        ))
        
        for section in education_sections:
            # Look for text near education-related content
            parent = section.parent if section.parent else section
            education_text = parent.get_text(strip=True)
            
            # Extract education information using pattern matching
            import re
            education_patterns = [
                r'education[:\s]+([^,\n]+)',
                r'qualification[:\s]+([^,\n]+)',
                r'degree[:\s]+([^,\n]+)',
            ]
            
            for pattern in education_patterns:
                match = re.search(pattern, education_text, re.IGNORECASE)
                if match:
                    education_value = match.group(1).strip()
                    if len(education_value) > 3:
                        print(f"📚 Found education via pattern: {education_value}")
                        return education_value
        
        print("❌ No education information found on MyNeta page")
        return None
        
    except Exception as e:
        print(f"❌ Error extracting MyNeta education: {e}")
        return None

def extract_wikipedia_image(soup, page_title):
    """
    Extract profile image from Wikipedia page with multiple strategies.
    """
    try:
        print("🖼️ Searching for profile image on Wikipedia page...")
        
        # Strategy 1: Look in infobox for image
        infobox = soup.find('table', class_='infobox')
        if infobox:
            # Look for image in infobox
            infobox_img = infobox.find('img')
            if infobox_img and infobox_img.get('src'):
                src = infobox_img.get('src')
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = 'https://en.wikipedia.org' + src
                print(f"📸 Found infobox image: {src}")
                return src
        
        # Strategy 2: Look for images with specific classes
        profile_img_selectors = [
            'img.infobox-image',
            '.infobox img',
            '.biography-image img',
            'img[alt*="{}"]'.format(page_title.split()[0]),  # Alt text with person's first name
        ]
        
        for selector in profile_img_selectors:
            try:
                img = soup.select_one(selector)
                if img and img.get('src'):
                    src = img.get('src')
                    if src.startswith('//'):
                        src = 'https:' + src
                    elif src.startswith('/'):
                        src = 'https://en.wikipedia.org' + src
                    print(f"📸 Found Wikipedia image via selector {selector}: {src}")
                    return src
            except:
                continue
        
        # Strategy 3: Look for the first image that might be a person's photo
        all_images = soup.find_all('img', src=True)
        for img in all_images:
            src = img.get('src', '')
            alt = img.get('alt', '').lower()
            
            # Skip obvious non-person images
            if any(term in src.lower() for term in ['commons-logo', 'wikimedia', 'edit-icon', 'ambox']):
                continue
            if any(term in alt for term in ['edit', 'commons', 'wikimedia', 'icon']):
                continue
            
            # Look for images that might be the person
            if any(name_part.lower() in alt for name_part in page_title.split() if len(name_part) > 2):
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = 'https://en.wikipedia.org' + src
                print(f"📸 Found potential Wikipedia profile image: {src}")
                return src
        
        print("❌ No profile image found on Wikipedia page")
        return None
        
    except Exception as e:
        print(f"❌ Error extracting Wikipedia image: {e}")
        return None

def extract_wikipedia_education(infobox_data):
    """Extract education information from Wikipedia infobox data"""
    try:
        if not infobox_data:
            return None
            
        # Common education field names in Wikipedia infoboxes
        education_fields = [
            'Education', 'education', 'Alma mater', 'alma_mater', 'alma mater',
            'University', 'university', 'College', 'college', 'School', 'school',
            'Educational qualification', 'Qualification', 'qualification',
            'Degree', 'degree', 'Studies', 'studies'
        ]
        
        for field in education_fields:
            if field in infobox_data:
                education_value = infobox_data[field].strip()
                if education_value and len(education_value) > 3:
                    print(f"🎓 Found education field '{field}': {education_value}")
                    return education_value
        
        return None
        
    except Exception as e:
        print(f"❌ Error extracting Wikipedia education: {e}")
        return None

def search_wikipedia(politician_name):
    """Search Wikipedia for biographical and family information"""
    print(f"\n📚 STEP 2: Searching Wikipedia")
    print(f"👤 Name: {politician_name}\n")
    
    try:
        # Try multiple languages for better coverage
        languages = ["en", "hi", "te", "ta", "bn"]  # English, Hindi, Telugu, Tamil, Bengali
        
        for lang in languages:
            try:
                wikipedia.set_lang(lang)
                print(f"   🔍 Searching {lang.upper()} Wikipedia...")
                
                # Multiple search strategies
                search_terms = [
                    politician_name + " politician",
                    politician_name + " MLA", 
                    politician_name + " MP",
                    politician_name + " minister",
                    politician_name + " corporator",
                    politician_name  # Fallback
                ]
                
                for term in search_terms:
                    search_results = wikipedia.search(term, results=5)
                    if search_results:
                        break
                
                if search_results:
                    break
            except:
                continue
        
        if not search_results:
            wikipedia.set_lang("en")  # Reset to English
            search_results = wikipedia.search(politician_name, results=3)
        
        if not search_results:
            print("❌ No Wikipedia results found\n")
            return None
        
        for result in search_results[:3]:
            try:
                page = wikipedia.page(result)
                summary = page.summary.lower()
                
                # Universal political keywords (works globally)
                political_keywords = [
                    'politician', 'member of parliament', 'congress', 'minister', 'election', 'political',
                    'mla', 'mp', 'msp', 'corporator', 'councillor', 'mayor', 'sarpanch', 'pradhan',
                    'assembly', 'legislature', 'cabinet', 'chief minister', 'prime minister',
                    'party', 'constituency', 'lok sabha', 'rajya sabha', 'vidhan sabha'
                ]
                
                if any(keyword in summary for keyword in political_keywords):
                    print(f"✅ Found Wikipedia page: {page.title}")
                    
                    # Get the full page HTML to extract infobox and image
                    wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/html/{page.title.replace(' ', '_')}"
                    try:
                        wiki_resp = requests.get(wiki_url, headers=HEADERS, timeout=10)
                        wiki_soup = BeautifulSoup(wiki_resp.text, 'lxml')
                        
                        # Extract infobox data
                        infobox_data = {}
                        infobox = wiki_soup.find('table', class_='infobox')
                        
                        # Extract profile image from Wikipedia
                        profile_image = extract_wikipedia_image(wiki_soup, page.title)
                        
                        if infobox:
                            print("📊 Extracting infobox data...")
                            for row in infobox.find_all('tr'):
                                th = row.find('th')
                                td = row.find('td')
                                if th and td:
                                    key = th.get_text(strip=True)
                                    value = td.get_text(strip=True)
                                    if key and value:
                                        infobox_data[key] = value
                                        print(f"   • {key}: {value[:100]}...")
                        
                        # Extract education from infobox
                        education_from_wiki = extract_wikipedia_education(infobox_data)
                        if education_from_wiki:
                            print(f"🎓 Found Wikipedia education: {education_from_wiki}")
                        
                        if profile_image:
                            print(f"📸 Found Wikipedia profile image: {profile_image}")
                        
                        result = {
                            "title": page.title,
                            "url": page.url,
                            "summary": page.summary[:1000],
                            "infobox": infobox_data,
                            "profile_image": profile_image,
                            "_source_type": "wikipedia_secondary"
                        }
                        
                        # Add education if found
                        if education_from_wiki:
                            result["education"] = education_from_wiki
                        
                        return result
                    except:
                        # Fallback to basic page info
                        return {
                            "title": page.title,
                            "url": page.url,
                            "summary": page.summary[:1000],
                            "infobox": {},
                            "_source_type": "wikipedia_secondary"
                        }
                
            except Exception as e:
                continue
        
        print("⚠️  No suitable Wikipedia page found\n")
        return None
        
    except Exception as e:
        print(f"❌ Wikipedia search error: {e}\n")
        return None

def search_wikidata(politician_name):
    """Search Wikidata for structured political and family information"""
    print(f"\n🔍 STEP 3: Searching Wikidata")
    print(f"👤 Name: {politician_name}\n")
    
    try:
        sparql = SPARQLWrapper("https://query.wikidata.org/sparql")
        
        # Universal SPARQL query - works for politicians globally
        query = f"""
        SELECT ?person ?personLabel ?partyLabel ?positionLabel ?constituencyLabel 
               ?birthDate ?educationLabel ?spouseLabel ?childrenLabel ?fatherLabel ?motherLabel
               ?relativesLabel ?countryLabel
        WHERE {{
          # Search in multiple languages
          {{ ?person rdfs:label "{politician_name}"@en . }}
          UNION {{ ?person rdfs:label "{politician_name}"@hi . }}
          UNION {{ ?person rdfs:label "{politician_name}"@te . }}
          UNION {{ ?person rdfs:label "{politician_name}"@ta . }}
          
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
          OPTIONAL {{ ?person wdt:P1038 ?relatives . }}
          OPTIONAL {{ ?person wdt:P27 ?country . }}  # Country of citizenship
          
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en,hi,te,ta,bn". }}
        }}
        LIMIT 5
        """
        
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()
        
        if results["results"]["bindings"]:
            result = results["results"]["bindings"][0]
            print("✅ Found Wikidata entry")
            
            # Extract family information
            family_info = {}
            if "fatherLabel" in result:
                family_info["father"] = result["fatherLabel"]["value"]
                print(f"   👨 Father: {result['fatherLabel']['value']}")
            if "motherLabel" in result:
                family_info["mother"] = result["motherLabel"]["value"]
                print(f"   👩 Mother: {result['motherLabel']['value']}")
            if "spouseLabel" in result:
                family_info["spouse"] = result["spouseLabel"]["value"]
                print(f"   💑 Spouse: {result['spouseLabel']['value']}")
            
            result["family_info"] = family_info
            result["_source_type"] = "wikidata_structured"
            return result
        else:
            print("❌ No Wikidata entry found\n")
            return None
            
    except Exception as e:
        print(f"❌ Wikidata search error: {e}\n")
        return None

def extract_family_from_infobox(infobox_data):
    """Extract family information from Wikipedia infobox"""
    family_info = {}
    
    # Common infobox keys for family information
    family_keys = {
        'Parents': 'parents',
        'Parent': 'parents', 
        'Father': 'father',
        'Mother': 'mother',
        'Spouse': 'spouse',
        'Children': 'children',
        'Relatives': 'relatives'
    }
    
    for wiki_key, our_key in family_keys.items():
        if wiki_key in infobox_data:
            family_info[our_key] = infobox_data[wiki_key]
    
    return family_info

def search_family_members_wikipedia(family_info):
    """Search Wikipedia for each family member to verify their political status"""
    print(f"\n🔍 STEP 4A: Researching Family Members\n")
    
    political_family_members = []
    
    for relation, name in family_info.items():
        if name and name.strip():
            print(f"   🔍 Researching {relation}: {name}")
            try:
                wikipedia.set_lang("en")
                search_results = wikipedia.search(f"{name} politician", results=3)
                
                if not search_results:
                    search_results = wikipedia.search(name, results=3)
                
                for result in search_results[:2]:
                    try:
                        page = wikipedia.page(result)
                        summary = page.summary.lower()
                        
                        # Check if this person is a politician
                        political_keywords = [
                            'politician', 'minister', 'member of parliament', 'mla', 'mp', 
                            'assembly', 'congress', 'bjp', 'tdp', 'ysrcp', 'election',
                            'chief minister', 'cabinet', 'legislature', 'political party'
                        ]
                        
                        if any(keyword in summary for keyword in political_keywords):
                            print(f"      ✅ {name} is a politician!")
                            
                            # Extract political details
                            political_details = extract_political_details(page, name)
                            political_family_members.append({
                                'name': name,
                                'relation': relation,
                                'details': political_details,
                                'wikipedia_url': page.url
                            })
                            break
                    except:
                        continue
                        
                if not any(member['name'] == name for member in political_family_members):
                    print(f"      ❌ {name} - No political background found")
                    
            except Exception as e:
                print(f"      ⚠️  Error researching {name}: {e}")
    
    return political_family_members

def extract_political_details(wikipedia_page, name):
    """Extract detailed political information from Wikipedia page"""
    try:
        # Get the full page HTML to extract infobox
        wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/html/{wikipedia_page.title.replace(' ', '_')}"
        wiki_resp = requests.get(wiki_url, headers=HEADERS, timeout=10)
        wiki_soup = BeautifulSoup(wiki_resp.text, 'lxml')
        
        political_info = {}
        
        # Extract from infobox
        infobox = wiki_soup.find('table', class_='infobox')
        if infobox:
            for row in infobox.find_all('tr'):
                th = row.find('th')
                td = row.find('td')
                if th and td:
                    key = th.get_text(strip=True).lower()
                    value = td.get_text(strip=True)
                    
                    # Extract relevant political information
                    if any(keyword in key for keyword in ['office', 'position', 'party', 'tenure', 'constituency']):
                        political_info[key] = value
        
        # Extract from summary
        summary_lines = wikipedia_page.summary.split('.')[:3]  # First 3 sentences
        political_info['summary'] = '. '.join(summary_lines) + '.'
        
        return political_info
        
    except Exception as e:
        return {'summary': f"Political figure (details extraction failed: {e})"}

def analyze_dynasty_status(myneta_data, wikipedia_data, wikidata_data):
    """Comprehensive dynasty analysis with detailed family research"""
    print(f"\n🏰 STEP 4: Comprehensive Dynasty Analysis\n")
    
    dynasty_status = "Self-Made"
    family_members = []
    dynasty_details = {}
    
    # Extract family from all sources
    all_family_info = {}
    
    # From Wikipedia infobox
    if wikipedia_data and wikipedia_data.get("infobox"):
        wiki_family = extract_family_from_infobox(wikipedia_data["infobox"])
        all_family_info.update(wiki_family)
        print("📊 Wikipedia infobox family data:")
        for key, value in wiki_family.items():
            print(f"   • {key.title()}: {value}")
    
    # From Wikidata
    if wikidata_data and wikidata_data.get("family_info"):
        wikidata_family = wikidata_data["family_info"]
        all_family_info.update(wikidata_family)
        print("📊 Wikidata family data:")
        for key, value in wikidata_family.items():
            print(f"   • {key.title()}: {value}")
    
    # Research each family member for political connections
    if all_family_info:
        political_family_members = search_family_members_wikipedia(all_family_info)
        
        if political_family_members:
            dynasty_status = "Dynastic - Political Family"
            
            print(f"\n🏛️  DYNASTY ANALYSIS RESULTS:")
            print(f"   Status: {dynasty_status}")
            print(f"   Political Family Members Found: {len(political_family_members)}")
            
            for member in political_family_members:
                relation = member['relation'].title()
                name = member['name']
                details = member['details']
                
                # Create detailed family member entry
                member_info = f"{relation}: {name}"
                if 'office' in details or 'position' in details:
                    position = details.get('office', details.get('position', 'Politician'))
                    member_info += f" ({position})"
                if 'party' in details or 'political party' in details:
                    party = details.get('party', details.get('political party', ''))
                    if party:
                        member_info += f" - {party}"
                
                family_members.append(member_info)
                print(f"   • {member_info}")
                
                # Store detailed info for database
                dynasty_details[f"{relation.lower()}_{name.replace(' ', '_')}"] = {
                    'name': name,
                    'relation': relation,
                    'political_details': details.get('summary', 'Political figure'),
                    'wikipedia_url': member.get('wikipedia_url', '')
                }
    
    if not family_members:
        print(f"\n🏛️  Dynasty Status: {dynasty_status}")
        print("👤 No political relatives found - appears to be self-made")
    
    return dynasty_status, family_members, dynasty_details

def merge_data_sources(myneta_data, wikipedia_data, wikidata_data, dynasty_status, family_members, dynasty_details):
    """Merge data from all sources with proper priority and enhanced dynasty data"""
    print(f"\n🔗 STEP 5: Merging Enhanced Data Sources\n")
    
    merged_data = myneta_data.copy()
    
    # Add source tracking
    merged_data["_data_sources"] = {
        "myneta": bool(myneta_data and not myneta_data.get("error")),
        "wikipedia": bool(wikipedia_data),
        "wikidata": bool(wikidata_data)
    }
    
    # Add comprehensive dynasty information
    merged_data["dynasty_status"] = {
        "value": dynasty_status,
        "sourceUrl": "comprehensive-family-research"
    }
    
    if family_members:
        merged_data["political_relatives"] = {
            "value": "; ".join(family_members),
            "sourceUrl": "wikipedia-family-research"
        }
        
        # Add detailed dynasty information
        merged_data["dynasty_details"] = {
            "value": dynasty_details,
            "sourceUrl": "comprehensive-family-analysis"
        }
        
    # Merge profile images with priority: MyNeta > Wikipedia
    profile_images = []
    
    # Check MyNeta image
    if "profile_image_myneta" in merged_data:
        profile_images.append({
            "source": "myneta",
            "url": merged_data["profile_image_myneta"]["value"],
            "sourceUrl": merged_data["profile_image_myneta"]["sourceUrl"]
        })
    
    # Check Wikipedia image
    if wikipedia_data and "profile_image" in wikipedia_data:
        profile_images.append({
            "source": "wikipedia", 
            "url": wikipedia_data["profile_image"],
            "sourceUrl": wikipedia_data.get("url", "wikipedia")
        })
    
    # Set primary profile image (MyNeta takes priority) - using image_url to match database schema
    if profile_images:
        merged_data["image_url"] = {
            "value": profile_images[0]["url"],  # First one has highest priority
            "sourceUrl": profile_images[0]["sourceUrl"],
            "all_sources": profile_images  # Keep all found images
        }
        print(f"📸 Primary profile image from {profile_images[0]['source']}: {profile_images[0]['url']}")
    
    # Merge education information with priority: MyNeta > Wikipedia
    education_sources = []
    
    # Check MyNeta education
    if "education" in merged_data:
        education_sources.append({
            "source": "myneta",
            "value": merged_data["education"]["value"],
            "sourceUrl": merged_data["education"]["sourceUrl"]
        })
    
    # Check Wikipedia education
    if wikipedia_data and "education" in wikipedia_data:
        education_sources.append({
            "source": "wikipedia",
            "value": wikipedia_data["education"],
            "sourceUrl": wikipedia_data.get("url", "wikipedia")
        })
    
    # Set primary education (MyNeta takes priority)
    if education_sources:
        merged_data["education"] = {
            "value": education_sources[0]["value"],  # First one has highest priority
            "sourceUrl": education_sources[0]["sourceUrl"],
            "all_sources": education_sources  # Keep all found education data
        }
        print(f"🎓 Primary education from {education_sources[0]['source']}: {education_sources[0]['value']}")
        
        # Add family count
        merged_data["political_family_count"] = {
            "value": len(family_members),
            "sourceUrl": "family-research-count"
        }
    
    # Fill missing fields from Wikipedia
    if wikipedia_data and wikipedia_data.get("infobox"):
        infobox = wikipedia_data["infobox"]
        
        # Education
        if "Education" not in merged_data and "Education" in infobox:
            merged_data["Education"] = {
                "value": infobox["Education"],
                "sourceUrl": wikipedia_data["url"]
            }
        
        # Born/Age
        if "Born" in infobox and "Age" not in merged_data:
            born_text = infobox["Born"]
            age_match = re.search(r'age (\d+)', born_text)
            if age_match:
                merged_data["Age"] = {
                    "value": age_match.group(1),
                    "sourceUrl": wikipedia_data["url"]
                }
        
        # Party
        if "Political party" in infobox and "Party" not in merged_data:
            merged_data["Party"] = {
                "value": infobox["Political party"],
                "sourceUrl": wikipedia_data["url"]
            }
    
    print("✅ Data sources merged successfully")
    print(f"📊 Sources used: MyNeta={merged_data['_data_sources']['myneta']}, Wikipedia={merged_data['_data_sources']['wikipedia']}, Wikidata={merged_data['_data_sources']['wikidata']}")
    
    return merged_data

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("""
🚀 Hybrid MyNeta + Wikipedia/Wikidata Scraper

Usage: python hybrid_scraper.py <myneta_url> <politician_name>

Examples:
  python hybrid_scraper.py "https://www.myneta.info/AndhraPradesh2024/candidate.php?candidate_id=357" "T.G. Bharath"
  python hybrid_scraper.py "https://myneta.info/LokSabha2024/candidate.php?candidate_id=2178" "Shobha Karandlaje"

This scraper:
1. 🏛️  Scrapes precise MyNeta data (assets, criminal cases, etc.)
2. 📚 Searches Wikipedia for biographical information  
3. 🔍 Queries Wikidata for structured family/political data
4. 🏰 Analyzes dynasty status based on family connections
5. 🔗 Merges all sources with proper attribution
""")
        sys.exit(1)
    
    myneta_url = sys.argv[1]
    politician_name = sys.argv[2]
    
    print("="*80)
    print("🎯 HYBRID MULTI-SOURCE POLITICAL DATA SCRAPER")
    print("="*80)
    print(f"🏛️  MyNeta URL: {myneta_url}")
    print(f"👤 Politician: {politician_name}")
    print("="*80)
    
    # Step 1: Scrape MyNeta
    myneta_data = scrape_myneta_url(myneta_url)
    
    # Step 2: Search Wikipedia  
    wikipedia_data = search_wikipedia(politician_name)
    
    # Step 3: Search Wikidata
    wikidata_data = search_wikidata(politician_name)
    
    # Step 4: Comprehensive dynasty analysis
    dynasty_status, family_members, dynasty_details = analyze_dynasty_status(myneta_data, wikipedia_data, wikidata_data)
    
    # Step 5: Merge all data
    final_data = merge_data_sources(myneta_data, wikipedia_data, wikidata_data, dynasty_status, family_members, dynasty_details)
    
    # Save result
    output_name = politician_name.replace(" ", "_").lower()
    output_file = f"hybrid_{output_name}_complete.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Complete multi-source data saved to: {output_file}")
    print("\n🎉 HYBRID SCRAPING COMPLETE!")
    print("="*80)