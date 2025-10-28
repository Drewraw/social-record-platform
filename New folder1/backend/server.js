const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const officialsRoutes = require('./routes/officials');
const promisesRoutes = require('./routes/promises');
const activityRoutes = require('./routes/activity');
const compareRoutes = require('./routes/compare');
const forumRoutes = require('./routes/forum');
const aggregateRoutes = require('./routes/aggregate');
const donationsRoutes = require('./routes/donations');
const ragRoutes = require('./routes/rag');

app.use('/api/officials', officialsRoutes);
app.use('/api/promises', promisesRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/aggregate', aggregateRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/rag', ragRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Social Record Platform API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
