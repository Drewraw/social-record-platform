# Social Record Platform

A civic engagement platform for tracking elected officials, their promises, and performance in Bangalore.

## 🚀 Features

- **Official Profiles**: Comprehensive profiles with verified data from MyNeta, ECI, Twitter, news, and government sources
- **Category Filters**: Filter officials by MLAs, Dynastic, Knowledgeable, High Ratings, and Most Active
- **Promise Tracking**: Track completed, in-progress, and broken promises
- **Interactive Dashboard**: Modern React-based UI with category badges and filtering
- **Profile Tabs**: Profile, Promises, Activity, Compare, and Forum sections
- **Community Features**: Approve/Disapprove buttons for community feedback
it should be the vision ,but code is not quite there yet
## 📁 Project Structure

```
social-record-platform/
├── frontend/          # React application (port 3000)
│   ├── src/
│   │   ├── pages/     # Homepage.js, ProfilePage.js
│   │   ├── components/ # Navbar.js
│   │   └── services/  # api.js
│   └── package.json
├── backend/           # Node.js/Express API (port 5000)
│   ├── config/        # Database configuration
│   ├── controllers/   # API controllers
│   ├── routes/        # API routes
│   └── server.js
├── start.bat          # Windows batch start script
├── start.ps1          # PowerShell start script
└── package.json       # Root package with scripts
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd "path/to/project"
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   - Create `.env` file in `backend/` folder
   - Add required variables (database, API keys)

## 🚀 Running the Application

### Option 1: Using start scripts (Recommended)
```bash
# Windows batch
start.bat

# PowerShell
.\start.ps1
```

### Option 2: Using npm scripts
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000 or 5001

### Option 3: Manual start
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 📦 Technologies

### Frontend
- React 18.3.1
- React Router 6.26.2
- Lucide React (icons)
- Axios (API calls)

### Backend
- Node.js
- Express.js
- PostgreSQL
 open ai
- Google Generative AI (Gemini)
 RAG for ai 

## 🎯 Current Status

✅ Homepage with category filters
✅ Official profile cards with badges
✅ Profile page with 5 tabs
✅ Mock data integration
✅ Responsive design
✅ Backend enrichment script: politicians' data (biography, family, tenure) auto-updated from Wikipedia and other sources
✅ Preview of all DB updates before applying
✅ Modular enrichment for any official
🚧 Database setup (in progress)
🚧 Frontend DB integration (in progress)

## 📝 Development Notes


## ⚠️ Known Issues

- DB data is not always fetching properly into the frontend; sometimes the PostgreSQL server does not refresh or sync as expected.
- If you encounter missing or outdated data, try restarting the backend server and ensure the DB connection is healthy.
- Enrichment script only updates fields present in the DB schema (e.g., tenure, biography, family, wealth).

## 📝 Development Notes
Front-end uses mock data when backend is unavailable
Category badges display based on official properties
All old HTML/CSS files have been removed (migrated to React)

## 🤝 Contributing

This is a Phase 1 MVP focusing on Bangalore elected officials. Future phases will expand to more regions.

---

**© 2025 Social Record Platform — Empowering Open Governance in Bangalore**
