# Campaign Tracker Demo App

This is a complete working demo of the Campaign Tracker application with both frontend and backend integration.

## What's Included

- **Backend API** - Node.js/Express server with SQLite database
- **Frontend Component** - React TypeScript component with dynamic data fetching
- **Demo React App** - Complete working React application demonstrating the integration

## Features Demonstrated

✅ **Dynamic Data Fetching**
- Campaign details loaded from backend API
- Real-time vote statistics
- Community updates and verifications

✅ **Interactive Voting**
- Click vote buttons to submit votes
- Percentages update dynamically in real-time

✅ **Community Updates**
- Submit new updates with username
- Updates appear instantly in the feed
- Verification status tracking

✅ **Progress Tracking**
- Mid-term verifications
- Government/official replies
- Community reports with images

## Quick Start

### 1. Start the Backend

```bash
cd ../../backend
npm install
npm run seed    # Seed initial data
npm run dev     # Start server on port 3001
```

### 2. Start the Demo App

```bash
npm install
npm start       # Start app on port 3000
```

### 3. Open in Browser

Visit `http://localhost:3000` to see the application in action!

## Testing the Application

### Voting
1. Click on any of the three vote buttons (Confident, Not sure, Not confident)
2. Watch the percentages update in real-time

### Submitting Updates
1. Click "View Progress Updates & Community Reports"
2. Enter your username (e.g., @myusername)
3. Enter your update text
4. Click "Submit Update"
5. See your update appear at the top of Community Reports with "Under Review" status

## API Endpoints Used

- `GET /api/campaigns/1` - Get campaign details
- `GET /api/campaigns/1/votes` - Get vote statistics
- `POST /api/campaigns/1/vote` - Submit a vote
- `GET /api/campaigns/1/updates` - Get all updates
- `POST /api/campaigns/1/updates` - Submit an update
- `GET /api/campaigns/1/verifications` - Get verifications

## Technology Stack

**Backend:**
- Node.js with Express
- TypeScript
- SQLite database
- CORS enabled

**Frontend:**
- React 18
- TypeScript
- lucide-react for icons
- Tailwind CSS (via className)

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
