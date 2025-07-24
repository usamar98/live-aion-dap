const express = require('express');
const router = express.Router();

// Import route modules
const tokenRoutes = require('./tokens');
const walletRoutes = require('./wallets');
const analyticsRoutes = require('./analytics');

// Use routes
router.use('/tokens', tokenRoutes);
router.use('/wallets', walletRoutes);
router.use('/analytics', analyticsRoutes);

// Base API route
router.get('/', (req, res) => {
  res.json({ message: 'CSecurity API v1.0' });
});

module.exports = router;