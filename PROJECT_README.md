# Social Record Platform - Campaign Tracker

A platform to track government officials, promises, public projects, and create scorecards for public departments.

## Project Structure

```
.
├── backend/          # Node.js/Express backend with TypeScript
├── frontend/         # React frontend component
├── README.md
└── license.md
```

## Backend

The backend is built with Node.js, Express, TypeScript, and SQLite.

### Features

- RESTful API for managing campaigns, votes, and updates
- SQLite database for data persistence
- CORS enabled for frontend integration
- TypeScript for type safety

### API Endpoints

#### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create a new campaign

#### Votes
- `POST /api/campaigns/:id/vote` - Submit a vote
- `GET /api/campaigns/:id/votes` - Get vote statistics

#### Updates
- `POST /api/campaigns/:id/updates` - Submit a community update
- `GET /api/campaigns/:id/updates` - Get all updates for a campaign

#### Verifications
- `GET /api/campaigns/:id/verifications` - Get verifications for a campaign

### Setup and Running

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Seed the database with initial data:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3001`

### Database Schema

#### campaigns
- `id` - Primary key
- `title` - Campaign question/title
- `promise` - The promise made
- `promise_date` - Date the promise was made
- `organization` - Organization that made the promise
- `verification_status` - Status of verification
- `created_at` - Timestamp

#### votes
- `id` - Primary key
- `campaign_id` - Foreign key to campaigns
- `vote_type` - Type of vote (confident, not_sure, not_confident)
- `created_at` - Timestamp

#### updates
- `id` - Primary key
- `campaign_id` - Foreign key to campaigns
- `username` - Username of the person submitting the update
- `content` - Content of the update
- `image_url` - Optional image URL
- `update_type` - Type (community, government, poll)
- `verification_status` - Status (pending, verified)
- `created_at` - Timestamp

#### verifications
- `id` - Primary key
- `campaign_id` - Foreign key to campaigns
- `content` - Verification content
- `verification_date` - Date of verification
- `verified_by` - Who verified it
- `created_at` - Timestamp

## Frontend

The frontend is a React component (`campaign-tracker-ui.tsx`) that displays campaign information and allows users to:

- View campaign details and promises
- Vote on campaign confidence levels
- View real-time vote statistics
- Submit community updates
- View progress updates and verifications

### Features

- Dynamic data fetching from the backend API
- Real-time vote statistics
- Community update submission
- Progress updates panel
- Verification badges

### Integration

To integrate the component into your React app:

1. Copy `campaign-tracker-ui.tsx` to your React project
2. Install required dependencies:
   ```bash
   npm install lucide-react
   ```
3. Set the API URL in your environment:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   ```
4. Import and use the component:
   ```tsx
   import CampaignTracker from './campaign-tracker-ui';
   
   function App() {
     return <CampaignTracker />;
   }
   ```

## Development

### Running Locally

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your React app with the frontend component integrated

3. Access the application at your React app's URL (typically `http://localhost:3000`)

### Testing the API

You can test the API endpoints using curl:

```bash
# Get campaign
curl http://localhost:3001/api/campaigns/1

# Get vote statistics
curl http://localhost:3001/api/campaigns/1/votes

# Submit a vote
curl -X POST http://localhost:3001/api/campaigns/1/vote \
  -H "Content-Type: application/json" \
  -d '{"vote_type": "confident"}'

# Get updates
curl http://localhost:3001/api/campaigns/1/updates

# Submit an update
curl -X POST http://localhost:3001/api/campaigns/1/updates \
  -H "Content-Type: application/json" \
  -d '{"username": "@testuser", "content": "Test update"}'
```

## License

See `license.md` for license information.
