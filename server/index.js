const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connections
let mongoConnection, pgPool;

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// PostgreSQL connection
if (process.env.POSTGRES_URI) {
  pgPool = new Pool({ connectionString: process.env.POSTGRES_URI });
}

// MongoDB Schemas
const WalletAnalysisSchema = new mongoose.Schema({
  walletAddress: String,
  tokenAddress: String,
  network: String,
  analysis: {
    totalBought: Number,
    totalSold: Number,
    netPosition: Number,
    currentHolding: Number,
    riskScore: Number,
    buyTransactions: Array,
    sellTransactions: Array,
    lastTransaction: Object
  },
  timestamp: { type: Date, default: Date.now },
  classification: String // 'team', 'bundle', 'normal'
});

const AlertSchema = new mongoose.Schema({
  walletAddress: String,
  walletType: String,
  tokenAddress: String,
  network: String,
  amountSold: Number,
  usdValue: Number,
  previousBalance: Number,
  newBalance: Number,
  changePercentage: Number,
  destination: String,
  transactionHash: String,
  explorerLink: String,
  timestamp: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false }
});

const WalletAnalysis = mongoose.model('WalletAnalysis', WalletAnalysisSchema);
const Alert = mongoose.model('Alert', AlertSchema);

// API Routes

// Store wallet analysis
app.post('/api/wallet-analysis', async (req, res) => {
  try {
    const analysis = new WalletAnalysis(req.body);
    await analysis.save();
    res.json({ success: true, id: analysis._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet report
app.get('/api/wallet-report/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { tokenAddress, network = 'ethereum' } = req.query;
    
    // Get latest analysis
    const analysis = await WalletAnalysis.findOne({
      walletAddress: address.toLowerCase(),
      tokenAddress: tokenAddress?.toLowerCase(),
      network
    }).sort({ timestamp: -1 });
    
    // Get recent alerts
    const alerts = await Alert.find({
      walletAddress: address.toLowerCase(),
      tokenAddress: tokenAddress?.toLowerCase(),
      network
    }).sort({ timestamp: -1 }).limit(50);
    
    // Calculate metrics
    const metrics = {
      totalAlerts: alerts.length,
      recentAlerts: alerts.filter(alert => 
        Date.now() - alert.timestamp.getTime() < 24 * 60 * 60 * 1000
      ).length,
      totalSellValue: alerts.reduce((sum, alert) => sum + (alert.usdValue || 0), 0),
      avgSellSize: alerts.length > 0 ? 
        alerts.reduce((sum, alert) => sum + (alert.amountSold || 0), 0) / alerts.length : 0
    };
    
    res.json({
      walletAddress: address,
      tokenAddress,
      network,
      classification: analysis?.classification || 'unknown',
      analysis: analysis?.analysis || null,
      alerts,
      metrics,
      lastUpdated: analysis?.timestamp || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Store alert
app.post('/api/alerts/store', async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    res.json({ success: true, id: alert._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const { limit = 100, acknowledged = false } = req.query;
    
    const alerts = await Alert.find({ acknowledged })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge alert
app.patch('/api/alerts/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { acknowledged: true },
      { new: true }
    );
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet classifications
app.get('/api/wallets/classified', async (req, res) => {
  try {
    const { tokenAddress, network = 'ethereum' } = req.query;
    
    const wallets = await WalletAnalysis.find({
      tokenAddress: tokenAddress?.toLowerCase(),
      network,
      classification: { $in: ['team', 'bundle'] }
    }).sort({ 'analysis.riskScore': -1 });
    
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    postgresql: pgPool ? 'configured' : 'not configured'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Add after line 26 (after PostgreSQL connection)
if (pgPool) {
  // Create tables if they don't exist
  const initTables = async () => {
    try {
      // Wallet Analytics Table
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS wallet_analytics (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          token_address VARCHAR(42),
          network VARCHAR(20) DEFAULT 'ethereum',
          analysis JSONB,
          classification VARCHAR(20),
          risk_score DECIMAL(5,2),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Alerts Table
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          wallet_type VARCHAR(20),
          token_address VARCHAR(42),
          network VARCHAR(20) DEFAULT 'ethereum',
          amount_sold DECIMAL(20,8),
          usd_value DECIMAL(15,2),
          previous_balance DECIMAL(20,8),
          new_balance DECIMAL(20,8),
          change_percentage DECIMAL(5,2),
          destination VARCHAR(42),
          transaction_hash VARCHAR(66),
          explorer_link TEXT,
          acknowledged BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Create indexes for better performance
      await pgPool.query(`
        CREATE INDEX IF NOT EXISTS idx_wallet_analytics_address 
        ON wallet_analytics(wallet_address);
        
        CREATE INDEX IF NOT EXISTS idx_alerts_wallet_address 
        ON alerts(wallet_address);
        
        CREATE INDEX IF NOT EXISTS idx_alerts_created_at 
        ON alerts(created_at DESC);
      `);
      
      console.log('✅ PostgreSQL tables initialized successfully');
    } catch (error) {
      console.error('❌ PostgreSQL initialization error:', error.message);
    }
  };
  
  initTables();
}