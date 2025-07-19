import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  Code, 
  Shield, 
  Activity, 
  Users, 
  DollarSign, 
  Clock,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResultsDisplay = ({ data, isLoading }) => {
  const resultsRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    if (data && !isLoading) {
      gsap.fromTo(resultsRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );
      
      gsap.fromTo(cardsRef.current.children,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, delay: 0.3, ease: 'power3.out' }
      );
    }
  }, [data, isLoading]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (!data) return null;

  const stats = [
    {
      icon: Activity,
      label: 'Total Transactions',
      value: formatNumber(data.transactionCount || 0),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: DollarSign,
      label: 'Balance',
      value: `${data.balance || '0'} ETH`,
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      label: 'Unique Interactions',
      value: formatNumber(data.uniqueAddresses || 0),
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Clock,
      label: 'Last Activity',
      value: data.lastActivity || 'Unknown',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <motion.section 
      ref={resultsRef}
      className="py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12 gradient-text"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Contract Analysis Results
        </motion.h2>

        {/* Contract Info Card */}
        <motion.div 
          className="glassmorphism p-6 rounded-xl mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <Code className="w-6 h-6 text-blue-500" />
              <span>Contract Information</span>
            </h3>
            <button
              onClick={() => copyToClipboard(data.address)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
              <p className="font-mono text-sm break-all">{data.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contract Name</p>
              <p className="font-semibold">{data.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compiler Version</p>
              <p className="font-mono text-sm">{data.compiler || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Verification Status</p>
              <div className="flex items-center space-x-2">
                {data.verified ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-500">Unverified</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                className="glassmorphism p-6 rounded-xl hover:scale-105 transition-transform duration-300"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</h4>
                <p className="text-2xl font-bold">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Source Code Section */}
        {data.sourceCode && (
          <motion.div 
            className="glassmorphism p-6 rounded-xl mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Code className="w-6 h-6 text-green-500" />
                <span>Source Code</span>
              </h3>
              <button
                onClick={() => copyToClipboard(data.sourceCode)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{data.sourceCode.slice(0, 1000)}...</code>
              </pre>
            </div>
          </motion.div>
        )}

        {/* Security Analysis */}
        {data.securityAnalysis && (
          <motion.div 
            className="glassmorphism p-6 rounded-xl"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-xl font-semibold flex items-center space-x-2 mb-4">
              <Shield className="w-6 h-6 text-red-500" />
              <span>Security Analysis</span>
            </h3>
            <div className="space-y-3">
              {data.securityAnalysis.map((issue, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    issue.severity === 'high' ? 'text-red-500' :
                    issue.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <p className="font-semibold">{issue.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default ResultsDisplay;