import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Copy, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import WalletAnalyticsService from '../services/WalletAnalyticsService';

const RealTimeDataCard = ({ contractAddress, network = 'ethereum' }) => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Create an instance of the service
  const [walletService] = useState(() => new WalletAnalyticsService());

  const fetchRealTimeData = useCallback(async () => {
    if (!contractAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the instance method instead of static method
      const result = await walletService.getRealTimeTokenData(contractAddress, network);
      setRealTimeData(result);
      setLastUpdated(new Date());
      
      if (result.errors.length > 0) {
        console.warn('Some API calls failed:', result.errors);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch real-time data:', err);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, network, walletService]);

  useEffect(() => {
    fetchRealTimeData();
  }, [fetchRealTimeData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRealTimeData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, fetchRealTimeData]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === 0) return '0';
    if (num < 0.01) return num.toExponential(2);
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const formatPercentage = (num) => {
    const formatted = parseFloat(num).toFixed(2);
    return `${formatted >= 0 ? '+' : ''}${formatted}%`;
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Fair': return 'text-yellow-600';
      case 'Poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriceChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading && !realTimeData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading real-time data...</span>
        </div>
      </div>
    );
  }

  if (error && !realTimeData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64 text-red-600">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <div>
            <p className="font-semibold">Failed to load real-time data</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchRealTimeData}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const data = realTimeData?.data;
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Real-Time Token Analysis
          </h3>
          <p className="text-sm text-gray-600">
            {data.tokenInfo.name} ({data.tokenInfo.symbol})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchRealTimeData}
            disabled={loading}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </button>
        </div>
      </div>

      {/* Data Quality Indicator */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium">Data Sources: {realTimeData.sources.join(', ')}</span>
          </div>
          <span className="text-sm text-gray-600">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </span>
        </div>
        {realTimeData.errors.length > 0 && (
          <div className="mt-2 text-sm text-yellow-600">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Some data sources unavailable: {realTimeData.errors.length} errors
          </div>
        )}
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Price (USD)</h4>
          <p className="text-2xl font-bold text-blue-900">
            ${formatNumber(data.price.usd, 6)}
          </p>
          <p className={`text-sm ${getPriceChangeColor(data.price.change24h)}`}>
            {data.price.change24h > 0 ? <TrendingUp className="inline h-4 w-4" /> : <TrendingDown className="inline h-4 w-4" />}
            {formatPercentage(data.price.change24h)} (24h)
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Market Cap</h4>
          <p className="text-2xl font-bold text-green-900">
            ${formatNumber(data.marketCap)}
          </p>
          <p className="text-sm text-green-700">
            FDV: ${formatNumber(data.fdv)}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">24h Volume</h4>
          <p className="text-2xl font-bold text-purple-900">
            ${formatNumber(data.volume.h24)}
          </p>
          <p className="text-sm text-purple-700">
            6h: ${formatNumber(data.volume.h6)}
          </p>
        </div>
      </div>

      {/* Liquidity Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Liquidity</h4>
          <p className="text-xl font-bold text-yellow-900">
            ${formatNumber(data.liquidity.usd)}
          </p>
          <p className="text-sm text-yellow-700">
            Health: <span className={getHealthColor(data.analytics.liquidityHealth)}>
              {data.analytics.liquidityHealth}
            </span>
          </p>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h4 className="font-semibold text-indigo-800 mb-2">Trading Activity</h4>
          <div className="space-y-1">
            <p className="text-sm">
              24h Buys: <span className="font-semibold">{data.transactions.h24.buys}</span>
            </p>
            <p className="text-sm">
              24h Sells: <span className="font-semibold">{data.transactions.h24.sells}</span>
            </p>
            <p className="text-sm">
              Buy Pressure: <span className="font-semibold text-green-600">
                {data.analytics.buyPressure}%
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">Risk Metrics</h4>
          <div className="space-y-2">
            <p className="text-sm">
              Volatility: <span className={`font-semibold ${
                data.analytics.volatility === 'High' ? 'text-red-600' :
                data.analytics.volatility === 'Medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {data.analytics.volatility}
              </span>
            </p>
            <p className="text-sm">
              Market Health: <span className={getHealthColor(data.analytics.marketHealth.rating)}>
                {data.analytics.marketHealth.rating} ({data.analytics.marketHealth.score}/100)
              </span>
            </p>
          </div>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-lg">
          <h4 className="font-semibold text-teal-800 mb-2">DEX Information</h4>
          <div className="space-y-1">
            <p className="text-sm">
              Primary DEX: <span className="font-semibold">{data.dexInfo.name}</span>
            </p>
            <p className="text-sm">
              Pair Age: <span className="font-semibold">
                {data.pairAge > 0 ? `${Math.floor(data.pairAge / (1000 * 60 * 60 * 24))} days` : 'Unknown'}
              </span>
            </p>
            {data.dexInfo.pairAddress && (
              <p className="text-xs text-gray-600 truncate">
                Pair: {data.dexInfo.pairAddress}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Market Health Factors */}
      {data.analytics.marketHealth.factors.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Market Health Factors</h4>
          <div className="flex flex-wrap gap-2">
            {data.analytics.marketHealth.factors.map((factor, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeDataCard;