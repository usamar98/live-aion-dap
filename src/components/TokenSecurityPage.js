import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Copy, ExternalLink, TrendingUp, Users, Clock, Globe } from 'lucide-react';

const TokenSecurityPage = ({ title }) => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleCheck = async () => {
    if (!tokenAddress.trim()) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResults({
        contractAddress: tokenAddress,
        tokenName: 'Example Token',
        symbol: 'EXT',
        riskLevel: 'Medium',
        securityScore: 75,
        issues: [
          { type: 'warning', message: 'Contract is not verified' },
          { type: 'info', message: 'No mint function detected' },
          { type: 'success', message: 'No honeypot detected' }
        ]
      });
      setIsLoading(false);
    }, 2000);
  };

  // Fake data for the information card
  const getServiceInfo = () => {
    switch (title) {
      case 'Aion Bot':
        return {
          title: 'AI-Powered Security Analysis',
          description: 'Advanced machine learning algorithms analyze smart contracts for potential vulnerabilities and security risks.',
          stats: [
            { label: 'Contracts Analyzed', value: '125,847', icon: Shield },
            { label: 'Threats Detected', value: '3,429', icon: AlertTriangle },
            { label: 'Success Rate', value: '99.2%', icon: TrendingUp },
            { label: 'Active Users', value: '15,234', icon: Users }
          ],
          features: [
            'Real-time vulnerability detection',
            'Smart contract audit automation',
            'Risk assessment scoring',
            'Detailed security reports'
          ]
        };
      case 'Phishing Link Scanner':
        return {
          title: 'Advanced Phishing Detection',
          description: 'Comprehensive URL analysis using machine learning to detect phishing attempts and malicious websites.',
          stats: [
            { label: 'URLs Scanned', value: '2.1M', icon: Globe },
            { label: 'Phishing Blocked', value: '45,892', icon: Shield },
            { label: 'Detection Speed', value: '<2s', icon: Clock },
            { label: 'Accuracy Rate', value: '98.7%', icon: TrendingUp }
          ],
          features: [
            'Real-time URL reputation check',
            'Domain age and SSL verification',
            'Content analysis and pattern matching',
            'Blacklist and whitelist management'
          ]
        };
      case 'Phishing Wallets Detection':
        return {
          title: 'Wallet Security Monitoring',
          description: 'Monitor wallet addresses for suspicious activities and detect potential phishing wallet patterns.',
          stats: [
            { label: 'Wallets Monitored', value: '892K', icon: Users },
            { label: 'Suspicious Found', value: '12,847', icon: AlertTriangle },
            { label: 'Response Time', value: '<1s', icon: Clock },
            { label: 'Protection Rate', value: '99.5%', icon: Shield }
          ],
          features: [
            'Transaction pattern analysis',
            'Blacklist database integration',
            'Risk scoring algorithms',
            'Real-time alerts and notifications'
          ]
        };
      case 'Trace Stolen Funds':
        return {
          title: 'Blockchain Fund Tracing',
          description: 'Advanced blockchain analysis to trace stolen funds and identify money laundering patterns.',
          stats: [
            { label: 'Funds Traced', value: '$2.8B', icon: TrendingUp },
            { label: 'Cases Solved', value: '1,247', icon: CheckCircle },
            { label: 'Success Rate', value: '87.3%', icon: Shield },
            { label: 'Networks Covered', value: '15+', icon: Globe }
          ],
          features: [
            'Multi-chain transaction tracking',
            'Mixer and tumbler detection',
            'Address clustering analysis',
            'Compliance reporting tools'
          ]
        };
      case 'Aion Lab':
        return {
          title: 'Research & Development Hub',
          description: 'Cutting-edge research facility developing next-generation blockchain security solutions.',
          stats: [
            { label: 'Research Projects', value: '47', icon: Globe },
            { label: 'Publications', value: '156', icon: CheckCircle },
            { label: 'Team Members', value: '89', icon: Users },
            { label: 'Patents Filed', value: '23', icon: TrendingUp }
          ],
          features: [
            'Advanced threat intelligence',
            'Zero-day vulnerability research',
            'Custom security solutions',
            'Academic partnerships'
          ]
        };
      default:
        return {
          title: 'Security Platform Overview',
          description: 'Comprehensive blockchain security platform providing multiple layers of protection.',
          stats: [
            { label: 'Total Scans', value: '5.2M', icon: Shield },
            { label: 'Threats Blocked', value: '89,432', icon: AlertTriangle },
            { label: 'Uptime', value: '99.9%', icon: TrendingUp },
            { label: 'Global Users', value: '234K', icon: Users }
          ],
          features: [
            'Multi-service security suite',
            'Real-time threat detection',
            'Comprehensive reporting',
            '24/7 monitoring support'
          ]
        };
    }
  };

  const serviceInfo = getServiceInfo();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
        <p className="text-gray-400 text-lg">Open, permissionless, user-driven token security detection platform</p>
      </motion.div>

      {/* Main Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Input Section */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 mb-8">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <select className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                <option>{title}</option>
                <option>BSC</option>
                <option>Polygon</option>
              </select>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={title === 'Aion Bot' ? 'Enter Token Address' : 
                             title === 'Phishing Link Scanner' ? 'Enter URL to Check' :
                             title === 'Phishing Wallets Detection' ? 'Enter Wallet Address' :
                             title === 'Trace Stolen Funds' ? 'Enter Transaction Hash' :
                             'Enter Search Query'}
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <motion.button
                onClick={handleCheck}
                disabled={isLoading || !tokenAddress.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? 'Checking...' : 'Check'}
              </motion.button>
            </div>
            <p className="text-gray-400 text-sm">
              Note: We can help you determine if a smart contract may be a scam, but there is no 100% guarantee and we are trying to do our best to detect all scams. The contract check is only used as a reference for users, not as a basis for contract judgment.
            </p>
          </div>
        </div>

        {/* Service Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Service Overview */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">{serviceInfo.title}</h2>
                <p className="text-gray-300 leading-relaxed">{serviceInfo.description}</p>
              </div>
              
              {/* Key Features */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Key Features</h3>
                <div className="space-y-3">
                  {serviceInfo.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Platform Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                {serviceInfo.stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-gray-600/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-5 h-5 text-blue-400" />
                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Status Indicator */}
              <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Service Online</span>
                  <span className="text-gray-400 text-sm ml-auto">Last updated: 2 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Token Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Token Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Contract Address:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-mono text-sm">{results.contractAddress.slice(0, 10)}...{results.contractAddress.slice(-8)}</span>
                        <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                        <ExternalLink className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Token Name:</span>
                      <span className="text-white">{results.tokenName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Symbol:</span>
                      <span className="text-white">{results.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Security Issues */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Security Analysis</h3>
                  <div className="space-y-3">
                    {results.issues.map((issue, index) => {
                      const Icon = issue.type === 'warning' ? AlertTriangle : 
                                 issue.type === 'success' ? CheckCircle : Shield;
                      const color = issue.type === 'warning' ? 'text-yellow-400' : 
                                  issue.type === 'success' ? 'text-green-400' : 'text-blue-400';
                      
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${color}`} />
                          <span className="text-gray-300">{issue.message}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Risk Score */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-4">Security Score</h3>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - results.securityScore / 100)}`}
                        className="text-blue-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{results.securityScore}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 mt-2">Risk Level: <span className="text-yellow-400">{results.riskLevel}</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TokenSecurityPage;