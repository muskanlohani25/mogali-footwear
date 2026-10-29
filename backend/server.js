require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const path = require('path');
const fs = require('fs');

const customerRoutes = require('./routes/customerRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mogali_footwear';

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Mogali Footwear — Customer Loyalty Management System',
    timestamp: new Date(),
  });
});

// Serve frontend build in production if available
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// 404 & SPA routing handler
app.use((req, res, next) => {
  // If API route not found
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  }

  // If frontend build exists, serve index.html for web client navigation
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central JSON error handler (e.g. malformed JSON body)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload in request body.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Database connection & server start
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(' Connected to MongoDB database: mogali_footwear');
    app.listen(PORT, () => {
      console.log(` Mogali Footwear backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection failed:', err.message);
    process.exit(1);
  });

