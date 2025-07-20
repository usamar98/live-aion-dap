import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Copy, ExternalLink, TrendingUp, Users, Clock, Globe, Eye, Server, Bug, Zap } from 'lucide-react';

const TokenSecurityPage = ({ title }) => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [urlScanResults, setUrlScanResults] = useState(null);

  const handleCheck = async () => {
    if (!tokenAddress.trim()) return;
    
    setIsLoading(true);
    // Simulate real-time URL scanning API call
    setTimeout(() => {
      const scanResults = {
        url: tokenAddress,
        securityRecommendation: {
          status: 'HIGH_RISK',
          recommendation: 'DO NOT VISIT - This URL has been identified as a phishing site',
          riskScore: 95,
          action: 'Block and report this URL immediately'
        },
        scanMetadata: {
          scanTime: new Date().toISOString(),
          scanDuration: '1.2s',
          scanEngine: 'Aion AI v2.1',
          databaseVersion: '2024.01.15',
          lastUpdated: '2 minutes ago'
        },
        technicalDetails: {
          domain: new URL(tokenAddress).hostname,
          ipAddress: '192.168.1.100',
          sslCertificate: 'Invalid/Expired',
          domainAge: '2 days',
          registrar: 'Unknown',
          serverLocation: 'Russia',
          technologies: ['PHP 7.4', 'Apache 2.4', 'CloudFlare']
        },
        threatsDetected: [
          { type: 'Phishing', severity: 'Critical', description: 'Mimics legitimate cryptocurrency exchange' },
          { type: 'Malware Distribution', severity: 'High', description: 'Contains suspicious JavaScript injections' },
          { type: 'Data Harvesting', severity: 'High', description: 'Attempts to collect wallet private keys' },
          { type: 'Social Engineering', severity: 'Medium', description: 'Uses urgency tactics to pressure users' }
        ],
        riskAssessment: {
          overallRisk: 'CRITICAL',
          confidenceLevel: '98.7%',
          categories: {
            phishing: 95,
            malware: 87,
            reputation: 12,
            technical: 91
          },
          verdict: 'MALICIOUS - Confirmed phishing site targeting cryptocurrency users'
        }
      };
      
      setUrlScanResults(scanResults);
      setResults({
        contractAddress: tokenAddress,
        tokenName: 'URL Scan Result',
        symbol: 'SCAN',
        riskLevel: scanResults.riskAssessment.overallRisk,
        securityScore: 100 - scanResults.securityRecommendation.riskScore,
        issues: scanResults.threatsDetected.map(threat => ({
          type: threat.severity === 'Critical' ? 'warning' : threat.severity === 'High' ? 'warning' : 'info',
          message: `${threat.type}: ${threat.description}`
        }))
      });
      setIsLoading(false);
    }, 2000);
  };

  // Dynamic service info based on scan results
  const getServiceInfo = () => {
    if (urlScanResults) {
      return {
        title: 'Real-time URL Analysis Results',
        description: `Comprehensive security analysis for: ${urlScanResults.url}`,
        stats: [
          { label: 'Risk Score', value: `${urlScanResults.securityRecommendation.riskScore}%`, icon: AlertTriangle },
          { label: 'Scan Duration', value: urlScanResults.scanMetadata.scanDuration, icon: Clock },
          { label: 'Threats Found', value: urlScanResults.threatsDetected.length.toString(), icon: Bug },
          { label: 'Confidence', value: urlScanResults.riskAssessment.confidenceLevel, icon: TrendingUp }
        ],
        features: [
          `Domain: ${urlScanResults.technicalDetails.domain}`,
          `Server Location: ${urlScanResults.technicalDetails.serverLocation}`,
          `SSL Status: ${urlScanResults.technicalDetails.sslCertificate}`,
          `Domain Age: ${urlScanResults.technicalDetails.domainAge}`
        ]
      };
    }

    // Default static info when no scan results
    return {
      title: 'Advanced Phishing Detection',
      description: 'Enter a URL above to get real-time security analysis and threat detection.',
      stats: [
        { label: 'Ready to Scan', value: '✓', icon: Globe },
        { label: 'AI Engine', value: 'Online', icon: Shield },
        { label: 'Database', value: 'Updated', icon: Clock },
        { label: 'Status', value: 'Active', icon: TrendingUp }
      ],
      features: [
        'Real-time URL reputation analysis',
        'Advanced threat detection algorithms',
        'Comprehensive security reporting',
        'Instant risk assessment scoring'
      ]
    };
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
        <p className="text-gray-400 text-lg">Real-time URL security analysis and phishing detection platform</p>
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
                <option>Phishing link scanner</option>
              </select>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Enter URL to Check (e.g., https://example.com)"
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
                {isLoading ? 'Scanning...' : 'Scan URL'}
              </motion.button>
            </div>
            <p className="text-gray-400 text-sm">
              Note: Our AI-powered system analyzes URLs in real-time to detect phishing attempts, malware, and other security threats. Results are for reference purposes.
            </p>
          </div>
        </div>

        {/* Service Information Card - Now Dynamic */}
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
                <h3 className="text-lg font-semibold text-white mb-4">Analysis Details</h3>
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
              <h3 className="text-lg font-semibold text-white">Scan Metrics</h3>
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
              <div className={`${urlScanResults ? 'bg-red-600/20 border-red-600/30' : 'bg-green-600/20 border-green-600/30'} rounded-lg p-4`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${urlScanResults ? 'bg-red-500' : 'bg-green-500'} rounded-full animate-pulse`}></div>
                  <span className={`${urlScanResults ? 'text-red-400' : 'text-green-400'} font-medium`}>
                    {urlScanResults ? `Risk Level: ${urlScanResults.riskAssessment.overallRisk}` : 'Scanner Ready'}
                  </span>
                  <span className="text-gray-400 text-sm ml-auto">
                    {urlScanResults ? `Scanned: ${new Date(urlScanResults.scanMetadata.scanTime).toLocaleTimeString()}` : 'Awaiting URL input'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Real-time URL Scan Results */}
        {urlScanResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Security Recommendation */}
            <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 backdrop-blur-sm border border-red-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-red-400" />
                SECURITY RECOMMENDATION
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-red-300 font-semibold mb-2">Status: {urlScanResults.securityRecommendation.status}</p>
                  <p className="text-gray-300 mb-4">{urlScanResults.securityRecommendation.recommendation}</p>
                  <p className="text-yellow-300">Action: {urlScanResults.securityRecommendation.action}</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-400 mb-2">{urlScanResults.securityRecommendation.riskScore}%</div>
                  <p className="text-gray-400">Risk Score</p>
                </div>
              </div>
            </div>

            {/* Scan Metadata */}
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 backdrop-blur-sm border border-blue-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-blue-400" />
                SCAN METADATA
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Scan Time</p>
                  <p className="text-white">{new Date(urlScanResults.scanMetadata.scanTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white">{urlScanResults.scanMetadata.scanDuration}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Engine</p>
                  <p className="text-white">{urlScanResults.scanMetadata.scanEngine}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Database Version</p>
                  <p className="text-white">{urlScanResults.scanMetadata.databaseVersion}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Last Updated</p>
                  <p className="text-white">{urlScanResults.scanMetadata.lastUpdated}</p>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 backdrop-blur-sm border border-purple-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Server className="w-6 h-6 mr-2 text-purple-400" />
                TECHNICAL DETAILS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Domain</p>
                    <p className="text-white font-mono">{urlScanResults.technicalDetails.domain}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">IP Address</p>
                    <p className="text-white font-mono">{urlScanResults.technicalDetails.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">SSL Certificate</p>
                    <p className="text-red-400">{urlScanResults.technicalDetails.sslCertificate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Domain Age</p>
                    <p className="text-yellow-400">{urlScanResults.technicalDetails.domainAge}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Registrar</p>
                    <p className="text-white">{urlScanResults.technicalDetails.registrar}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Server Location</p>
                    <p className="text-white">{urlScanResults.technicalDetails.serverLocation}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {urlScanResults.technicalDetails.technologies.map((tech, index) => (
                        <span key={index} className="bg-purple-600/30 text-purple-300 px-2 py-1 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Threats Detected */}
            <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 backdrop-blur-sm border border-orange-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Bug className="w-6 h-6 mr-2 text-orange-400" />
                THREATS DETECTED
              </h3>
              <div className="space-y-4">
                {urlScanResults.threatsDetected.map((threat, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">{threat.type}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        threat.severity === 'Critical' ? 'bg-red-600/30 text-red-300' :
                        threat.severity === 'High' ? 'bg-orange-600/30 text-orange-300' :
                        'bg-yellow-600/30 text-yellow-300'
                      }`}>
                        {threat.severity}
                      </span>
                    </div>
                    <p className="text-gray-300">{threat.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-400" />
                RISK ASSESSMENT
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Overall Risk Level</p>
                    <p className="text-2xl font-bold text-red-400">{urlScanResults.riskAssessment.overallRisk}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Confidence Level</p>
                    <p className="text-xl font-semibold text-green-400">{urlScanResults.riskAssessment.confidenceLevel}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Verdict</p>
                    <p className="text-red-300">{urlScanResults.riskAssessment.verdict}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-white font-semibold mb-3">Risk Categories</h4>
                  {Object.entries(urlScanResults.riskAssessment.categories).map(([category, score]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300 capitalize">{category}</span>
                        <span className="text-white font-semibold">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            score >= 80 ? 'bg-red-500' :
                            score >= 60 ? 'bg-orange-500' :
                            score >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
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