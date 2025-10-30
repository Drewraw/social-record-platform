# Database Setup Guide

## Prerequisites

1. **PostgreSQL** installed on your machine
   - Download from: https://www.postgresql.org/download/
   - Or use a cloud database like Render.com, Supabase, or ElephantSQL

## Option 1: Local PostgreSQL Setup

### Step 1: Create Database

```sql
-- Open psql or pgAdmin
CREATE DATABASE social_record_db;
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` folder:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_record_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Step 3: Initialize Database

```bash
cd backend
npm run init-db
```

This will create all necessary tables:
- `officials` - Store official profiles
- `promises` - Track promises made by officials
- `activity_timeline` - Activity logs
- `comparisons` - Promise vs reality comparisons
- `forum_comments` - User discussions
- `data_sources` - Source verification

### Step 4: Seed Real Data

```bash
node seed-data.js
```

This will populate the database with **real Bangalore officials**:
- Ramalinga Reddy (BTM Layout, INC)
- Priyank Kharge (Chittapur, INC)
- Byrathi Basavaraj (KR Puram, BJP)
- Krishna Byre Gowda (Byatarayanapura, INC)
- Arvind Limbavali (Mahadevapura, BJP)
- Dinesh Gundu Rao (Gandhinagar, INC)

## Option 2: Cloud Database (Render.com)

### Step 1: Create PostgreSQL Database

1. Go to https://render.com
2. Click "New +" → "PostgreSQL"
3. Choose a name: `social-record-db`
4. Select free plan
5. Click "Create Database"

### Step 2: Get Connection Details

After creation, copy:
- **External Database URL** (starts with `postgres://`)
- Or individual details: Host, Port, Database, Username, Password

### Step 3: Configure .env

```env
# For Render.com
DB_HOST=your-host.render.com
DB_PORT=5432
DB_NAME=social_record_db_xxxx
DB_USER=social_record_db_xxxx_user
DB_PASSWORD=your_generated_password

PORT=5000
NODE_ENV=production
```

### Step 4: Initialize & Seed

```bash
cd backend
npm run init-db
node seed-data.js
```

## Verify Setup

### Test Backend Connection

```bash
cd backend
node verify.js
```

Expected output:
```
✅ Connected to PostgreSQL database
✅ Database connection verified!
📊 Tables found: officials, promises, activity_timeline, comparisons, forum_comments, data_sources
```

### Start Backend Server

```bash
npm run dev
```

Expected output:
```
🚀 Server is running on port 5000
📡 API available at http://localhost:5000/api
✅ Connected to PostgreSQL database
```

### Test API Endpoints

Open browser or Postman:
- Health Check: http://localhost:5000/api/health
- Get Officials: http://localhost:5000/api/officials
- Get Single Official: http://localhost:5000/api/officials/1

## Troubleshooting

### Error: "password authentication failed"
- Check your `DB_PASSWORD` in `.env`
- Ensure PostgreSQL user has correct password

### Error: "database does not exist"
- Create database first: `CREATE DATABASE social_record_db;`
- Or update `DB_NAME` in `.env` to match existing database

### Error: "Connection timeout"
- Check PostgreSQL is running: `sudo service postgresql status` (Linux/Mac)
- Or check Services (Windows)
- For cloud: Verify external connections are allowed

### No data returned from API
- Run seed script: `node seed-data.js`
- Check data: `SELECT * FROM officials;` in psql/pgAdmin

## Database Schema

### officials table
- id, name, position, party, constituency, tenure
- dynasty_status, score, image_url
- education, assets, liabilities, criminal_cases, age, contact_email
- approvals, disapprovals, created_at, updated_at

### promises table
- id, official_id (FK), title, description, status
- promised_date, completion_date, progress, source_url

### activity_timeline table
- id, official_id (FK), event_title, event_description
- event_date, source_type, source_url

### comparisons table
- id, official_id (FK), promise_id (FK)
- statement, statement_date, statement_source
- reality, reality_date, reality_source, status

### forum_comments table
- id, official_id (FK), user_name, comment_text
- likes, replies_count, created_at

### data_sources table
- id, official_id (FK), source_name, source_url
- is_verified, last_updated

## Next Steps

1. ✅ Database setup complete
2. ✅ Real data seeded
3. ✅ Backend running
4. 🚀 Start frontend: `cd frontend && npm start`
5. 🌐 Open: http://localhost:3000

Your app is now connected to real-time database with actual Bangalore officials! 🎉
