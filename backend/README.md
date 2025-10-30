# Social Record Platform - Backend

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_record_db
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

4. Create the database in PostgreSQL:
```sql
CREATE DATABASE social_record_db;
```

5. Initialize the database tables and sample data:
```bash
npm run init-db
```

6. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000/api`

## API Endpoints

### Officials
- `GET /api/officials` - Get all officials (with optional filters: search, party, minScore, maxScore)
- `GET /api/officials/:id` - Get single official by ID
- `POST /api/officials` - Create new official
- `PUT /api/officials/:id/rating` - Update rating (approve/disapprove)

### Promises
- `GET /api/promises/official/:officialId` - Get all promises for an official
- `GET /api/promises/:id` - Get single promise
- `POST /api/promises` - Create new promise
- `PUT /api/promises/:id` - Update promise status/progress

### Activity
- `GET /api/activity` - Get all recent activity
- `GET /api/activity/official/:officialId` - Get activity for an official
- `POST /api/activity` - Create new activity

### Compare
- `GET /api/compare/official/:officialId` - Get comparisons for an official
- `POST /api/compare` - Create new comparison

### Forum
- `GET /api/forum/official/:officialId` - Get comments for an official
- `POST /api/forum` - Create new comment
- `PUT /api/forum/:id/like` - Like a comment

## Database Schema

The database includes the following tables:
- `officials` - Elected officials' profiles
- `promises` - Promises made by officials
- `activity_timeline` - Activity and events timeline
- `comparisons` - Statement vs reality comparisons
- `forum_comments` - User discussions
- `data_sources` - Data source tracking
