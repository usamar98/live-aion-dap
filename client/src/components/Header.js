import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Wallet, LogOut, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';

const Header = ({ activeSection, setActiveSection }) => {
  const { isConnected, account, connectWallet, disconnectWallet } = useWeb3();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to handle session termination and redirect to login
  // Function to handle back button behavior
  const handleBackButton = () => {
    if (activeSection === 'dashboard') {
      // From dashboard, end session and redirect to login
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('loginTime');
      disconnectWallet();
      navigate('/login');
    } else {
      // From other sections, go back to dashboard
      setActiveSection('dashboard');
    }
  };

  // Remove the old handleBackToLogin function and replace it with handleBackButton
  const handleBackToLogin = () => {
    // Clear all session data
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('loginTime');
    
    // Disconnect wallet
    disconnectWallet();
    
    // Redirect to login page
    navigate('/login');
  };

  // Fetch real-time crypto data
  const fetchCryptoData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
      );
      const data = await response.json();
      
      const formattedData = data.map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change: coin.price_change_percentage_24h || 0,
        isPositive: (coin.price_change_percentage_24h || 0) >= 0,
        icon: coin.image,
        marketCap: coin.market_cap
      }));
      
      setCryptoData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch crypto data:', error);
      // Fallback to some popular tokens if API fails
      setCryptoData([
        { symbol: 'BTC', name: 'Bitcoin', price: 43250.50, change: 2.45, isPositive: true, icon: null },
        { symbol: 'ETH', name: 'Ethereum', price: 2580.75, change: -1.23, isPositive: false, icon: null },
        { symbol: 'BNB', name: 'BNB', price: 315.20, change: 0.85, isPositive: true, icon: null },
        { symbol: 'ADA', name: 'Cardano', price: 0.485, change: 3.12, isPositive: true, icon: null },
        { symbol: 'SOL', name: 'Solana', price: 98.45, change: -0.67, isPositive: false, icon: null }
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    gsap.fromTo(headerRef.current, 
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );

    // Initial fetch
    fetchCryptoData();

    // Update crypto data every 30 seconds
    const interval = setInterval(() => {
      fetchCryptoData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`;
    }
    return price < 1 ? `$${price.toFixed(4)}` : `$${price.toFixed(2)}`;
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(1)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`;
    }
    return `$${marketCap?.toLocaleString() || 'N/A'}`;
  };

  return (
    <motion.header 
      ref={headerRef}
      className="sticky top-0 z-30 bg-transparent backdrop-blur-md border-b border-gray-800/30"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Back Button */}
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBackButton}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-blue-600/50 transition-colors backdrop-blur-sm border border-blue-500/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={activeSection === 'dashboard' ? 'End Session & Return to Login' : 'Back to Dashboard'}
            >
              <ArrowLeft className={`w-5 h-5 ${activeSection === 'dashboard' ? 'text-red-400' : 'text-blue-400'}`} />
            </motion.button>
            <img src="/AioAi.jpg" alt="Aion Ai" className="h-8 w-8 rounded" />
          </div>

          {/* Real-time Crypto Ticker */}
          <div className="flex-1 mx-8 overflow-hidden">
            <div className="relative h-10">
              <div className="absolute inset-0 flex items-center">
                {loading ? (
                  <div className="flex items-center justify-center w-full">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span className="ml-2 text-gray-400 text-sm">Loading crypto data...</span>
                  </div>
                ) : (
                  <div className="animate-marquee flex space-x-8 whitespace-nowrap">
                    {[...cryptoData, ...cryptoData, ...cryptoData].map((coin, index) => (
                      <div key={`${coin.symbol}-${index}`} className="flex items-center space-x-3 text-sm">
                        {coin.icon && (
                          <img 
                            src={coin.icon} 
                            alt={coin.name} 
                            className="w-5 h-5 rounded-full"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">{coin.symbol}</span>
                          <span className="text-gray-300 font-mono">{formatPrice(coin.price)}</span>
                          <div className={`flex items-center space-x-1 ${
                            coin.isPositive ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {coin.isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span className="text-xs font-medium">
                              {coin.isPositive ? '+' : ''}{coin.change.toFixed(2)}%
                            </span>
                          </div>
                          {coin.marketCap && (
                            <span className="text-gray-400 text-xs">
                              MC: {formatMarketCap(coin.marketCap)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-2 bg-gray-800/50 backdrop-blur-sm rounded-lg text-sm font-medium text-white border border-gray-700/30">
                  {formatAddress(account)}
                </div>
                <motion.button
                  onClick={disconnectWallet}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-red-600/50 transition-colors backdrop-blur-sm border border-gray-700/30"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={connectWallet}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600/50 to-gray-500/50 text-white rounded-lg hover:from-gray-700/50 hover:to-gray-600/50 transition-all backdrop-blur-sm border border-gray-700/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;