# Profile Image Fetching - Now Default in MyNeta Scraper

## ✅ Changes Made

The MyNeta scraper (`myneta-to-scorecard.js`) now **automatically fetches profile images by default** when scraping politician data.

## 🔄 Process Flow

When you run the MyNeta scraper, it will now:

1. **Scrape MyNeta Profile Page** → Extract politician data
2. **Fetch Profile Image (NEW - DEFAULT)**:
   - 🏛️ **First**: Try to extract image from MyNeta profile page
   - 🌐 **Fallback**: Try Wikipedia API if MyNeta has no image
   - 👤 **Last Resort**: Generate avatar using DiceBear API
3. **Fetch Political Relatives** → Using multi-source priority
4. **Store in Database** → With profile image URL included

## 📋 Image Priority Order

```
MyNeta.info Image (Real Photo)
    ↓ (if not found)
Wikipedia Image (Official Photo)
    ↓ (if not found)
DiceBear Avatar (Generated)
```

## 🔧 Technical Details

### New Function Added
```javascript
fetchProfileImage(mynetaUrl, politicianName)
```

**What it does:**
- Scrapes the MyNeta profile page HTML
- Looks for `<img>` tags with patterns like:
  - `images/candidate*.jpg`
  - `images/person*.jpg`
  - Images with class "photo"
- Converts relative URLs to absolute
- Falls back to Wikipedia API
- Returns avatar if both fail

### Database Storage
- Stores in both `image_url` (legacy) and `profile_image_url` (new)
- Frontend uses `profile_image_url` column
- Fully automatic - no manual intervention needed

## 🚀 Usage

When you scrape a politician from MyNeta:

```bash
node myneta-scraper/myneta-to-scorecard.js
```

You'll see output like:
```
🖼️  Fetching profile image for [Name]...
   📡 Scraping MyNeta page: https://myneta.info/...
   ✅ MyNeta image found: https://myneta.info/images/candidate123.jpg

💾 Storing in database...
   🖼️  Image: https://myneta.info/images/candidate123.jpg
```

## 📊 Image Sources Statistics

After scraping multiple politicians, you can track:
- **From MyNeta**: Real official photos from MyNeta.info
- **From Wikipedia**: Official photos from Wikipedia Commons
- **Generated Avatars**: Fallback when no photo available

## ✨ Benefits

1. ✅ **Automatic**: No separate script needed
2. ✅ **Real Photos**: Prioritizes actual politician photos
3. ✅ **Reliable**: Multiple fallback sources
4. ✅ **Consistent**: Same process for every politician
5. ✅ **Frontend Ready**: Uses `profile_image_url` column

## 🎯 Result

Every politician scraped from MyNeta will now have a profile image automatically fetched and stored - making it the **default behavior**!
