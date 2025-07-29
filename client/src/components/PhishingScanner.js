import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Server, 
  Eye, 
  ExternalLink,
  Search,
  Loader
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const PhishingScanner = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // API configurations (removed safebrowsing and whois)
  const API_CONFIGS = {
    virustotal: {
      key: process.env.REACT_APP_VIRUSTOTAL_API_KEY,
      baseUrl: 'https://www.virustotal.com/vtapi/v2'
    },
    urlscan: {
      key: process.env.REACT_APP_URLSCAN_API_KEY,
      baseUrl: 'https://urlscan.io/api/v1'
    },
    ipinfo: {
      key: process.env.REACT_APP_IPINFO_API_KEY,
      baseUrl: 'https://ipinfo.io'
    }
  };

  // Validate URL format
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Extract domain from URL
  const extractDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return null;
    }
  };

  // VirusTotal URL scan
  const scanWithVirusTotal = async (targetUrl) => {
    try {
      if (!API_CONFIGS.virustotal.key) {
        return { error: 'VirusTotal API key not configured' };
      }

      // Submit URL for scanning
      const submitResponse = await fetch(`${API_CONFIGS.virustotal.baseUrl}/url/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `apikey=${API_CONFIGS.virustotal.key}&url=${encodeURIComponent(targetUrl)}`
      });

      const submitData = await submitResponse.json();
      
      if (submitData.response_code === 1) {
        // Wait a moment then get report
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const reportResponse = await fetch(
          `${API_CONFIGS.virustotal.baseUrl}/url/report?apikey=${API_CONFIGS.virustotal.key}&resource=${encodeURIComponent(targetUrl)}`
        );
        
        const reportData = await reportResponse.json();
        
        return {
          positives: reportData.positives || 0,
          total: reportData.total || 0,
          scanDate: reportData.scan_date,
          permalink: reportData.permalink,
          scans: reportData.scans || {}
        };
      }
      
      return { error: 'Failed to submit URL to VirusTotal' };
    } catch (error) {
      console.error('VirusTotal scan failed:', error);
      return { error: error.message };
    }
  };

  // URLScan.io analysis
  const scanWithURLScan = async (targetUrl) => {
    try {
      if (!API_CONFIGS.urlscan.key) {
        return { error: 'URLScan API key not configured' };
      }

      // Submit URL for scanning
      const submitResponse = await fetch(`${API_CONFIGS.urlscan.baseUrl}/scan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Key': API_CONFIGS.urlscan.key
        },
        body: JSON.stringify({
          url: targetUrl,
          visibility: 'public'
        })
      });

      const submitData = await submitResponse.json();
      
      if (submitData.uuid) {
        // Wait for scan to complete
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const resultResponse = await fetch(`${API_CONFIGS.urlscan.baseUrl}/result/${submitData.uuid}/`);
        const resultData = await resultResponse.json();
        
        return {
          uuid: submitData.uuid,
          screenshot: resultData.task?.screenshotURL,
          finalUrl: resultData.page?.url,
          domain: resultData.page?.domain,
          ip: resultData.page?.ip,
          country: resultData.page?.country,
          server: resultData.page?.server,
          malicious: resultData.verdicts?.overall?.malicious || false,
          categories: resultData.verdicts?.overall?.categories || [],
          links: resultData.lists?.linkDomains || [],
          certificates: resultData.lists?.certificates || []
        };
      }
      
      return { error: 'Failed to submit URL to URLScan' };
    } catch (error) {
      console.error('URLScan failed:', error);
      return { error: error.message };
    }
  };

  // IP geolocation and hosting info
  const getIPInfo = async (domain) => {
    try {
      const response = await fetch(`${API_CONFIGS.ipinfo.baseUrl}/${domain}/json?token=${API_CONFIGS.ipinfo.key}`);
      const data = await response.json();
      
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        location: data.loc,
        org: data.org,
        postal: data.postal,
        timezone: data.timezone,
        asn: data.asn
      };
    } catch (error) {
      console.error('IP info lookup failed:', error);
      return { error: error.message };
    }
  };

  // Calculate risk score (removed safebrowsing and whois references)
  const calculateRiskScore = (scanResults) => {
    let score = 0;
    let factors = [];

    // VirusTotal results
    if (scanResults.virustotal && !scanResults.virustotal.error) {
      const vtRatio = scanResults.virustotal.positives / scanResults.virustotal.total;
      if (vtRatio > 0.1) {
        score += 40;
        factors.push(`${scanResults.virustotal.positives}/${scanResults.virustotal.total} engines flagged as malicious`);
      } else if (vtRatio > 0) {
        score += 20;
        factors.push(`${scanResults.virustotal.positives} engines flagged as suspicious`);
      }
    }

    // URLScan results
    if (scanResults.urlscan && scanResults.urlscan.malicious) {
      score += 30;
      factors.push('URLScan detected malicious behavior');
    }

    // Suspicious hosting locations
    if (scanResults.ipinfo && scanResults.ipinfo.country) {
      const suspiciousCountries = ['CN', 'RU', 'KP', 'IR'];
      if (suspiciousCountries.includes(scanResults.ipinfo.country)) {
        score += 10;
        factors.push('Hosted in high-risk country');
      }
    }

    return {
      score: Math.min(score, 100),
      level: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
      factors
    };
  };

  // Main analysis function (removed safebrowsing and whois calls)
  const analyzeUrl = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL to analyze');
      return;
    }

    if (!isValidUrl(url)) {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const domain = extractDomain(url);
      toast.info('Starting comprehensive URL analysis...');

      // Run all scans in parallel (removed safebrowsing and whois)
      const [virusTotalResult, urlScanResult, ipInfoResult] = await Promise.allSettled([
        scanWithVirusTotal(url),
        scanWithURLScan(url),
        getIPInfo(domain)
      ]);

      const scanResults = {
        url,
        domain,
        virustotal: virusTotalResult.status === 'fulfilled' ? virusTotalResult.value : { error: virusTotalResult.reason?.message },
        urlscan: urlScanResult.status === 'fulfilled' ? urlScanResult.value : { error: urlScanResult.reason?.message },
        ipinfo: ipInfoResult.status === 'fulfilled' ? ipInfoResult.value : { error: ipInfoResult.reason?.message },
        timestamp: new Date().toISOString()
      };

      // Calculate risk score
      const riskAssessment = calculateRiskScore(scanResults);
      scanResults.risk = riskAssessment;

      setResults(scanResults);
      toast.success('URL analysis completed!');

    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Risk level styling
  const getRiskStyling = (level) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-900/20 border-red-500/30',
          text: 'text-red-300',
          icon: XCircle,
          color: 'text-red-400'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-900/20 border-yellow-500/30',
          text: 'text-yellow-300',
          icon: AlertTriangle,
          color: 'text-yellow-400'
        };
      default:
        return {
          bg: 'bg-green-900/20 border-green-500/30',
          text: 'text-green-300',
          icon: CheckCircle,
          color: 'text-green-400'
        };
    }
  };

  // Updated tabs (removed domain tab since whois is removed)
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'security', label: 'Security Scans' },
    { id: 'hosting', label: 'Hosting Info' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <ToastContainer position="top-right" theme="dark" />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-red-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Phishing Link Scanner
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Advanced detection of malicious links and phishing attempts
          </p>
        </div>

        {/* URL Input */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to analyze (e.g., https://example.com)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                onKeyPress={(e) => e.key === 'Enter' && !loading && analyzeUrl()}
              />
            </div>
            <button
              onClick={analyzeUrl}
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Risk Assessment */}
            <div className={`rounded-lg p-6 border ${getRiskStyling(results.risk.level).bg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {React.createElement(getRiskStyling(results.risk.level).icon, {
                    className: `w-8 h-8 ${getRiskStyling(results.risk.level).color}`
                  })}
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Risk Level: {results.risk.level.toUpperCase()}
                    </h3>
                    <p className={getRiskStyling(results.risk.level).text}>
                      Risk Score: {results.risk.score}/100
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Analyzed URL:</p>
                  <p className="text-white font-mono text-sm break-all">{results.url}</p>
                </div>
              </div>
              
              {results.risk.factors.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Risk Factors:</h4>
                  <ul className="space-y-1">
                    {results.risk.factors.map((factor, index) => (
                      <li key={index} className={`text-sm ${getRiskStyling(results.risk.level).text}`}>
                        • {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-gray-800 rounded-lg">
              <div className="border-b border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-red-500 text-red-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab (removed Safe Browsing summary) */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* VirusTotal Summary */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        VirusTotal
                      </h4>
                      {results.virustotal.error ? (
                        <p className="text-red-400 text-sm">{results.virustotal.error}</p>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {results.virustotal.positives}/{results.virustotal.total}
                          </p>
                          <p className="text-gray-400 text-sm">Engines flagged as malicious</p>
                        </div>
                      )}
                    </div>

                    {/* URLScan Summary */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        URLScan.io
                      </h4>
                      {results.urlscan.error ? (
                        <p className="text-red-400 text-sm">{results.urlscan.error}</p>
                      ) : (
                        <div>
                          <p className={`text-2xl font-bold ${
                            results.urlscan.malicious ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {results.urlscan.malicious ? 'MALICIOUS' : 'CLEAN'}
                          </p>
                          <p className="text-gray-400 text-sm">Behavioral analysis</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Security Scans Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    {/* VirusTotal Details */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-4">VirusTotal Scan Results</h4>
                      {results.virustotal.error ? (
                        <p className="text-red-400">{results.virustotal.error}</p>
                      ) : (
                        <div>
                          <div className="mb-4">
                            <p className="text-white">
                              <span className="text-red-400 font-bold">{results.virustotal.positives}</span> out of{' '}
                              <span className="font-bold">{results.virustotal.total}</span> security engines flagged this URL
                            </p>
                            {results.virustotal.permalink && (
                              <a 
                                href={results.virustotal.permalink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline text-sm flex items-center gap-1 mt-2"
                              >
                                View full report <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* URLScan Details */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-4">URLScan.io Analysis</h4>
                      {results.urlscan.error ? (
                        <p className="text-red-400">{results.urlscan.error}</p>
                      ) : (
                        <div className="space-y-4">
                          {results.urlscan.screenshot && (
                            <div>
                              <h5 className="text-white font-medium mb-2">Website Screenshot</h5>
                              <img 
                                src={results.urlscan.screenshot} 
                                alt="Website screenshot" 
                                className="max-w-full h-auto rounded border border-gray-600"
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Final URL:</span>
                              <span className="ml-2 text-white break-all">{results.urlscan.finalUrl}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Server:</span>
                              <span className="ml-2 text-white">{results.urlscan.server || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hosting Info Tab */}
                {activeTab === 'hosting' && (
                  <div className="space-y-6">
                    {results.ipinfo.error ? (
                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-300">IP information unavailable: {results.ipinfo.error}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                          <Server className="w-5 h-5" />
                          Hosting Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">IP Address:</span>
                            <span className="ml-2 text-white font-mono">{results.ipinfo.ip}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Organization:</span>
                            <span className="ml-2 text-white">{results.ipinfo.org || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Location:</span>
                            <span className="ml-2 text-white">
                              {results.ipinfo.city}, {results.ipinfo.region}, {results.ipinfo.country}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Timezone:</span>
                            <span className="ml-2 text-white">{results.ipinfo.timezone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhishingScanner;