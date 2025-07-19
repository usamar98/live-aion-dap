import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Search, Loader, AlertCircle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { analyzeContract } from '../api/contractAnalysis';
import toast from 'react-hot-toast';

const CodeRevealForm = ({ onDataFetch, isLoading, setIsLoading }) => {
  const [contractAddress, setContractAddress] = useState('');
  const [network, setNetwork] = useState('ethereum');
  const [focused, setFocused] = useState(false);
  const { provider, isConnected } = useWeb3();
  const formRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(formRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 0.5, ease: 'power3.out' }
    );
  }, []);

  const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contractAddress.trim()) {
      toast.error('Please enter a contract address');
      return;
    }

    if (!validateAddress(contractAddress)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    setIsLoading(true);
    
    try {
      const data = await analyzeContract(contractAddress, network, provider);
      onDataFetch(data);
      toast.success('Contract analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze contract. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const networks = [
    { value: 'ethereum', label: 'Ethereum Mainnet' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'bsc', label: 'BSC' },
    { value: 'arbitrum', label: 'Arbitrum' }
  ];

  return (
    <motion.section 
      ref={formRef}
      className="py-16"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <div className="max-w-2xl mx-auto">
        <motion.div 
          className="glassmorphism p-8 rounded-2xl neon-border"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label 
                className={`floating-label ${focused || contractAddress ? 'active' : ''}`}
                htmlFor="contractAddress"
              >
                Contract Address
              </label>
              <input
                ref={inputRef}
                id="contractAddress"
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full px-4 py-3 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900 dark:text-white"
                placeholder="0x..."
                disabled={isLoading}
              />
              {contractAddress && !validateAddress(contractAddress) && (
                <motion.div 
                  className="absolute right-3 top-3 text-red-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <AlertCircle className="w-5 h-5" />
                </motion.div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Network
              </label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 dark:bg-black/20 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900 dark:text-white"
                disabled={isLoading}
              >
                {networks.map((net) => (
                  <option key={net.value} value={net.value} className="bg-white dark:bg-gray-800">
                    {net.label}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !contractAddress || !validateAddress(contractAddress)}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
              whileHover={{ scale: isLoading ? 1 : 1.05 }}
              whileTap={{ scale: isLoading ? 1 : 0.95 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Analyzing Contract...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Reveal Code</span>
                </>
              )}
            </motion.button>

            {!isConnected && (
              <motion.div 
                className="text-center text-yellow-600 dark:text-yellow-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                💡 Connect your wallet for enhanced analysis features
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CodeRevealForm;