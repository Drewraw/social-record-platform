# Architecture Guide

## System Overview

The Social Record Platform Campaign Tracker is built with a clean separation of concerns between frontend and backend, using modern web technologies and best practices.

```
┌─────────────────┐         HTTP/REST          ┌─────────────────┐
│                 │ ◄────────────────────────► │                 │
│  React Frontend │    JSON over CORS          │  Express Backend│
│   (Port 3000)   │                            │   (Port 3001)   │
│                 │                            │                 │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                                        │ SQL
                                                        ▼
                                                ┌─────────────────┐
                                                │  SQLite Database│
                                                │  (file-based)   │
                                                └─────────────────┘
```

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.x
- **Language:** TypeScript 5.x
- **Database:** SQLite 3.x
- **Middleware:** CORS, express.json()

### Frontend
- **Library:** React 18
- **Language:** TypeScript
- **Icons:** lucide-react
- **Styling:** Tailwind CSS (via classNames)
- **HTTP Client:** Fetch API

## Backend Architecture

### Layer Structure

```
backend/
├── src/
│   ├── config/          # Configuration & Database setup
│   │   └── database.ts  # SQLite connection & schema
│   ├── models/          # Data models & DB operations
│   │   └── index.ts     # Campaign, Vote, Update, Verification models
│   ├── controllers/     # Business logic
│   │   └── campaignController.ts  # Request handlers
│   ├── routes/          # API route definitions
│   │   └── index.ts     # Route mappings
│   ├── index.ts         # Server entry point
│   └── seed.ts          # Database seeding script
└── package.json
```

### Request Flow

1. **Client Request** → HTTP request to Express server
2. **Router** → Matches URL pattern to route handler
3. **Controller** → Processes request, calls model methods
4. **Model** → Executes database operations
5. **Database** → SQLite performs query
6. **Response** ← JSON data sent back to client

Example: Submitting a vote

```typescript
POST /api/campaigns/1/vote
Body: { vote_type: "confident" }

↓ routes/index.ts
↓ controllers/campaignController.ts → submitVote()
↓ models/index.ts → VoteModel.create()
↓ config/database.ts → db.run(SQL)
↓ SQLite inserts record

Response: { id: 12, message: "Vote submitted successfully" }
```

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐
│  campaigns   │◄──┐   │    votes     │
├──────────────┤   │   ├──────────────┤
│ id           │   ├───│ campaign_id  │
│ title        │   │   │ vote_type    │
│ promise      │   │   │ created_at   │
│ promise_date │   │   └──────────────┘
│ organization │   │
│ verified     │   │   ┌──────────────┐
└──────────────┘   ├───│   updates    │
                   │   ├──────────────┤
                   │   │ campaign_id  │
                   │   │ username     │
                   │   │ content      │
                   │   │ image_url    │
                   │   │ update_type  │
                   │   │ verified     │
                   │   └──────────────┘
                   │
                   │   ┌──────────────┐
                   └───│verifications │
                       ├──────────────┤
                       │ campaign_id  │
                       │ content      │
                       │ verify_date  │
                       │ verified_by  │
                       └──────────────┘
```

### Data Types

**update_type:**
- `community` - User-submitted updates
- `government` - Official responses
- `poll` - Citizen poll results

**vote_type:**
- `confident` - Believe promise will be fulfilled
- `not_sure` - Uncertain about outcome
- `not_confident` - Believe promise won't be fulfilled

**verification_status:**
- `pending` - Awaiting moderator review
- `verified` - Approved by moderators

## Frontend Architecture

### Component Structure

```
CampaignTracker (Main Component)
├── State Management
│   ├── campaign (Campaign details)
│   ├── voteStats (Vote percentages)
│   ├── updates (Community reports)
│   ├── verifications (Mid-term checks)
│   └── loading (Loading state)
│
├── Campaign Card
│   ├── Header
│   ├── Promise Details
│   ├── Campaign Question
│   ├── Voting Buttons
│   │   ├── Confident
│   │   ├── Not sure
│   │   └── Not confident
│   └── Progress Button
│
└── Progress Panel (Conditional)
    ├── Update Submission Form
    ├── Mid-term Verifications
    └── Community Reports
        ├── Community Updates
        ├── Government Replies
        └── Citizen Polls
```

### Data Flow

```
Component Mount
    ↓
fetchCampaignData()
    ↓
