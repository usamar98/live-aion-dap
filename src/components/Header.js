import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Moon, Sun, Wallet, LogOut, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useWeb3 } from '../context/Web3Context';

const Header = ({ activeSection, setActiveSection }) => {
  const { isDark, toggleTheme } = useTheme();
  const { isConnected, account, connectWallet, disconnectWallet } = useWeb3();
  const headerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(headerRef.current, 
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );
  }, []);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.header 
      ref={headerRef}
      className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm border-b border-gray-800"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Back Button */}
          <div className="flex items-center space-x-4">
            {activeSection !== 'dashboard' && (
              <motion.button
                onClick={() => setActiveSection('dashboard')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            )}
            <img src="/AioAi.jpg" alt="AioAi" className="h-8 w-8 rounded" />
            <span className="text-xl font-bold text-white">AioAi</span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-400" />
              )}
            </motion.button>

            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium text-white">
                  {formatAddress(account)}
                </div>
                <motion.button
                  onClick={disconnectWallet}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-red-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={connectWallet}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg hover:from-gray-700 hover:to-gray-600 transition-all"
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