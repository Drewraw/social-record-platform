# 🏛️ Social Record Platform - Database Setup

This directory contains complete database setup scripts for the Social Record Platform. Use these scripts to quickly set up the entire database schema with all necessary tables, foreign keys, and indexes.

## 📋 What Gets Created

### Tables
- **`officials`** - Main table storing politician data (90+ columns)
- **`data_sources`** - Tracks data sources (MyNeta, Wikipedia, etc.)
- **`official_sources`** - Junction table linking officials to their data sources

### Features
- ✅ **Foreign Key Relationships** - Proper data integrity
- ✅ **Source Tracking** - Every field has a `_source` column
- ✅ **Performance Indexes** - Fast queries on name, party, constituency
- ✅ **Data Validation** - Check constraints for data quality
- ✅ **Helper Functions** - Easy data insertion with source tracking
- ✅ **Automatic Triggers** - Updated timestamps
- ✅ **Useful Views** - Pre-built queries for common operations

## 🚀 Quick Setup (Recommended)

### Option 1: Node.js Setup Script (Easiest)

```bash
# 1. Make sure PostgreSQL is running
# 2. Install dependencies
npm install pg dotenv

# 3. Create/update .env file
echo "DATABASE_URL=postgresql://username:password@localhost:5432/social_records" > .env

# 4. Run the setup script
node setup-database.js
```

The script will:
- Create the database if it doesn't exist
- Set up all tables and relationships
- Insert default data sources
- Verify the setup
- Show you what to do next

### Option 2: Direct SQL Setup

```bash
# 1. Create database manually
psql -U postgres -c "CREATE DATABASE social_records;"

# 2. Run the SQL setup script
psql -U postgres -d social_records -f migrations/complete-database-setup.sql
```

## 📊 Database Schema Overview

### Officials Table (Main Table)
```sql
-- Basic Info: name, position, party, constituency, state, tenure
-- Personal: education, age, image_url, contact_email
-- Political: dynasty_status, political_relatives, party_history
-- Financial: assets, liabilities, family_wealth, business_interests
-- Criminal: criminal_cases, convicted_cases, conviction_status
-- Performance: approvals, disapprovals, transparency_score
-- Source Tracking: Every field has a corresponding _source column
```

### Foreign Key Relationships
```sql
official_sources.official_id → officials.id
official_sources.source_id → data_sources.id
```

## 🔧 Usage Examples

### After Setup - Import Data

```javascript
// 1. Scrape politician data
const { exec } = require('child_process');
exec('python myneta-scraper/myneta_scraper.py "Politician Name"');

// 2. Convert and import to database
const converter = require('./json-DBconv.js');
converter.processAllFiles();

// 3. Query the data
const pool = require('./config/database');
const result = await pool.query('SELECT * FROM officials_with_sources WHERE name ILIKE $1', ['%Gandhi%']);
```

### Query Examples

```sql
-- Get all politicians with their data sources
SELECT * FROM officials_with_sources;

-- Find high-quality profiles (multiple sources)
SELECT * FROM high_quality_officials;

-- Politicians by criminal cases
SELECT name, party, criminal_cases, convicted_cases 
FROM officials 
WHERE criminal_cases > 0 
ORDER BY criminal_cases DESC;

-- Source reliability analysis
SELECT 
    ds.name as source,
    COUNT(os.official_id) as officials_count,
    AVG(ds.reliability_score) as avg_reliability
FROM data_sources ds
JOIN official_sources os ON ds.id = os.source_id
GROUP BY ds.name, ds.reliability_score
ORDER BY avg_reliability DESC;
```

## 🛠️ Customization

### Adding New Data Sources
```sql
INSERT INTO data_sources (name, base_url, description, reliability_score)
VALUES ('NewSource', 'https://example.com', 'Description', 8);
```

### Adding New Columns
```sql
-- Add new field
ALTER TABLE officials ADD COLUMN new_field TEXT;

-- Add corresponding source field
ALTER TABLE officials ADD COLUMN new_field_source TEXT;

-- Update the conversion logic in json-DBconv.js
```

## 📁 File Structure
```
backend/
├── migrations/
│   ├── complete-database-setup.sql    # Complete SQL setup
│   └── add-missing-columns.sql        # Previous migration files
├── setup-database.js                  # Node.js setup script
├── config/
│   └── database.js                    # Database connection config
└── README-DATABASE-SETUP.md          # This file
```

## ✅ Verification Commands

After setup, verify everything works:

```sql
-- Check table creation
\dt

-- Check column count
SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'officials';

-- Check foreign keys
\d official_sources

-- Check data sources
SELECT * FROM data_sources;

-- Test insertion
SELECT insert_official_with_source(
    '{"name": "Test Politician", "party": "Test Party"}'::jsonb,
    'Manual',
    NULL
);
```

## 🆘 Troubleshooting

### Common Issues

1. **Database connection error**
   ```
   Solution: Check DATABASE_URL in .env file
   Format: postgresql://username:password@localhost:5432/database_name
   ```

2. **Permission denied**
   ```
   Solution: Make sure database user has CREATE privileges
   GRANT ALL PRIVILEGES ON DATABASE social_records TO username;
   ```

3. **Table already exists**
   ```
   Solution: Script handles this with IF NOT EXISTS
   To reset: DROP DATABASE social_records; then re-run setup
   ```

4. **Foreign key violations**
   ```
   Solution: Make sure to insert data_sources before official_sources
   The setup script handles this automatically
   ```

## 🔄 Migration Strategy

For existing databases:
1. **Backup first**: `pg_dump social_records > backup.sql`
2. **Test on copy**: Create test database and run migrations
3. **Apply incrementally**: Use individual migration files if needed
4. **Verify data integrity**: Run validation queries after migration

## 📞 Support

- Check existing data: Use the verification queries above
- Performance issues: Ensure indexes are created (script handles this)
- Data quality: Use the `high_quality_officials` view
- Source tracking: Every field has corresponding `_source` column

---

🎉 **You're all set!** The database is ready for politician data import and querying.