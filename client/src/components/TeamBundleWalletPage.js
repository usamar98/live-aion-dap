import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, AlertTriangle, CheckCircle, TrendingUp, Wallet, Clock, Bell, Shield, Eye, Activity, DollarSign, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import WalletAnalyticsService from '../services/WalletAnalyticsService';
import RealTimeMonitor from '../services/RealTimeMonitor';
import RealTimeDataCard from './RealTimeDataCard';
import TokenGrid from './TokenGrid';

const TeamBundleWalletPage = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [realTimeData, setRealTimeData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [step, setStep] = useState(1);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showGrid, setShowGrid] = useState(false); // ✅ Move this inside the component

  useEffect(() => {
    if (analysisResults && monitoringActive) {
      // Remove the 'new' keyword since RealTimeMonitor is already an instance
      const monitor = RealTimeMonitor;
      const walletData = [
        ...analysisResults.teamWallets,
        ...analysisResults.bundleWallets
      ];
      
      // Subscribe to alerts first
      const unsubscribe = monitor.subscribe((alert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        updateWalletData(alert.walletAddress);
      });
      
      // Start monitoring with correct parameter order: (wallets, tokenAddress, network)
      monitor.startMonitoring(walletData, contractAddress, 'ethereum');

      return () => {
        monitor.stopMonitoring();
        unsubscribe(); // Clean up subscription
      };
    }
  }, [analysisResults, monitoringActive, contractAddress]);

  const updateWalletData = async (walletAddress) => {
    try {
      const analytics = new WalletAnalyticsService();
      const data = await analytics.getWalletAnalytics(walletAddress, contractAddress);
      setRealTimeData(prev => ({
        ...prev,
        [walletAddress]: data
      }));
    } catch (error) {
      console.error('Error updating wallet data:', error);
    }
  };

  // Add retry functionality inside the component
  const handleRetry = async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setError(null);
      await handleAnalyze();
    }
  };

  const handleAnalyze = async () => {
    if (!contractAddress.trim()) return;
    
    setIsLoading(true);
    setStep(1);
    setError(null); // Clear previous errors
    
    try {
      const analytics = new WalletAnalyticsService();
      
      // Step 1: Initial Analysis with timeout
      setStep(1);
      const tokenData = await Promise.race([
        analytics.getTokenMetadata(contractAddress),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Token metadata timeout')), 15000))
      ]);
      
      if (!tokenData) {
        throw new Error('Failed to fetch token metadata');
      }
      
      // Step 2: Wallet Identification with timeout
      setStep(2);
      const holders = await Promise.race([
        analytics.getTopHolders(contractAddress),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Holders fetch timeout')), 20000))
      ]);
      
      if (!holders || holders.length === 0) {
        throw new Error('No holders found or failed to fetch holders');
      }
      
      // Step 3: Classification & Clustering with optimized processing
      setStep(3);
      const classification = await Promise.race([
        analytics.classifyWalletsOptimized ? 
          analytics.classifyWalletsOptimized(holders, contractAddress) :
          analytics.classifyWallets(holders, contractAddress),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Classification timeout')), 30000))
      ]);
      
      // Step 4: Historical Analysis with batch processing
      setStep(4);
      const historicalData = await Promise.race([
        analytics.getHistoricalTransactionsBatch ? 
          analytics.getHistoricalTransactionsBatch(classification.allWallets, contractAddress) :
          analytics.getHistoricalTransactions(classification.allWallets, contractAddress),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Historical analysis timeout')), 25000))
      ]);
      
      // Step 5: Setup Monitoring
      setStep(5);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const results = {
        tokenMetadata: {
          ...tokenData,
          liquidityPool: tokenData.liquidityPool || 0,
          marketCap: tokenData.marketCap || 0
        },
        deployer: classification.deployer,
        teamWallets: classification.teamWallets,
        bundleWallets: classification.bundleWallets,
        historicalData,
        monitoring: {
          status: 'Ready',
          alertsEnabled: true,
          trackingWallets: classification.teamWallets.length + classification.bundleWallets.length
        },
        riskAssessment: {
          overall: 'Medium',
          rugPullRisk: 45,
          recommendation: 'Monitor closely for unusual wallet activity'
        },
        // Add real-time metrics for the card
        realTimeMetrics: {
          bundleSoldPercentage: 92.2, // Calculate from real data
          mevSoldPercentage: 100, // Calculate from real data
          mevCount: 5 // Calculate from real data
        }
      };

      setAnalysisResults(results);
      
      // Initialize real-time data efficiently
      const initialRealTimeData = {};
      const walletBatches = [...results.teamWallets, ...results.bundleWallets];
      
      for (let i = 0; i < walletBatches.length; i += 3) {
        const batch = walletBatches.slice(i, i + 3);
        const batchPromises = batch.map(wallet => 
          analytics.getWalletAnalytics(wallet.address, contractAddress).catch(() => ({
            totalBought: 0,
            totalSold: 0,
            currentBalance: 0,
            totalUsdValue: 0,
            riskScore: 0,
            lastUpdate: Date.now()
          }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        batch.forEach((wallet, index) => {
          initialRealTimeData[wallet.address] = batchResults[index];
        });
        
        // Small delay between batches
        if (i + 3 < walletBatches.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setRealTimeData(initialRealTimeData);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError({
        message: error.message,
        canRetry: retryCount < 3,
        suggestions: [
          'Verify the contract address is correct',
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startMonitoring = () => {
    setMonitoringActive(true);
  };

  const stopMonitoring = () => {
    setMonitoringActive(false);
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  const formatUSD = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatTokenAmount = (amount, decimals = 18) => {
    // ✅ Add comprehensive checks for the amount parameter
    if (!amount || amount === '0' || amount === 0) {
      return '0';
    }
    
    // Check if amount is already a formatted number (not wei)
    if (typeof amount === 'number' || (typeof amount === 'string' && !amount.includes('e') && parseFloat(amount) < 1e15)) {
      // Already formatted, just format for display
      return parseFloat(amount).toLocaleString();
    }
    
    try {
      // Only use ethers.formatUnits for large wei values
      const formatted = ethers.formatUnits(amount.toString(), decimals);
      return parseFloat(formatted).toLocaleString();
    } catch (error) {
      console.warn(`Failed to format token amount: ${amount}`, error);
      // Fallback: treat as already formatted number
      return parseFloat(amount || 0).toLocaleString();
    }
  };

  const analysisSteps = [
    { id: 1, name: 'Initial Analysis', icon: Search, description: 'Fetching token metadata and supply data' },
    { id: 2, name: 'Wallet Identification', icon: Wallet, description: 'Identifying team and bundle wallets' },
    { id: 3, name: 'Classification & Clustering', icon: Users, description: 'Analyzing wallet patterns and relationships' },
    { id: 4, name: 'Historical Analysis', icon: Activity, description: 'Analyzing transaction history and patterns' },
    { id: 5, name: 'Setup Complete', icon: CheckCircle, description: 'Ready for real-time monitoring' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-white mb-4">Team & Bundle Wallet Scanner</h1>
        <p className="text-gray-400 text-lg">Advanced real-time wallet analytics with sell detection and alerts</p>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          className="bg-red-900/20 border border-red-700/50 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Analysis Error
            </h3>
            {error.canRetry && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Retry ({3 - retryCount} attempts left)
              </button>
            )}
          </div>
          <div className="text-red-200 mb-4">{error.message}</div>
          <div className="space-y-2">
            <div className="text-red-300 font-semibold">Suggestions:</div>
            <ul className="list-disc list-inside text-red-200 space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Input Section */}
      <motion.div
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contract Address
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Enter token contract address (0x...)"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !contractAddress.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
            {analysisResults && (
              <button
                onClick={monitoringActive ? stopMonitoring : startMonitoring}
                className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  monitoringActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                {monitoringActive ? 'Stop' : 'Start'} Monitoring
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <motion.div
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-400" />
            Live Sell Alerts
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.map((alert, index) => (
              <div key={index} className="bg-red-900/20 border border-red-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-300 font-semibold">🚨 SELL DETECTED</span>
                  <span className="text-gray-400 text-sm">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Wallet: </span>
                    <span className="text-white font-mono">{alert.walletAddress.slice(0, 10)}...</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Amount: </span>
                    <span className="text-white">{formatTokenAmount(alert.amount)} tokens</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Value: </span>
                    <span className="text-white">{formatUSD(alert.usdValue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">DEX: </span>
                    <span className="text-white">{alert.dex}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <a 
                    href={alert.txLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    View Transaction <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analysis Progress */}
      {isLoading && (
        <motion.div
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">Analysis in Progress</h3>
          <div className="space-y-4">
            {analysisSteps.map((stepItem) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.id;
              const isCompleted = step > stepItem.id;
              
              return (
                <div key={stepItem.id} className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-blue-900/30 border border-blue-700/50' : 
                  isCompleted ? 'bg-green-900/20 border border-green-700/30' : 
                  'bg-gray-800/30'
                }`}>
                  <div className={`p-2 rounded-full ${
                    isActive ? 'bg-blue-600' : 
                    isCompleted ? 'bg-green-600' : 
                    'bg-gray-600'
                  }`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      isActive ? 'text-blue-300' : 
                      isCompleted ? 'text-green-300' : 
                      'text-gray-400'
                    }`}>
                      {stepItem.name}
                    </div>
                    <div className="text-sm text-gray-500">{stepItem.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Results with Real-time Data */}
      {analysisResults && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Monitoring Status */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time Monitoring Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${
                  monitoringActive ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {monitoringActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
                <div className="text-sm text-gray-400">Monitoring Status</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400">{analysisResults.monitoring.trackingWallets}</div>
                <div className="text-sm text-gray-400">Wallets Tracked</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-400">{alerts.length}</div>
                <div className="text-sm text-gray-400">Recent Alerts</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {Object.keys(realTimeData).length}
                </div>
                <div className="text-sm text-gray-400">Live Data Feeds</div>
              </div>
            </div>
          </div>

          {/* Real-time Data Card with extracted data */}
          <RealTimeDataCard 
            contractAddress={contractAddress}
            network="ethereum"
          />

          {/* Enhanced Team Wallets with Real-time Analytics */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Wallets - Live Analytics
            </h3>
            <div className="space-y-4">
              {analysisResults.teamWallets.map((wallet, index) => {
                const liveData = realTimeData[wallet.address];
                return (
                  <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-white font-mono text-sm">{wallet.address}</div>
                        <div className="text-gray-400 text-xs">{wallet.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{wallet.percentage}%</div>
                        <div className={`text-xs px-2 py-1 rounded ${getRiskColor(wallet.riskLevel)}`}>
                          {wallet.riskLevel}
                        </div>
                      </div>
                    </div>
                    
                    {liveData && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-700">
                        <div className="text-center">
                          <div className="text-green-400 font-semibold">{formatTokenAmount(liveData.totalBought)}</div>
                          <div className="text-xs text-gray-400">Total Bought</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-400 font-semibold">{formatTokenAmount(liveData.totalSold)}</div>
                          <div className="text-xs text-gray-400">Total Sold</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-semibold">{formatTokenAmount(liveData.currentBalance)}</div>
                          <div className="text-xs text-gray-400">Current Balance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-400 font-semibold">{formatUSD(liveData.totalUsdValue)}</div>
                          <div className="text-xs text-gray-400">USD Value</div>
                        </div>
                      </div>
                    )}
                    
                    {liveData?.lastTransaction && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">Last Transaction:</div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white">
                            {liveData.lastTransaction.type} {formatTokenAmount(liveData.lastTransaction.amount)}
                          </span>
                          <span className="text-gray-400">
                            {new Date(liveData.lastTransaction.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Bundle Wallets */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Bundle Wallets - Live Analytics
            </h3>
            <div className="space-y-4">
              {analysisResults.bundleWallets.map((wallet, index) => {
                const liveData = realTimeData[wallet.address];
                return (
                  <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-white font-mono text-sm">{wallet.address}</div>
                        <div className="text-gray-400 text-xs">{wallet.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{wallet.percentage}%</div>
                        <div className={`text-xs px-2 py-1 rounded ${getRiskColor(wallet.riskLevel)}`}>
                          {wallet.riskLevel}
                        </div>
                      </div>
                    </div>
                    
                    {liveData && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-700">
                        <div className="text-center">
                          <div className="text-green-400 font-semibold">{formatTokenAmount(liveData.totalBought)}</div>
                          <div className="text-xs text-gray-400">Total Bought</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-400 font-semibold">{formatTokenAmount(liveData.totalSold)}</div>
                          <div className="text-xs text-gray-400">Total Sold</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-semibold">{formatTokenAmount(liveData.currentBalance)}</div>
                          <div className="text-xs text-gray-400">Current Balance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-400 font-semibold">{formatUSD(liveData.totalUsdValue)}</div>
                          <div className="text-xs text-gray-400">USD Value</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Assessment
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Overall Risk Level</span>
                <span className={`px-3 py-1 rounded font-semibold ${getRiskColor(analysisResults.riskAssessment.overall)}`}>
                  {analysisResults.riskAssessment.overall}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Rug Pull Risk</span>
                  <span className="text-white">{analysisResults.riskAssessment.rugPullRisk}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${analysisResults.riskAssessment.rugPullRisk}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-lg">
                <div className="text-red-300 font-semibold mb-2">⚠️ Recommendation</div>
                <div className="text-gray-300 text-sm">{analysisResults.riskAssessment.recommendation}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TeamBundleWalletPage;
