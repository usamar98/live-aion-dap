import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import WalletAnalyticsService from '../services/WalletAnalyticsService';

const RealTimeDataCard = ({ contractAddress, network = 'ethereum' }) => {
  const [tokenData, setTokenData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractAddress) {
      fetchRealTimeData();
    }
  }, [contractAddress, network]);

  const fetchRealTimeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const analytics = new WalletAnalyticsService();
      
      // Extract real token metadata
      const metadata = await analytics.getTokenMetadata(contractAddress, network);
      
      // Get top holders for analysis
      const holders = await analytics.getTopHolders(contractAddress, network, 100);
      
      // Classify wallets
      const classification = await analytics.classifyWallets(holders, contractAddress);
      
      // Get liquidity data
      const liquidityData = await analytics.getLiquidityData(contractAddress, network);
      
      // Get market cap data
      const marketData = await analytics.getMarketData(contractAddress, network);
      
      // Calculate bundle and MEV statistics
      const bundleStats = calculateBundleStats(classification.bundleWallets);
      const mevStats = calculateMEVStats(classification.mevWallets);
      const teamStats = calculateTeamStats(classification.teamWallets);
      
      setTokenData({
        ...metadata,
        liquidityPool: liquidityData,
        marketCap: marketData
      });
      
      setAnalysisResults({
        bundleWallets: classification.bundleWallets,
        mevWallets: classification.mevWallets,
        teamWallets: classification.teamWallets,
        bundleStats,
        mevStats,
        teamStats
      });
      
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateBundleStats = (bundleWallets) => {
    if (!bundleWallets || bundleWallets.length === 0) {
      return { total: 0, spent: 0, tokens: 0, hold: 0, sold: 0, transfer: 0 };
    }
    
    const total = bundleWallets.length;
    const spent = bundleWallets.reduce((sum, wallet) => sum + (wallet.totalSpent || 0), 0);
    const tokens = bundleWallets.reduce((sum, wallet) => sum + (wallet.tokenBalance || 0), 0);
    
    const holdCount = bundleWallets.filter(w => w.status === 'holding').length;
    const soldCount = bundleWallets.filter(w => w.status === 'sold').length;
    const transferCount = bundleWallets.filter(w => w.status === 'transfer').length;
    
    return {
      total,
      spent,
      tokens,
      hold: total > 0 ? ((holdCount / total) * 100).toFixed(1) : 0,
      sold: total > 0 ? ((soldCount / total) * 100).toFixed(1) : 0,
      transfer: total > 0 ? ((transferCount / total) * 100).toFixed(1) : 0
    };
  };

  const calculateMEVStats = (mevWallets) => {
    if (!mevWallets || mevWallets.length === 0) {
      return { total: 0, spent: 0, tokens: 0, supply: 0, hold: 0, sold: 0, transfer: 0 };
    }
    
    const total = mevWallets.length;
    const spent = mevWallets.reduce((sum, wallet) => sum + (wallet.totalSpent || 0), 0);
    const tokens = mevWallets.reduce((sum, wallet) => sum + (wallet.tokenBalance || 0), 0);
    
    // Calculate MEV supply percentage based on total token supply
    const totalSupplyPercentage = mevWallets.reduce((sum, wallet) => {
      const percentage = parseFloat(wallet.percentage) || 0;
      return sum + percentage;
    }, 0);
    
    const holdCount = mevWallets.filter(w => w.status === 'holding').length;
    const soldCount = mevWallets.filter(w => w.status === 'sold').length;
    const transferCount = mevWallets.filter(w => w.status === 'transfer').length;
    
    return {
      total,
      spent,
      tokens,
      supply: totalSupplyPercentage.toFixed(1), // ✅ Calculate actual MEV supply percentage
      hold: total > 0 ? ((holdCount / total) * 100).toFixed(1) : 0,
      sold: total > 0 ? ((soldCount / total) * 100).toFixed(1) : 0,
      transfer: total > 0 ? ((transferCount / total) * 100).toFixed(1) : 0
    };
  };

  const calculateTeamStats = (teamWallets) => {
    if (!teamWallets || teamWallets.length === 0) {
      return { bundled: 0, total: 0 };
    }
    
    const totalPercentage = teamWallets.reduce((sum, wallet) => {
      const percentage = parseFloat(wallet.percentage) || 0;
      return sum + percentage;
    }, 0);
    
    // Ensure totalPercentage is a valid number before calling toFixed
    const validPercentage = isNaN(totalPercentage) ? 0 : totalPercentage;
    
    return {
      bundled: validPercentage.toFixed(1),
      total: validPercentage.toFixed(1)
    };
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const formatEther = (wei) => {
    return `${(parseFloat(wei) / 1e18).toFixed(2)} Ξ`;
  };

  const formatUSD = (value) => {
    return `$${(value / 1000).toFixed(1)}k`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Extracting real-time data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-red-700 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <button 
          onClick={fetchRealTimeData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!tokenData || !analysisResults) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
        <p className="text-gray-300">No data available</p>
      </div>
    );
  }

  const cardData = [
    {
      title: "Token Name",
      icon: "🏷️",
      content: `${tokenData.name} (${tokenData.symbol})`,
      color: "text-blue-400"
    },
    {
      title: "Total Supply",
      icon: "🪙",
      content: `${formatNumber(tokenData.formattedSupply)} ${tokenData.symbol}`,
      color: "text-green-400"
    },
    {
      title: "Liquidity Pool",
      icon: "💧",
      content: (
        <div className="text-xs">
          <div>Start LP: {formatNumber(tokenData.liquidityPool?.startLP || 0)} {tokenData.symbol}</div>
          <div>ETH: {formatEther(tokenData.liquidityPool?.eth || 0)}</div>
          <div>No-LP: {tokenData.liquidityPool?.noLPSupply || 0}%</div>
        </div>
      ),
      color: "text-cyan-400"
    },
    {
      title: "Market Cap",
      icon: "🧢",
      content: (
        <div className="text-xs">
          <div>Launch: {formatUSD(tokenData.marketCap?.launch || 0)}</div>
          <div>Current: {formatUSD(tokenData.marketCap?.current || 0)}</div>
        </div>
      ),
      color: "text-yellow-400"
    },
    {
      title: "Bundle",
      icon: "🎁",
      content: (
        <div className="text-xs">
          <div>Wallets: {analysisResults.bundleStats.total}</div>
          <div>Spent: {formatEther(analysisResults.bundleStats.spent)}</div>
          <div>Tokens: {formatNumber(analysisResults.bundleStats.tokens)}</div>
        </div>
      ),
      color: "text-purple-400"
    },
    {
      title: "Team Supply",
      icon: "👥",
      content: (
        <div className="text-xs">
          <div>Bundled: {analysisResults.teamStats.bundled}%</div>
          <div>Total: {analysisResults.teamStats.total}%</div>
        </div>
      ),
      color: "text-orange-400"
    },
    {
      title: "MEVs",
      icon: "🤖",
      content: (
        <div className="text-xs">
          <div>Wallets: {analysisResults.mevStats.total}</div>
          <div>Spent: {formatEther(analysisResults.mevStats.spent)}</div>
          <div>Tokens: {formatNumber(analysisResults.mevStats.tokens)}</div>
        </div>
      ),
      color: "text-red-400"
    },
    {
      title: "MEV Supply",
      icon: "🎯",
      content: `${analysisResults.mevStats.supply}%`,
      color: "text-pink-400"
    },
    {
      title: "Bundle Wallets",
      icon: "💼",
      content: (
        <div className="text-xs">
          <div>Hold: {analysisResults.bundleStats.hold}%</div>
          <div>Sold: {analysisResults.bundleStats.sold}%</div>
          <div>Transfer: {analysisResults.bundleStats.transfer}%</div>
          <div className="text-gray-400 mt-1">(Wallets 1-{analysisResults.bundleStats.total})</div>
        </div>
      ),
      color: "text-indigo-400"
    },
    {
      title: "MEV Wallets",
      icon: "🤖",
      content: (
        <div className="text-xs">
          <div>Hold: {analysisResults.mevStats.hold}%</div>
          <div>Sold: {analysisResults.mevStats.sold}%</div>
          <div>Transfer: {analysisResults.mevStats.transfer}%</div>
          <div className="text-gray-400 mt-1">(Wallets 1-{analysisResults.mevStats.total})</div>
          <div className="text-red-400 text-lg mt-2">🔴🔴🔴</div>
        </div>
      ),
      color: "text-red-400"
    }
  ];

  return (
    <motion.div 
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Real-Time Token Analysis</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => copyToClipboard(contractAddress)}
            className="text-blue-400 hover:text-blue-300 p-1"
            title="Copy Contract Address"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={fetchRealTimeData}
            className="text-green-400 hover:text-green-300 p-1"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contract Address */}
      <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
        <div className="text-sm text-gray-400 mb-1">📃 Contract Address:</div>
        <div className="text-blue-400 font-mono text-sm break-all">{contractAddress}</div>
      </div>

      {/* 10 Cards Grid - 5 per row */}
      <div className="grid grid-cols-5 gap-4">
        {cardData.map((card, index) => (
          <motion.div
            key={index}
            className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 hover:border-gray-500 transition-all duration-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className={`text-sm font-semibold mb-2 ${card.color}`}>
                {card.title}
              </div>
              <div className="text-gray-300 text-xs">
                {typeof card.content === 'string' ? card.content : card.content}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-xs text-gray-400">
        Last updated: {new Date().toLocaleString()}
      </div>
    </motion.div>
  );
};

export default RealTimeDataCard;