Promise.all([
    fetch campaigns,
    fetch votes,
    fetch updates,
    fetch verifications
])
    ↓
setState()
    ↓
Render UI
    ↓
User Action (vote/update)
    ↓
POST request
    ↓
Refresh data
    ↓
Re-render
```

## API Design

### RESTful Conventions

```
Resource: Campaigns
├── GET    /api/campaigns        # List all
├── GET    /api/campaigns/:id    # Get one
└── POST   /api/campaigns        # Create new

Resource: Votes (nested under campaign)
├── GET    /api/campaigns/:id/votes   # Get statistics
└── POST   /api/campaigns/:id/vote    # Submit vote

Resource: Updates (nested under campaign)
├── GET    /api/campaigns/:id/updates    # Get all
└── POST   /api/campaigns/:id/updates    # Create new

Resource: Verifications (nested under campaign)
└── GET    /api/campaigns/:id/verifications  # Get all
```

### Response Format

**Success Response:**
```json
{
  "id": 1,
  "title": "Campaign title",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Security Considerations

### Current Implementation (Development)
- CORS enabled for all origins (`*`)
- No authentication required
- No rate limiting
- SQLite file-based database

### Production Recommendations
1. **Authentication:** Implement JWT tokens
2. **Authorization:** Role-based access control
3. **Rate Limiting:** Prevent abuse
4. **Input Validation:** Validate all inputs
5. **SQL Injection:** Use parameterized queries (already implemented)
6. **CORS:** Restrict to specific origins
7. **HTTPS:** Enforce SSL/TLS
8. **Database:** Migrate to PostgreSQL/MySQL
9. **Logging:** Add request/error logging
10. **Monitoring:** Add health checks and metrics

## Performance Optimization

### Current Implementation
- Simple in-memory operations
- File-based SQLite database
- No caching
- Synchronous processing

### Scalability Options
1. **Caching:** Redis for vote statistics
2. **Database:** PostgreSQL with connection pooling
3. **CDN:** Static asset delivery
4. **Load Balancing:** Multiple backend instances
5. **WebSockets:** Real-time updates
6. **Message Queue:** Async processing (RabbitMQ/Redis)
7. **Database Indexing:** Optimize queries
8. **API Gateway:** Kong/AWS API Gateway

## Development Workflow

### Local Development
```bash
# Terminal 1: Backend with hot reload
cd backend
npm run dev

# Terminal 2: Frontend with hot reload
cd frontend/demo-app
npm start

# Terminal 3: Test API
curl http://localhost:3001/api/campaigns/1
```

### Testing Strategy

**Manual Testing:**
- ✅ Vote submission
- ✅ Update submission
- ✅ Data loading
- ✅ Error handling

**Recommended Tests:**
- Unit tests for models
- Integration tests for API endpoints
- E2E tests for user flows
- Performance tests

### Deployment Pipeline

```
Code Push
    ↓
CI/CD (GitHub Actions)
    ↓
├── Lint & Type Check
├── Run Tests
├── Build TypeScript
└── Deploy
    ├── Backend → AWS EC2/Heroku
    └── Frontend → Vercel/Netlify
```

## Extension Points

### Adding New Features

**New API Endpoint:**
1. Add model method in `models/index.ts`
2. Add controller in `controllers/`
3. Add route in `routes/index.ts`

**New Data Type:**
1. Update database schema in `config/database.ts`
2. Add TypeScript interface
3. Update models
4. Update frontend component

**New UI Feature:**
1. Add state in component
2. Create fetch function
3. Update render logic
4. Add event handlers

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check if port 3001 is available
- Verify Node.js version (18+)
- Run `npm install` again

**Frontend can't connect:**
- Check REACT_APP_API_URL in .env
- Verify backend is running
- Check CORS settings

**Database errors:**
- Delete database.sqlite and run `npm run seed`
- Check file permissions
- Verify SQLite is installed

**Vote percentages incorrect:**
- Check SQL query in VoteModel.getStatistics()
- Verify all vote types exist in result
- Clear database and reseed

## Further Reading

- Express.js Documentation: https://expressjs.com/
- React Documentation: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- SQLite Documentation: https://www.sqlite.org/docs.html
- REST API Best Practices: https://restfulapi.net/

## Support

For issues or questions:
1. Check documentation files
2. Review implementation summary
3. Examine example code in demo-app
4. Create issue in repository
