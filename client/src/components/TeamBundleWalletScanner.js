/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeamBundleWalletScanner = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [deployerInfo, setDeployerInfo] = useState(null);
  const [topHolders, setTopHolders] = useState([]);
  const [teamWallets, setTeamWallets] = useState([]);
  const [bundleWallets, setBundleWallets] = useState([]);
  const [dexData, setDexData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState('analysis');
  const [walletTransactions, setWalletTransactions] = useState({});
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  const providerRef = useRef(null);
  const watchIntervalRef = useRef(null);

  // ERC20 ABI for basic calls
  const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ];

  // API configurations
  const API_CONFIGS = {
    etherscan: {
      key: process.env.REACT_APP_ETHERSCAN_API_KEY,
      baseUrl: 'https://api.etherscan.io/api'
    },
    alchemy: {
      key: process.env.REACT_APP_ALCHEMY_API_KEY,
      baseUrl: 'https://eth-mainnet.g.alchemy.com/v2'
    },
    moralis: {
      key: process.env.REACT_APP_MORALIS_API_KEY,
      baseUrl: 'https://deep-index.moralis.io/api/v2'
    }
  };

  // Debug function for API calls
  const debugAPICall = (apiName, url, error = null) => {
    if (error) {
      console.error(`❌ ${apiName} FAILED:`, {
        url,
        error: error.message,
        stack: error.stack
      });
    } else {
      console.log(`✅ ${apiName} SUCCESS:`, url);
    }
  };

  // Check API keys on mount
  useEffect(() => {
    if (!API_CONFIGS.etherscan.key) console.error('❌ REACT_APP_ETHERSCAN_API_KEY is missing!');
    if (!API_CONFIGS.moralis.key) console.error('❌ REACT_APP_MORALIS_API_KEY is missing!');
    if (!API_CONFIGS.alchemy.key) console.error('❌ REACT_APP_ALCHEMY_API_KEY is missing!');
  }, [API_CONFIGS.alchemy.key, API_CONFIGS.etherscan.key, API_CONFIGS.moralis.key]);

  // Initialize provider
  useEffect(() => {
    const initProvider = () => {
      try {
        if (window.ethereum) {
          providerRef.current = new ethers.BrowserProvider(window.ethereum);
        } else {
          // Fallback to public RPC
          const rpcUrls = {
            ethereum: 'https://eth-mainnet.g.alchemy.com/v2/AFrYGVB8xixzexk8JumTxucNoGyC6ulU',
            bsc: 'https://bsc-dataseed.binance.org/',
            polygon: 'https://polygon-rpc.com',
            arbitrum: 'https://arb1.arbitrum.io/rpc'
          };
          providerRef.current = new ethers.JsonRpcProvider(rpcUrls[chain] || rpcUrls.ethereum);
        }
      } catch (error) {
        console.error('Provider initialization failed:', error);
        toast.error('Failed to initialize blockchain connection');
      }
    };
    initProvider();
  }, [chain]);

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tokenWatchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  // Multi-chain configuration
  const SUPPORTED_CHAINS = {
    ethereum: {
      name: 'Ethereum',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/AFrYGVB8xixzexk8JumTxucNoGyC6ulU',
      moralisChain: 'eth',
      etherscanUrl: 'https://api.etherscan.io/api',
      explorerUrl: 'https://etherscan.io'
    },
    bsc: {
      name: 'BSC',
      rpcUrl: 'https://bsc-dataseed.binance.org/',
      moralisChain: 'bsc',
      etherscanUrl: 'https://api.bscscan.com/api',
      explorerUrl: 'https://bscscan.com'
    },
    polygon: {
      name: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
      moralisChain: 'polygon',
      etherscanUrl: 'https://api.polygonscan.com/api',
      explorerUrl: 'https://polygonscan.com'
    },
    arbitrum: {
      name: 'Arbitrum',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      moralisChain: 'arbitrum',
      etherscanUrl: 'https://api.arbiscan.io/api',
      explorerUrl: 'https://arbiscan.io'
    },
    avalanche: {
      name: 'Avalanche',
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      moralisChain: 'avalanche',
      etherscanUrl: 'https://api.snowtrace.io/api',
      explorerUrl: 'https://snowtrace.io'
    },
    fantom: {
      name: 'Fantom',
      rpcUrl: 'https://rpc.ftm.tools/',
      moralisChain: 'fantom',
      etherscanUrl: 'https://api.ftmscan.com/api',
      explorerUrl: 'https://ftmscan.com'
    }
  };

  // Multi-chain token detection
  const detectTokenChain = async (address) => {
    console.log('🔍 Starting multi-chain detection for:', address);
    const results = [];
    
    // Check all supported chains in parallel
    const chainChecks = Object.entries(SUPPORTED_CHAINS).map(async ([chainKey, chainConfig]) => {
      try {
        console.log(`🔗 Checking ${chainConfig.name}...`);
        const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
        const code = await provider.getCode(address);
        
        if (code !== '0x') {
          console.log(`✅ Contract found on ${chainConfig.name}`);
          
          // Try to get basic token info
          try {
            const contract = new ethers.Contract(address, ERC20_ABI, provider);
            const [name, symbol] = await Promise.allSettled([
              contract.name(),
              contract.symbol()
            ]);
            
            return {
              chain: chainKey,
              chainName: chainConfig.name,
              isContract: true,
              isToken: name.status === 'fulfilled' || symbol.status === 'fulfilled',
              tokenName: name.status === 'fulfilled' ? name.value : 'Unknown',
              tokenSymbol: symbol.status === 'fulfilled' ? symbol.value : 'Unknown'
            };
          } catch (error) {
            return {
              chain: chainKey,
              chainName: chainConfig.name,
              isContract: true,
              isToken: false,
              error: error.message
            };
          }
        }
        return null;
      } catch (error) {
        console.log(`❌ ${chainConfig.name} check failed:`, error.message);
        return null;
      }
    });
    
    const chainResults = await Promise.allSettled(chainChecks);
    
    // Filter successful results
    chainResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });
    
    console.log('🔍 Multi-chain detection results:', results);
    return results;
  };

  // Enhanced fetchTokenData with multi-chain support
  const fetchTokenData = async (address, detectedChain = null) => {
    console.log('🔍 Starting fetchTokenData for:', address, 'on chain:', detectedChain || 'auto-detect');
    
    try {
      let targetChain = detectedChain;
      let chainConfig;
      
      // If no specific chain provided, detect automatically
      if (!targetChain) {
        const detectionResults = await detectTokenChain(address);
        
        if (detectionResults.length === 0) {
          throw new Error('Address is not a contract on any supported chain');
        }
        
        // Prefer tokens over regular contracts
        const tokenResults = detectionResults.filter(r => r.isToken);
        const bestResult = tokenResults.length > 0 ? tokenResults[0] : detectionResults[0];
        
        targetChain = bestResult.chain;
        chainConfig = SUPPORTED_CHAINS[targetChain];
        
        console.log(`🎯 Auto-detected chain: ${chainConfig.name}`);
        
        // Update the chain selector to match detected chain
        setChain(targetChain);
      } else {
        chainConfig = SUPPORTED_CHAINS[targetChain];
      }
      
      // Create provider for the detected/specified chain
      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      
      // Verify contract exists on this chain
      const code = await provider.getCode(address);
      if (code === '0x') {
        throw new Error(`Address is not a contract on ${chainConfig.name}`);
      }
      
      const contract = new ethers.Contract(address, ERC20_ABI, provider);
      console.log(`✅ Contract created on ${chainConfig.name}`);
      
      // Use Promise.allSettled to handle individual failures gracefully
      const [name, symbol, totalSupply, decimals] = await Promise.allSettled([
        contract.name(),
        contract.symbol(), 
        contract.totalSupply(),
        contract.decimals()
      ]);
  
      console.log('📊 Contract call results:', {
        name: name.status === 'fulfilled' ? name.value : `FAILED: ${name.reason?.message}`,
        symbol: symbol.status === 'fulfilled' ? symbol.value : `FAILED: ${symbol.reason?.message}`,
        totalSupply: totalSupply.status === 'fulfilled' ? 'SUCCESS' : `FAILED: ${totalSupply.reason?.message}`,
        decimals: decimals.status === 'fulfilled' ? decimals.value : `FAILED: ${decimals.reason?.message}`
      });
  
      // If all calls failed, this might not be a standard ERC20 token
      if (name.status === 'rejected' && symbol.status === 'rejected' && 
          totalSupply.status === 'rejected' && decimals.status === 'rejected') {
        throw new Error(`Contract on ${chainConfig.name} does not implement standard ERC20 interface`);
      }
  
      const tokenInfo = {
        name: name.status === 'fulfilled' ? name.value : 'Unknown Token',
        symbol: symbol.status === 'fulfilled' ? symbol.value : 'UNKNOWN',
        totalSupply: totalSupply.status === 'fulfilled' ? 
          ethers.formatUnits(totalSupply.value, decimals.status === 'fulfilled' ? Number(decimals.value) : 18) : '0',
        decimals: decimals.status === 'fulfilled' ? Number(decimals.value) : 18,
        address,
        chain: targetChain,
        chainName: chainConfig.name
      };
      
      console.log('✅ Token data processed:', tokenInfo);
      return tokenInfo;
    } catch (error) {
      console.error('❌ fetchTokenData failed:', error);
      debugAPICall('TokenData', address, error);
      throw new Error(`Unable to fetch token data: ${error.message}`);
    }
  };

  const fetchTopHolders = async (tokenAddress, tokenChain = null) => {
    // 🔒 CRITICAL: Validate we're using the original token CA
    console.log('🎯 FETCHING HOLDERS FOR ORIGINAL TOKEN CA:', tokenAddress);
    console.log('⚠️ This should NEVER be a LP pair address (WETH, USDT, etc.)');
    
    // 🔒 Safeguard: Detect common LP token addresses
    const commonLPTokens = [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505', // USDC
      '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
    ];
    
    if (commonLPTokens.includes(tokenAddress.toLowerCase())) {
      throw new Error('❌ LP token detected! Use the original token CA, not WETH/USDT/USDC pair address');
    }
    
    console.log('🔍 Starting fetchTopHolders for:', tokenAddress, 'on chain:', tokenChain || chain);
    try {
      const targetChain = tokenChain || chain;
      const chainConfig = SUPPORTED_CHAINS[targetChain];
      const decimalsToUse = tokenData?.decimals || 18;
      
      // 🔒 Use original token CA for Moralis API calls
      const moralisChain = chainConfig.moralisChain;
      const moralisUrl = `${API_CONFIGS.moralis.baseUrl}/erc20/${tokenAddress}/transfers?chain=${moralisChain}&limit=100`;
      
      console.log('📡 Calling Moralis API for ORIGINAL TOKEN CA:', moralisUrl);
      
      const moralisResponse = await fetch(moralisUrl, {
        headers: {
          'X-API-Key': API_CONFIGS.moralis.key,
          'Content-Type': 'application/json'
        }
      });
      
      if (!moralisResponse.ok) {
        const errorText = await moralisResponse.text();
        console.error('❌ Moralis API error response:', errorText);
        
        // Try alternative approach with token owners endpoint
        console.log('🔄 Trying alternative Moralis owners endpoint...');
        return await fetchHoldersFromOwners(tokenAddress, targetChain, decimalsToUse);
      }
      
      const moralisData = await moralisResponse.json();
      console.log('📊 Moralis data received:', { transferCount: moralisData.result?.length || 0 });
      
      if (!moralisData.result || moralisData.result.length === 0) {
        console.log('⚠️ No transfer data available, trying owners endpoint...');
        return await fetchHoldersFromOwners(tokenAddress, targetChain, decimalsToUse);
      }
      
      // Process transfers to get holders
      const holders = await processTransfersToHolders(moralisData.result, decimalsToUse);
      console.log('📊 Processed holders:', { holderCount: holders.length });
      
      // If we got very few holders from transfers, supplement with owners data
      if (holders.length < 10) {
        console.log('🔄 Low holder count, supplementing with owners data...');
        const ownersData = await fetchHoldersFromOwners(tokenAddress, targetChain, decimalsToUse);
        return ownersData.length > holders.length ? ownersData : holders;
      }
      
      return holders;
      
    } catch (error) {
      console.error('❌ fetchTopHolders failed:', error);
      // Fallback to owners endpoint
      return await fetchHoldersFromOwners(tokenAddress, tokenChain || chain, tokenData?.decimals || 18);
    }
  };

  // Alternative function to fetch holders using Moralis owners endpoint
  const fetchHoldersFromOwners = async (tokenAddress, targetChain, decimals) => {
    try {
      const chainConfig = SUPPORTED_CHAINS[targetChain];
      const moralisChain = chainConfig.moralisChain;
      
      // Use the token owners endpoint (usually has higher limits)
      const ownersUrl = `${API_CONFIGS.moralis.baseUrl}/erc20/${tokenAddress}/owners?chain=${moralisChain}&limit=100&order=DESC`;
      
      console.log('📡 Calling Moralis Owners API:', ownersUrl);
      
      const response = await fetch(ownersUrl, {
        headers: {
          'X-API-Key': API_CONFIGS.moralis.key,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Moralis Owners API error:', errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('📊 Owners data received:', { ownerCount: data.result?.length || 0 });
      
      if (!data.result || data.result.length === 0) {
        return [];
      }
      
      // Convert owners data to holders format
      const holders = data.result
        .filter(owner => owner.balance && owner.balance !== '0')
        .map(owner => ({
          address: owner.owner_address,
          balance: ethers.formatUnits(owner.balance, decimals)
        }))
        .sort((a, b) => {
          const balanceA = BigInt(data.result.find(r => r.owner_address === a.address)?.balance || '0');
          const balanceB = BigInt(data.result.find(r => r.owner_address === b.address)?.balance || '0');
          return balanceA > balanceB ? -1 : 1;
        })
        .slice(0, 50);
      
      console.log('📊 Processed owners to holders:', { holderCount: holders.length });
      return holders;
      
    } catch (error) {
      console.error('❌ fetchHoldersFromOwners failed:', error);
      return [];
    }
  };



  const fetchDeployerInfo = async (tokenAddress) => {
    console.log('🔍 Starting fetchDeployerInfo for:', tokenAddress);
    try {
      const etherscanUrl = `${API_CONFIGS.etherscan.baseUrl}?module=contract&action=getcontractcreation&contractaddresses=${tokenAddress}&apikey=${API_CONFIGS.etherscan.key}`;
      console.log('📡 Calling Etherscan API:', etherscanUrl.replace(API_CONFIGS.etherscan.key, 'API_KEY_HIDDEN'));
      
      const response = await fetch(etherscanUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Etherscan response:', data);
      
      if (data.status === '1' && data.result?.length > 0) {
        debugAPICall('Etherscan Deployer', etherscanUrl);
        return {
          deployer: data.result[0].contractCreator,
          txHash: data.result[0].txHash
        };
      }
      
      console.log('⚠️ Etherscan failed, trying Alchemy fallback');
      return await fetchDeployerFromAlchemy(tokenAddress);
    } catch (error) {
      console.error('❌ fetchDeployerInfo failed:', error);
      debugAPICall('Etherscan Deployer', tokenAddress, error);
      return { deployer: 'Unable to determine', txHash: null };
    }
  };

  const fetchDeployerFromAlchemy = async (tokenAddress) => {
    try {
      const response = await fetch(
        `${API_CONFIGS.alchemy.baseUrl}/${API_CONFIGS.alchemy.key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'alchemy_getTokenMetadata',
            params: [tokenAddress],
            id: 1
          })
        }
      );
      
      const data = await response.json();
      return {
        deployer: data.result?.deployer || 'Unable to determine',
        txHash: null
      };
    } catch (error) {
      console.error('Alchemy deployer fetch failed:', error);
      return { deployer: 'Unable to determine', txHash: null };
    }
  };

  // Helper function to process transfers into holders data
  const processTransfersToHolders = async (transfers, decimals) => {
    const holdersMap = new Map();
    
    transfers?.forEach(transfer => {
      const toAddress = transfer.to_address;
      const fromAddress = transfer.from_address;
      const value = transfer.value;
      
      // Add to recipient
      if (toAddress && toAddress !== '0x0000000000000000000000000000000000000000') {
        if (holdersMap.has(toAddress)) {
          const existing = holdersMap.get(toAddress);
          holdersMap.set(toAddress, {
            address: toAddress,
            rawBalance: (BigInt(existing.rawBalance) + BigInt(value)).toString()
          });
        } else {
          holdersMap.set(toAddress, {
            address: toAddress,
            rawBalance: value
          });
        }
      }
      
      // Subtract from sender
      if (fromAddress && fromAddress !== '0x0000000000000000000000000000000000000000') {
        if (holdersMap.has(fromAddress)) {
          const existing = holdersMap.get(fromAddress);
          const newBalance = BigInt(existing.rawBalance) - BigInt(value);
          if (newBalance > 0) {
            holdersMap.set(fromAddress, {
              address: fromAddress,
              rawBalance: newBalance.toString()
            });
          } else {
            holdersMap.delete(fromAddress);
          }
        }
      }
    });
    
    // Convert to sorted array
    return Array.from(holdersMap.values())
      .filter(holder => BigInt(holder.rawBalance) > 0)
      .map(holder => ({
        address: holder.address,
        balance: ethers.formatUnits(holder.rawBalance, decimals)
      }))
      .sort((a, b) => {
        const balanceA = BigInt(holdersMap.get(a.address).rawBalance);
        const balanceB = BigInt(holdersMap.get(b.address).rawBalance);
        return balanceA > balanceB ? -1 : 1;
      })
      .slice(0, 50);
  };

  const classifyWallets = async (holders, deployer, originalTokenCA, tokenInfo) => {
    console.log('🔒 WALLET CLASSIFICATION - Original Token CA:', originalTokenCA);
    console.log('⚠️ All wallet analysis based on holders of:', originalTokenCA);
    
    const team = [];
    const bundles = [];
    
    try {
      console.log('🔍 Starting wallet classification');
      console.log('📊 Input data:', { 
        holdersCount: holders?.length || 0, 
        deployer, 
        originalTokenCA,
        tokenData: tokenInfo ? { name: tokenInfo.name, symbol: tokenInfo.symbol, totalSupply: tokenInfo.totalSupply } : null 
      });
      
      if (!holders || holders.length === 0) {
        console.log('⚠️ No holders data available for classification');
        return { team, bundles };
      }
      
      // Use tokenInfo parameter instead of component state to avoid race condition
      const totalSupply = parseFloat(tokenInfo?.totalSupply || '0');
      console.log('📊 Total supply for calculation:', totalSupply);
      
      if (totalSupply <= 0) {
        console.log('⚠️ Invalid total supply for percentage calculation');
        console.log('⚠️ Token data:', tokenInfo);
        return { team, bundles };
      }
      
      const deployerLower = deployer?.toLowerCase();
      const suspiciousPatterns = [];
      
      console.log('📊 Starting holder analysis...');
      
      for (const holder of holders) {
        const balance = parseFloat(holder.balance || '0');
        const percentage = (balance / totalSupply) * 100;
        
        console.log(`🔍 Holder: ${holder.address}`);
        console.log(`  - Balance: ${balance}`);
        console.log(`  - Percentage: ${percentage.toFixed(6)}%`);
        console.log(`  - Total Supply: ${totalSupply}`);
        
        // Skip zero balances
        if (balance <= 0) {
          console.log(`  - ⏭️ Skipped (zero balance)`);
          continue;
        }
        
        // ULTRA-AGGRESSIVE THRESHOLDS - Specifically for small/new tokens
        if (percentage > 0.1) {
          // Team wallets: >0.1% (very sensitive for new tokens)
          const walletType = holder.address.toLowerCase() === deployerLower ? 'Deployer Wallet' : 'Team Wallet';
          team.push({
            address: holder.address,
            balance: balance.toFixed(4),
            percentage: percentage.toFixed(4),
            type: walletType
          });
          console.log(`  - ✅ TEAM WALLET DETECTED: ${walletType} (${percentage.toFixed(4)}%)`);
        }
        else if (percentage > 0.01) {
          // Bundle wallets: >0.01% (catches even tiny coordinated wallets)
          bundles.push({
            address: holder.address,
            balance: balance.toFixed(4),
            percentage: percentage.toFixed(4),
            type: 'Bundle Wallet'
          });
          console.log(`  - ✅ BUNDLE WALLET DETECTED: (${percentage.toFixed(4)}%)`);
        } else if (percentage > 0.001) {
          // Track for pattern analysis (ultra-low threshold)
          suspiciousPatterns.push({
            address: holder.address,
            percentage: percentage.toFixed(6)
          });
          console.log(`  - 🔍 Tracked for pattern analysis (${percentage.toFixed(6)}%)`);
        } else {
          console.log(`  - ⏭️ Below thresholds (${percentage.toFixed(6)}%)`);
        }
        
        // Track for pattern analysis
        if (percentage > 0.001) {
          suspiciousPatterns.push({
            address: holder.address,
            percentage: percentage.toFixed(6)
          });
        }
      }
      
      console.log(`📊 Initial classification: ${team.length} team, ${bundles.length} bundles`);
      console.log(`📊 Suspicious patterns found: ${suspiciousPatterns.length}`);
      
      // Enhanced coordinated bundle detection
      if (suspiciousPatterns.length > 2) {
        console.log('🔍 Analyzing coordinated patterns...');
        const groupedByPercentage = {};
        suspiciousPatterns.forEach(wallet => {
          const roundedPercentage = Math.round(parseFloat(wallet.percentage) * 20) / 20;
          if (!groupedByPercentage[roundedPercentage]) {
            groupedByPercentage[roundedPercentage] = [];
          }
          groupedByPercentage[roundedPercentage].push(wallet);
        });
        
        console.log('📊 Grouped patterns:', groupedByPercentage);
        
        Object.entries(groupedByPercentage).forEach(([percentage, wallets]) => {
          console.log(`🔍 Checking group: ${percentage}% with ${wallets.length} wallets`);
          if (wallets.length >= 2 && parseFloat(percentage) > 0.001) {
            console.log(`✅ Coordinated pattern found: ${wallets.length} wallets with ~${percentage}%`);
            wallets.forEach(wallet => {
              const holderData = holders.find(h => h.address === wallet.address);
              if (holderData && !bundles.find(b => b.address === wallet.address) && !team.find(t => t.address === wallet.address)) {
                bundles.push({
                  address: wallet.address,
                  balance: parseFloat(holderData.balance).toFixed(4),
                  percentage: wallet.percentage,
                  type: 'Coordinated Bundle'
                });
                console.log(`  - Added coordinated bundle: ${wallet.address}`);
              }
            });
          }
        });
      }
      
      console.log(`📊 FINAL CLASSIFICATION RESULT:`);
      console.log(`  - Team wallets: ${team.length}`);
      console.log(`  - Bundle wallets: ${bundles.length}`);
      
      if (team.length > 0) {
        console.log('📊 Team wallets details:', team);
      }
      if (bundles.length > 0) {
        console.log('📊 Bundle wallets details:', bundles);
      }
      
      return { team, bundles };
    } catch (error) {
      console.error('❌ classifyWallets failed:', error);
      console.error('❌ Error stack:', error.stack);
      return { team: [], bundles: [] };
    }
  };
  


  const fetchDexData = async (address) => {
    // 🔒 DEX data is for price monitoring ONLY, not wallet analysis
    console.log('📊 FETCHING DEX DATA for price monitoring:', address);
    console.log('⚠️ DEX data used for price/liquidity monitoring, NOT wallet analysis');
    
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        // Get the pair with highest liquidity
        const pair = data.pairs.reduce((prev, current) => 
          (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0) ? prev : current
        );
        
        console.log('📊 DEX pair found:', {
          baseToken: pair.baseToken?.symbol,
          quoteToken: pair.quoteToken?.symbol,
          pairAddress: pair.pairAddress,
          note: 'This pair address is NOT used for wallet analysis'
        });
        
        return {
          // Basic token info
          baseToken: pair.baseToken,
          quoteToken: pair.quoteToken,
          
          // Price data
          priceUsd: pair.priceUsd,
          priceNative: pair.priceNative,
          
          // Market data
          fdv: pair.fdv, // Fully Diluted Valuation
          marketCap: pair.marketCap,
          
          // Volume data
          volume24h: pair.volume?.h24,
          volume6h: pair.volume?.h6,
          volume1h: pair.volume?.h1,
          volume5m: pair.volume?.m5,
          
          // Price changes
          priceChange24h: pair.priceChange?.h24,
          priceChange6h: pair.priceChange?.h6,
          priceChange1h: pair.priceChange?.h1,
          priceChange5m: pair.priceChange?.m5,
          
          // Liquidity data
          liquidity: pair.liquidity?.usd,
          liquidityChange24h: pair.liquidityChange?.h24,
          
          // Volume changes
          volumeChange24h: pair.volumeChange?.h24,
          volumeChange6h: pair.volumeChange?.h6,
          volumeChange1h: pair.volumeChange?.h1,
          
          // Trading data
          txns24h: pair.txns?.h24,
          txns6h: pair.txns?.h6,
          txns1h: pair.txns?.h1,
          
          // Pair info
          pairAddress: pair.pairAddress,
          dexId: pair.dexId,
          url: pair.url,
          
          // Additional metrics
          pairCreatedAt: pair.pairCreatedAt,
          info: pair.info,
          
          // Social links if available
          socials: pair.info?.socials || [],
          websites: pair.info?.websites || []
        };
      }
      return null;
    } catch (error) {
      console.error('DEX data fetch failed:', error);
      return null;
    }
  };

  // Enhanced monitoring with better thresholds
  const startMonitoring = async (address) => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
    }
  
    watchIntervalRef.current = setInterval(async () => {
      try {
        const newDexData = await fetchDexData(address);
        if (newDexData && dexData) {
          const oldPrice = parseFloat(dexData.priceUsd || '0');
          const newPrice = parseFloat(newDexData.priceUsd || '0');
          
          const priceChange = ((newPrice - oldPrice) / oldPrice * 100);
          
          // Enhanced alert thresholds
          if (Math.abs(priceChange) > 5) {
            addAlert(
              `🚨 ${tokenData.symbol} Price Alert: ${priceChange > 0 ? '📈' : '📉'} ${Math.abs(priceChange).toFixed(2)}%`,
              priceChange > 0 ? 'info' : 'warning'
            );
          }
          
          // Liquidity monitoring
          const oldLiquidity = parseFloat(dexData.liquidity || '0');
          const newLiquidity = parseFloat(newDexData.liquidity || '0');
          
          if (newLiquidity < oldLiquidity * 0.9) {
            addAlert(
              `⚠️ ${tokenData.symbol} Liquidity Alert: Dropped ${((oldLiquidity - newLiquidity) / oldLiquidity * 100).toFixed(2)}%`,
              'error'
            );
          }
          
          setDexData(newDexData);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 30000); // 30-second intervals
  };

  const addAlert = (message, type = 'info') => {
    const alert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleString()
    };
    
    setAlerts(prev => [alert, ...prev]);
    
    if (type === 'warning' || type === 'error') {
      toast[type](message);
    }
  };

  // Function to fetch wallet transactions
  const fetchWalletTransactions = async (walletAddress) => {
    if (!walletAddress || walletTransactions[walletAddress]) {
      return walletTransactions[walletAddress] || [];
    }

    setLoadingTransactions(true);
    try {
      const chainConfig = SUPPORTED_CHAINS[chain];
      const apiKey = API_CONFIGS.etherscan.key;
      
      if (!apiKey) {
        throw new Error('Etherscan API key not configured');
      }

      // Fetch normal transactions
      const txUrl = `${chainConfig.etherscanUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;
      
      const response = await fetch(txUrl);
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        const transactions = data.result.map(tx => ({
          hash: tx.hash,
          method: tx.input.slice(0, 10) === '0xa9059cbb' ? 'Transfer' : 
                 tx.input.slice(0, 10) === '0x095ea7b3' ? 'Approve' :
                 tx.input === '0x' ? 'Transfer' : 'Contract Call',
          block: tx.blockNumber,
          age: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(),
          from: tx.from,
          to: tx.to,
          amount: ethers.formatEther(tx.value),
          txnFee: ethers.formatEther((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString()),
          status: tx.txreceipt_status === '1' ? 'Success' : 'Failed'
        }));
        
        setWalletTransactions(prev => ({
          ...prev,
          [walletAddress]: transactions
        }));
        
        return transactions;
      }
      return [];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      addAlert(`Failed to fetch transactions for ${formatAddress(walletAddress)}`, 'error');
      return [];
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Function to handle wallet click and show transactions
  const handleWalletClick = async (walletAddress) => {
    setSelectedWallet(walletAddress);
    await fetchWalletTransactions(walletAddress);
  };


  const startWatching = async () => {
    // Clean and validate the address - ALWAYS use original token CA
    const cleanAddress = tokenAddress.trim();
    
    if (!cleanAddress) {
      toast.error('Please enter a token address');
      return;
    }
    
    if (!ethers.isAddress(cleanAddress)) {
      toast.error('Please enter a valid token address');
      return;
    }
    
    // 🔒 CRITICAL: Ensure we're analyzing the ORIGINAL TOKEN CA, not LP pairs
    console.log('🎯 WALLET ANALYSIS TARGET: Original Token CA =', cleanAddress);
    console.log('⚠️ NEVER use LP pair addresses for wallet analysis');
    
    // Reset all states before starting new analysis
    setTokenData(null);
    setDeployerInfo(null);
    setTopHolders([]);
    setTeamWallets([]);
    setBundleWallets([]);
    setDexData(null);
    
    setLoading(true);
    
    try {
      console.log('🔄 Starting comprehensive analysis...');
      
      // 🔒 ALL wallet analysis functions use the ORIGINAL token CA
      const [token, deployer, holders, dex] = await Promise.all([
        fetchTokenData(cleanAddress),        // ✅ Uses original token CA
        fetchDeployerInfo(cleanAddress),     // ✅ Uses original token CA  
        fetchTopHolders(cleanAddress),       // ✅ Uses original token CA
        fetchDexData(cleanAddress)           // ✅ Uses original token CA for DEX data only
      ]);
      
      console.log('✅ All data fetched successfully:', {
        token: token ? `${token.name} (${token.symbol})` : 'null',
        deployer: deployer?.deployer || 'null',
        holdersCount: holders?.length || 0,
        dexData: dex ? 'available' : 'null'
      });
      
      // Ensure we have valid token data before proceeding
      if (!token || !token.totalSupply) {
        throw new Error('Failed to fetch valid token data');
      }
      
      // 🔒 Pass token data directly to avoid race condition
      console.log('🔄 Starting wallet classification with token data:', token);
      const { team, bundles } = await classifyWallets(holders, deployer.deployer, cleanAddress, token);
      
      console.log('✅ Wallet classification complete:', {
        teamWallets: team.length,
        bundleWallets: bundles.length
      });
      
      // Update all states after successful analysis
      setTokenData(token);
      setDeployerInfo(deployer);
      setTopHolders(holders);
      setDexData(dex);
      setTeamWallets(team);
      setBundleWallets(bundles);
  
      // Add to watchlist with cleaned address
      if (!watchlist.find(w => w.address === cleanAddress)) {
        setWatchlist(prev => [...prev, { address: cleanAddress, chain, ...token }]);
      }
  
      addAlert(`Analysis complete for ${token.name} - Found ${team.length} team wallets and ${bundles.length} bundle wallets`, 'success');
      startMonitoring(cleanAddress);  // ✅ Monitor price using DEX data, but analyze wallets using token CA
      
    } catch (error) {
      console.error('Analysis failed:', error);
      
      // Reset states on error
      setTokenData(null);
      setDeployerInfo(null);
      setTopHolders([]);
      setTeamWallets([]);
      setBundleWallets([]);
      setDexData(null);
      
      // More specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Address is not a contract')) {
        errorMessage = `Address is not a contract on ${chain}. Please verify:\n• The address is correct\n• You're on the right network\n• The contract exists on ${chain}`;
      }
      
      addAlert(`Analysis failed: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = (address) => {
    setWatchlist(prev => prev.filter(w => w.address !== address));
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (address) => {
    const explorers = {
      ethereum: 'https://etherscan.io/address/',
      bsc: 'https://bscscan.com/address/',
      polygon: 'https://polygonscan.com/address/',
      arbitrum: 'https://arbiscan.io/address/'
    };
    return `${explorers[chain] || explorers.ethereum}${address}`;
  };

  useEffect(() => {
    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <ToastContainer position="top-right" theme="dark" />
      
      <div className="flex items-center mb-4">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
        <h2 className="text-xl font-semibold text-white">Team & Bundle Wallet Scanner</h2>
      </div>
      
      {/* Input Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Token Address</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Chain</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="avalanche">Avalanche</option>
              <option value="fantom">Fantom</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={startWatching}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium text-white"
            >
              {loading ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {['analysis', 'alerts', 'watchlist'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Enhanced Token Information */}
          {tokenData && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                Token Information
                {dexData?.url && (
                  <a 
                    href={dexData.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    📊 View on DexScreener
                  </a>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <div className="space-y-2 text-gray-300">
                  <h4 className="text-white font-medium mb-2">Basic Information</h4>
                  <p><span className="text-gray-400">Name:</span> {tokenData.name}</p>
                  <p><span className="text-gray-400">Symbol:</span> {tokenData.symbol}</p>
                  <p><span className="text-gray-400">Total Supply:</span> {parseFloat(tokenData.totalSupply).toLocaleString()}</p>
                  <p><span className="text-gray-400">Decimals:</span> {tokenData.decimals}</p>
                  <p><span className="text-gray-400">Chain:</span> {tokenData.chainName}</p>
                  <p><span className="text-gray-400">Holders:</span> {topHolders?.length || 'N/A'}</p>
                  <p><span className="text-gray-400">Deployer:</span> 
                    <a href={getExplorerUrl(deployerInfo?.deployer)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                      {deployerInfo?.deployer !== 'Unable to determine' ? formatAddress(deployerInfo?.deployer) : 'Unable to determine'}
                    </a>
                  </p>
                </div>
                
                {/* Market Data */}
                <div className="space-y-2 text-gray-300">
                  <h4 className="text-white font-medium mb-2">Market Data</h4>
                  <p><span className="text-gray-400">Price (USD):</span> 
                    <span className="text-green-400 font-mono">
                      ${dexData?.priceUsd ? parseFloat(dexData.priceUsd).toFixed(8) : 'N/A'}
                    </span>
                  </p>
                  <p><span className="text-gray-400">Market Cap:</span> 
                    <span className="text-yellow-400">
                      {dexData?.marketCap ? `$${parseFloat(dexData.marketCap).toLocaleString()}` : 'N/A'}
                    </span>
                  </p>
                  <p><span className="text-gray-400">FDV:</span> 
                    <span className="text-yellow-400">
                      {dexData?.fdv ? `$${parseFloat(dexData.fdv).toLocaleString()}` : 'N/A'}
                    </span>
                  </p>
                  <p><span className="text-gray-400">Liquidity:</span> 
                    <span className={dexData?.liquidity ? 'text-green-400' : 'text-red-400'}>
                      {dexData?.liquidity ? `$${parseFloat(dexData.liquidity).toLocaleString()}` : '$0'}
                    </span>
                  </p>
                  <p><span className="text-gray-400">Pair Created:</span> 
                    {dexData?.pairCreatedAt ? new Date(dexData.pairCreatedAt * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Social Links */}
              {dexData?.socials?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <h4 className="text-white font-medium mb-2">Social Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {dexData.socials.map((social, index) => (
                      <a 
                        key={index}
                        href={social.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white"
                      >
                        {social.type}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Websites */}
              {dexData?.websites?.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-white font-medium mb-2">Websites</h4>
                  <div className="flex flex-wrap gap-2">
                    {dexData.websites.map((website, index) => (
                      <a 
                        key={index}
                        href={website.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm text-white"
                      >
                        🌐 Website
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced DEX Information */}
          {dexData && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-white">Live Trading Data</h3>
              
              {/* Trading Pair Info */}
              <div className="mb-4 p-3 bg-gray-600 rounded">
                <h4 className="text-white font-medium mb-2">Trading Pair</h4>
                <p className="text-gray-300">
                  <span className="text-blue-400 font-mono">{dexData.baseToken.symbol}</span>
                  <span className="text-gray-400 mx-2">/</span>
                  <span className="text-green-400 font-mono">{dexData.quoteToken.symbol}</span>
                  <span className="text-gray-400 ml-2">on {dexData.dexId}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Pair: <a href={getExplorerUrl(dexData.pairAddress)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {formatAddress(dexData.pairAddress)}
                  </a>
                </p>
              </div>
              
              {/* Price Changes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-600 p-3 rounded">
                  <p className="text-xs text-gray-400">5m Change</p>
                  <p className={`font-mono ${parseFloat(dexData.priceChange5m || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dexData.priceChange5m ? `${parseFloat(dexData.priceChange5m).toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <p className="text-xs text-gray-400">1h Change</p>
                  <p className={`font-mono ${parseFloat(dexData.priceChange1h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dexData.priceChange1h ? `${parseFloat(dexData.priceChange1h).toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <p className="text-xs text-gray-400">6h Change</p>
                  <p className={`font-mono ${parseFloat(dexData.priceChange6h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dexData.priceChange6h ? `${parseFloat(dexData.priceChange6h).toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <p className="text-xs text-gray-400">24h Change</p>
                  <p className={`font-mono ${parseFloat(dexData.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dexData.priceChange24h ? `${parseFloat(dexData.priceChange24h).toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Volume Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-600 p-3 rounded">
                  <h4 className="text-white font-medium mb-2">Volume</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-400">5m:</span> <span className="text-blue-400">{dexData.volume5m ? `$${parseFloat(dexData.volume5m).toLocaleString()}` : 'N/A'}</span></p>
                    <p><span className="text-gray-400">1h:</span> <span className="text-blue-400">{dexData.volume1h ? `$${parseFloat(dexData.volume1h).toLocaleString()}` : 'N/A'}</span></p>
                    <p><span className="text-gray-400">6h:</span> <span className="text-blue-400">{dexData.volume6h ? `$${parseFloat(dexData.volume6h).toLocaleString()}` : 'N/A'}</span></p>
                    <p><span className="text-gray-400">24h:</span> <span className="text-blue-400">{dexData.volume24h ? `$${parseFloat(dexData.volume24h).toLocaleString()}` : 'N/A'}</span></p>
                  </div>
                </div>
                
                <div className="bg-gray-600 p-3 rounded">
                  <h4 className="text-white font-medium mb-2">Transactions</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-400">1h:</span> <span className="text-purple-400">{dexData.txns1h?.buys + dexData.txns1h?.sells || 'N/A'}</span></p>
                    <p><span className="text-gray-400">6h:</span> <span className="text-purple-400">{dexData.txns6h?.buys + dexData.txns6h?.sells || 'N/A'}</span></p>
                    <p><span className="text-gray-400">24h:</span> <span className="text-purple-400">{dexData.txns24h?.buys + dexData.txns24h?.sells || 'N/A'}</span></p>
                    <p><span className="text-gray-400">24h Buys/Sells:</span> 
                      <span className="text-green-400">{dexData.txns24h?.buys || 0}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-400">{dexData.txns24h?.sells || 0}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Liquidity Changes */}
              <div className="bg-gray-600 p-3 rounded">
                <h4 className="text-white font-medium mb-2">Liquidity Analysis</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="text-gray-400">Current Liquidity:</span> 
                      <span className={`ml-1 ${dexData.liquidity ? 'text-green-400' : 'text-red-400'}`}>
                        {dexData.liquidity ? `$${parseFloat(dexData.liquidity).toLocaleString()}` : '$0'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p><span className="text-gray-400">24h Change:</span> 
                      <span className={`ml-1 ${parseFloat(dexData.liquidityChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {dexData.liquidityChange24h ? `${parseFloat(dexData.liquidityChange24h).toFixed(2)}%` : 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Risk Assessment */}
              <div className="mt-4 p-3 bg-gray-800 rounded">
                <h4 className="text-white font-medium mb-2">🚨 Risk Assessment</h4>
                <div className="space-y-1 text-sm">
                  {dexData.liquidity && parseFloat(dexData.liquidity) < 10000 && (
                    <p className="text-red-400">⚠️ Low liquidity (&lt; $10k) - High slippage risk</p>
                  )}
                  {Math.abs(parseFloat(dexData.priceChange24h || 0)) > 50 && (
                    <p className="text-red-400">⚠️ Extreme volatility (&gt; 50% in 24h)</p>
                  )}
                  {dexData.txns24h && (dexData.txns24h.buys + dexData.txns24h.sells) < 10 && (
                    <p className="text-yellow-400">⚠️ Low trading activity (&lt; 10 txns/24h)</p>
                  )}
                  {dexData.pairCreatedAt && (Date.now() / 1000 - dexData.pairCreatedAt) < 86400 && (
                    <p className="text-yellow-400">⚠️ New pair (&lt; 24h old)</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Team Wallets */}
          {(tokenData || teamWallets.length > 0) && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-white">Team Wallets ({teamWallets.length})</h3>
              {teamWallets.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teamWallets.map((wallet, index) => (
                    <div key={index} className="bg-gray-600 rounded">
                      <div 
                        className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-500"
                        onClick={() => handleWalletClick(wallet.address)}
                      >
                        <a href={getExplorerUrl(wallet.address)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {formatAddress(wallet.address)}
                        </a>
                        <span className="text-sm text-gray-300">{wallet.percentage}%</span>
                      </div>
                      
                      {/* Transaction Details */}
                      {selectedWallet === wallet.address && (
                        <div className="border-t border-gray-500 p-3">
                          <h4 className="text-sm font-medium text-white mb-2">Recent Transactions</h4>
                          {loadingTransactions ? (
                            <div className="text-center py-2">
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                              <span className="ml-2 text-gray-400">Loading transactions...</span>
                            </div>
                          ) : walletTransactions[wallet.address]?.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-gray-300">
                                <thead>
                                  <tr className="border-b border-gray-500">
                                    <th className="text-left p-1">Txn Hash</th>
                                    <th className="text-left p-1">Method</th>
                                    <th className="text-left p-1">Block</th>
                                    <th className="text-left p-1">Age</th>
                                    <th className="text-left p-1">From</th>
                                    <th className="text-left p-1">To</th>
                                    <th className="text-left p-1">Amount</th>
                                    <th className="text-left p-1">Txn Fee</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {walletTransactions[wallet.address].slice(0, 5).map((tx, txIndex) => (
                                    <tr key={txIndex} className="border-b border-gray-600 hover:bg-gray-500">
                                      <td className="p-1">
                                        <a 
                                          href={`${SUPPORTED_CHAINS[chain].explorerUrl}/tx/${tx.hash}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-400 hover:underline"
                                        >
                                          {tx.hash.slice(0, 8)}...
                                        </a>
                                      </td>
                                      <td className="p-1">
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                          tx.method === 'Transfer' ? 'bg-green-900 text-green-300' :
                                          tx.method === 'Approve' ? 'bg-yellow-900 text-yellow-300' :
                                          'bg-blue-900 text-blue-300'
                                        }`}>
                                          {tx.method}
                                        </span>
                                      </td>
                                      <td className="p-1">{tx.block}</td>
                                      <td className="p-1" title={tx.age}>{tx.age.split(',')[0]}</td>
                                      <td className="p-1">
                                        <a 
                                          href={`${SUPPORTED_CHAINS[chain].explorerUrl}/address/${tx.from}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-400 hover:underline"
                                        >
                                          {formatAddress(tx.from)}
                                        </a>
                                      </td>
                                      <td className="p-1">
                                        <a 
                                          href={`${SUPPORTED_CHAINS[chain].explorerUrl}/address/${tx.to}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-400 hover:underline"
                                        >
                                          {formatAddress(tx.to)}
                                        </a>
                                      </td>
                                      <td className="p-1">{parseFloat(tx.amount).toFixed(4)} ETH</td>
                                      <td className="p-1">{parseFloat(tx.txnFee).toFixed(6)} ETH</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {walletTransactions[wallet.address].length > 5 && (
                                <div className="text-center mt-2">
                                  <a 
                                    href={`${SUPPORTED_CHAINS[chain].explorerUrl}/address/${wallet.address}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-400 hover:underline text-xs"
                                  >
                                    View all transactions on explorer →
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-xs">No recent transactions found</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No team wallets detected above 0.1% threshold</p>
              )}
            </div>
          )}

          {/* Bundle Wallets */}
          {(tokenData || bundleWallets.length > 0) && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-white">Bundle Wallets ({bundleWallets.length})</h3>
              {bundleWallets.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bundleWallets.map((wallet, index) => (
                    <div key={index} className="bg-gray-600 rounded">
                      <div 
                        className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-500"
                        onClick={() => handleWalletClick(wallet.address)}
                      >
                        <a href={getExplorerUrl(wallet.address)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {formatAddress(wallet.address)}
                        </a>
                        <span className="text-sm text-gray-300">{wallet.percentage}%</span>
                      </div>
                      
                      {/* Transaction Details */}
                      {selectedWallet === wallet.address && (
                        <div className="border-t border-gray-500 p-3">
                          <h4 className="text-sm font-medium text-white mb-2">Recent Transactions</h4>
                          {loadingTransactions ? (
                            <div className="text-center py-2">
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                              <span className="ml-2 text-gray-400">Loading transactions...</span>
                            </div>
                          ) : walletTransactions[wallet.address]?.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-gray-300">
                                <thead>
                                  <tr className="border-b border-gray-500">
                                    <th className="text-left p-1">Txn Hash</th>
                                    <th className="text-left p-1">Method</th>
                                    <th className="text-left p-1">Block</th>
                                    <th className="text-left p-1">Age</th>
                                    <th className="text-left p-1">From</th>
                                    <th className="text-left p-1">To</th>
                                    <th className="text-left p-1">Amount</th>
                                    <th className="text-left p-1">Txn Fee</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {walletTransactions[wallet.address].slice(0, 5).map((tx, txIndex) => (
                                    <tr key={txIndex} className="border-b border-gray-600 hover:bg-gray-500">
                                      <td className="p-1">
                                        <a 
                                          href={`${SUPPORTED_CHAINS[chain].explorerUrl}/tx/${tx.hash}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-400 hover:underline"
                                        >
                                          {tx.hash.slice(0, 8)}...
                                        </a>
                                      </td>
                                      <td className="p-1">
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                          tx.method === 'Transfer' ? 'bg-green-900 text-green-300' :
                                          tx.method === 'Approve' ? 'bg-yellow-900 text-yellow-300' :
                                          'bg-blue-900 text-blue-300'
                                        }`}>
                                          {tx.method}
                                        </span>
                                      </td>
                                      <td className="p-1">{tx.block}</td>
                                      <td className="p-1" title={tx.age}>{tx.age.split(',')[0]}</td>
                                      <td className="p-1">
                                        <a 
                                          href={`${SUPPORTED_CHAINS[chain].explorerUrl}/address/${tx.from}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-400 hover:underline"
                                        >
                                          {formatAddress(tx.from)}
                                        </a>
                                      </td>
                                      <td className="p-1">
                                        <a 
                                          href={`${SUPPORTED_CHAINS[chain].explorerUrl}/address/${tx.to}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-400 hover:underline"
                                        >
                                          {formatAddress(tx.to)}
                                        </a>
                                      </td>
                                      <td className="p-1">{parseFloat(tx.amount).toFixed(4)} ETH</td>
                                      <td className="p-1">{parseFloat(tx.txnFee).toFixed(6)} ETH</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {walletTransactions[wallet.address].length > 5 && (
                                <div className="text-center mt-2">
                                  <a 
                                    href={`${SUPPORTED_CHAINS[chain].explorerUrl}/address/${wallet.address}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-400 hover:underline text-xs"
                                  >
                                    View all transactions on explorer →
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-xs">No recent transactions found</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No bundle wallets detected above 0.01% threshold</p>
              )}
            </div>
          )}

          {/* Enhanced Fallback Messages */}
          {teamWallets.length === 0 && bundleWallets.length === 0 && tokenData && (
            <div className="bg-gray-700 rounded-lg p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-white">Wallet Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <p className="text-gray-300">Analysis completed with {topHolders?.length || 0} holders found</p>
                </div>
                
                {topHolders?.length === 0 ? (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-300 font-medium">⚠️ No holder data available</p>
                    <p className="text-red-400 text-sm mt-1">This could indicate:</p>
                    <ul className="list-disc list-inside mt-2 text-red-400 text-sm space-y-1">
                      <li>Very new token with limited transfer history</li>
                      <li>Token not actively traded</li>
                      <li>API limitations for this blockchain</li>
                      <li>Non-standard token implementation</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-300 font-medium">✅ Normal distribution detected</p>
                    <p className="text-blue-400 text-sm mt-1">No suspicious wallet patterns found:</p>
                    <ul className="list-disc list-inside mt-2 text-blue-400 text-sm space-y-1">
                      <li>No wallets holding &gt;0.1% of supply (team threshold)</li>
                      <li>No coordinated bundle patterns detected</li>
                      <li>Distribution appears organic</li>
                      <li>Analyzed {topHolders.length} top holders</li>
                    </ul>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-gray-600 rounded">
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium">Detection Thresholds:</span><br/>
                    • Team wallets: >0.1% of total supply<br/>
                    • Bundle wallets: >0.01% of total supply<br/>
                    • Coordinated patterns: 2+ similar holdings >0.001%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-white">Live Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-gray-400">No alerts yet. Start analyzing tokens to see live alerts.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-md ${
                  alert.type === 'error' ? 'bg-red-900 text-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-900 text-yellow-200' :
                  alert.type === 'success' ? 'bg-green-900 text-green-200' :
                  'bg-blue-900 text-blue-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm">{alert.message}</p>
                    <span className="text-xs opacity-75">{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'watchlist' && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-white">Watchlist</h3>
          {watchlist.length === 0 ? (
            <p className="text-gray-400">No tokens in watchlist. Analyze tokens to add them automatically.</p>
          ) : (
            <div className="space-y-2">
              {watchlist.map((token, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-600 rounded">
                  <div>
                    <p className="font-medium text-white">{token.name} ({token.symbol})</p>
                    <p className="text-sm text-gray-400">{formatAddress(token.address)}</p>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(token.address)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamBundleWalletScanner;