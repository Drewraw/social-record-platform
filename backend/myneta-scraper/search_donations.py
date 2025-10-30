"""
Web scraper for political donations from news articles
Searches Google News for recent donation articles
"""

import requests
from bs4 import BeautifulSoup
import json
import sys
from datetime import datetime

def search_google_news(query, num_results=5):
    """
    Search Google News for political donation articles
    """
    print(f"\n🔍 Searching Google News for: {query}\n")
    
    # Use DuckDuckGo HTML (no API key needed)
    search_url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(search_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        results = []
        for result in soup.find_all('div', class_='result')[:num_results]:
            title_elem = result.find('a', class_='result__a')
            snippet_elem = result.find('a', class_='result__snippet')
            
            if title_elem:
                title = title_elem.get_text(strip=True)
                url = title_elem.get('href', '')
                snippet = snippet_elem.get_text(strip=True) if snippet_elem else ''
                
                results.append({
                    'title': title,
                    'url': url,
                    'snippet': snippet
                })
                
                print(f"✅ Found: {title}")
                print(f"   URL: {url}\n")
        
        return results
        
    except Exception as e:
        print(f"❌ Error searching: {str(e)}")
        return []

def scrape_economic_times_article(url):
    """
    Scrape Economic Times article for donation details
    """
    print(f"\n📰 Scraping article: {url}\n")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract article text
        article_body = soup.find('div', class_='artText')
        if not article_body:
            article_body = soup.find('article')
        
        if article_body:
            text = article_body.get_text(strip=True)
            
            # Look for donation keywords
            donations_found = []
            
            # Common patterns
            if 'donation' in text.lower() or 'funded' in text.lower():
                print("✅ Article contains donation information")
                
                # Extract company names (basic pattern matching)
                if 'vedanta' in text.lower():
                    donations_found.append({
                        'donor': 'Vedanta Limited',
                        'type': 'Public Company',
                        'source': url
                    })
                
                if 'bjp' in text.lower():
                    print("   🎉 BJP mentioned as recipient")
                
                if 'congress' in text.lower():
                    print("   🎉 Congress mentioned")
            
            return {
                'success': True,
                'donations': donations_found,
                'article_text': text[:500]  # First 500 chars
            }
        
        return {'success': False, 'error': 'Could not parse article'}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) > 1:
        query = ' '.join(sys.argv[1:])
    else:
        query = 'BJP political donations India 2024 2025'
    
    print('╔════════════════════════════════════════════════════════════╗')
    print('║       POLITICAL DONATIONS WEB SCRAPER                      ║')
    print('║       Searches news articles for donation information      ║')
    print('╚════════════════════════════════════════════════════════════╝')
    
    # Search for articles
    articles = search_google_news(query)
    
    if not articles:
        print("\n⚠️  No articles found. Try a different search query.")
        sys.exit(1)
    
    # Save results
    output = {
        'query': query,
        'timestamp': datetime.now().isoformat(),
        'articles': articles
    }
    
    filename = f"donation_articles_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved {len(articles)} articles to: {filename}")
    print("\nℹ️  Next steps:")
    print("   1. Review articles manually")
    print("   2. Use add-vedanta-donation.js to add verified donations")
    print("   3. Or create similar scripts for other donations\n")
