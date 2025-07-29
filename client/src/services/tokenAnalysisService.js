import { ethers, JsonRpcProvider, BrowserProvider, Contract, formatUnits, formatEther } from 'ethers';

class TokenAnalysisService {
  constructor() {
    this.provider = null;
    this.watchers = new Map();
    this.initProvider();
    
    // Using environment variables for API keys
    this.ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;
    this.MORALIS_API_KEY = process.env.REACT_APP_MORALIS_API_KEY;
    this.ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
  }

  async initProvider() {
    try {
      // Try multiple free RPC providers
      const rpcUrls = [
        'https://ethereum.publicnode.com',
        'https://rpc.ankr.com/eth',
        'https://eth.llamarpc.com',
        'https://cloudflare-eth.com',
        'https://ethereum.blockpi.network/v1/rpc/public'
      ];
      
      // Try MetaMask first if available
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          await provider.getNetwork(); // Test connection
          this.provider = provider;
          console.log('✅ Connected via MetaMask/Injected provider');
          return;
        } catch (error) {
          console.log('⚠️ MetaMask not available, trying public RPC...');
        }
      }
      
      // Try public RPC providers
      for (const rpcUrl of rpcUrls) {
        try {
          const provider = new JsonRpcProvider(rpcUrl);
          await provider.getNetwork(); // Test connection
          this.provider = provider;
          console.log(`✅ Connected via ${rpcUrl}`);
          return;
        } catch (error) {
          console.log(`❌ Failed to connect to ${rpcUrl}`);
          continue;
        }
      }
      
      throw new Error('All RPC providers failed');
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      throw error;
    }
  }

  async analyzeToken(contractAddress) {
    try {
      console.log(`🔍 Starting analysis for ${contractAddress}`);
      
      if (!this.provider) {
        await this.initProvider();
      }

      const results = {
        address: contractAddress,
        isContract: false,
        tokenInfo: null,
        securityChecks: {
          isVerified: false,
          hasProxyPattern: false,
          hasOwnership: false,
          hasMintFunction: false,
          hasPauseFunction: false,
          hasBlacklistFunction: false
        },
        riskLevel: 'unknown',
        warnings: [],
        note: ''
      };

      // Check if address is a contract
      const code = await this.provider.getCode(contractAddress);
      results.isContract = code !== '0x';
      
      if (!results.isContract) {
        results.warnings.push('Address is not a contract');
        results.riskLevel = 'high';
        return results;
      }

      console.log('✅ Contract detected');

      // Get token info
      try {
        results.tokenInfo = await this.getTokenInfo(contractAddress);
        console.log('✅ Token info retrieved');
      } catch (error) {
        console.log('⚠️ Failed to get token info:', error.message);
        results.warnings.push('Failed to retrieve token information');
      }

      // Security checks
      await this.performSecurityChecks(contractAddress, results);

      // Calculate risk level
      results.riskLevel = this.calculateRiskLevel(results);

      console.log('✅ Analysis complete');
      return results;

    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  async getTokenInfo(contractAddress) {
    try {
      // Try to get token info from Etherscan first
      if (this.ETHERSCAN_API_KEY) {
        try {
          return await this.getTokenInfoFromEtherscan(contractAddress);
        } catch (error) {
          console.log('Etherscan API failed, trying direct contract calls...');
        }
      }

      // Fallback to direct contract calls
      return await this.getTokenInfoFromContract(contractAddress);
    } catch (error) {
      console.error('Failed to get token info:', error);
      throw error;
    }
  }

  async getTokenInfoFromContract(contractAddress) {
    const erc20Abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)'
    ];

    try {
      const contract = new Contract(contractAddress, erc20Abi, this.provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);

      return {
        name: name.status === 'fulfilled' ? name.value : 'Unknown Token',
        symbol: symbol.status === 'fulfilled' ? symbol.value : 'UNKNOWN',
        decimals: decimals.status === 'fulfilled' ? decimals.value : 18,
        totalSupply: totalSupply.status === 'fulfilled' ? totalSupply.value.toString() : '0'
      };
    } catch (error) {
      console.log('Direct contract calls failed, returning default values');
      return {
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 18,
        totalSupply: '0'
      };
    }
  }

  async performSecurityChecks(contractAddress, results) {
    try {
      // Check if contract is verified on Etherscan
      if (this.ETHERSCAN_API_KEY) {
        try {
          results.securityChecks.isVerified = await this.checkIfVerified(contractAddress);
        } catch (error) {
          console.log('Verification check failed:', error.message);
        }
      }

      // Check for ERC-20 compliance
      try {
        const erc20Abi = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function transferFrom(address from, address to, uint256 amount) returns (bool)',
          'function approve(address spender, uint256 amount) returns (bool)'
        ];
        
        const contract = new Contract(contractAddress, erc20Abi, this.provider);
        await contract.transfer.staticCall('0x0000000000000000000000000000000000000000', 0);
        console.log('✅ ERC-20 interface detected');
      } catch (e) {
        console.log('⚠️ No ERC-20 interface');
        results.note = 'May not be a standard ERC-20 token';
      }

    } catch (error) {
      console.error('Security checks failed:', error);
    }
  }

  // Add this helper method
  timeoutPromise(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
  }

  async getTokenInfoFromEtherscan(contractAddress) {
    try {
      console.log('Fetching token info from Etherscan API...');
      
      // Use the free tier endpoint for contract source code
      // This endpoint works with free API keys
      const response = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${this.ETHERSCAN_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result && data.result[0]) {
        const contractInfo = data.result[0];
        
        // Extract token info from contract name if available
        const contractName = contractInfo.ContractName || 'Unknown Token';
        
        return {
          name: contractName,
          symbol: contractName.substring(0, 10), // Fallback symbol
          totalSupply: '0',
          decimals: 18
        };
      } else {
        console.log('No contract info found on Etherscan');
        // Contract exists, return basic info
        return {
          name: 'ERC20 Token',
          symbol: 'ERC20',
          totalSupply: '0',
          decimals: 18
        };
      }
    } catch (error) {
      console.error('Etherscan API error:', error);
      throw error;
    }
  }

  async checkIfVerified(contractAddress) {
    try {
      const response = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${this.ETHERSCAN_API_KEY}`
      );
      
      const data = await response.json();
      return data.status === '1' && data.result[0].SourceCode !== '';
    } catch (error) {
      console.error('Verification check failed:', error);
      return false;
    }
  }

  calculateRiskLevel(results) {
    let riskScore = 0;
    
    if (!results.securityChecks.isVerified) riskScore += 30;
    if (results.securityChecks.hasProxyPattern) riskScore += 20;
    if (results.securityChecks.hasOwnership) riskScore += 15;
    if (results.securityChecks.hasMintFunction) riskScore += 25;
    if (results.securityChecks.hasPauseFunction) riskScore += 15;
    if (results.securityChecks.hasBlacklistFunction) riskScore += 35;
    
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  async getDeployerInfo(contractAddress) {
    try {
      console.log('Fetching deployer info from Etherscan...');
      
      const response = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${this.ETHERSCAN_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result && data.result.length > 0) {
        return {
          deployer: data.result[0].contractCreator,
          txHash: data.result[0].txHash,
          blockNumber: null // This endpoint doesn't provide block number
        };
      }
      
      return {
        deployer: 'Unable to determine',
        txHash: null,
        blockNumber: null
      };
    } catch (error) {
      console.error('Failed to get deployer info:', error);
      return {
        deployer: 'Unable to determine',
        txHash: null,
        blockNumber: null
      };
    }
  }

  async getTopHolders(contractAddress, limit = 10) {
    try {
      console.log('Fetching top holders...');
      
      // This would require a premium API or indexing service
      // For now, return mock data structure
      return {
        holders: [],
        note: 'Top holders data requires premium API access'
      };
    } catch (error) {
      console.error('Failed to get top holders:', error);
      return {
        holders: [],
        note: 'Failed to fetch top holders data'
      };
    }
  }

  async getDexData(contractAddress) {
    try {
      console.log('Fetching DEX data from DexScreener...');
      
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const mainPair = data.pairs[0]; // Get the first/main trading pair
        
        return {
          price: mainPair.priceUsd || '0',
          priceChange24h: mainPair.priceChange?.h24 || 0,
          volume24h: mainPair.volume?.h24 || 0,
          liquidity: mainPair.liquidity?.usd || 0,
          marketCap: mainPair.marketCap || 0,
          dexName: mainPair.dexId || 'Unknown',
          pairAddress: mainPair.pairAddress,
          baseToken: mainPair.baseToken,
          quoteToken: mainPair.quoteToken,
          url: mainPair.url
        };
      }
      
      return {
        price: '0',
        priceChange24h: 0,
        volume24h: 0,
        liquidity: 0,
        marketCap: 0,
        note: 'No trading pairs found'
      };
    } catch (error) {
      console.error('Failed to get DEX data:', error);
      return {
        price: '0',
        priceChange24h: 0,
        volume24h: 0,
        liquidity: 0,
        marketCap: 0,
        note: 'Failed to fetch DEX data'
      };
    }
  }

  async startPriceMonitoring(contractAddress, callback, options = {}) {
    try {
      const {
        interval = 30000, // 30 seconds
        priceChangeThreshold = 5, // 5% change
        liquidityChangeThreshold = 10 // 10% change
      } = options;

      console.log(`Starting price monitoring for ${contractAddress}`);
      
      let lastPrice = null;
      let lastLiquidity = null;
      
      const monitor = async () => {
        try {
          const dexData = await this.getDexData(contractAddress);
          const currentPrice = parseFloat(dexData.price);
          const currentLiquidity = parseFloat(dexData.liquidity);
          
          if (lastPrice !== null && currentPrice > 0) {
            const priceChange = ((currentPrice - lastPrice) / lastPrice) * 100;
            
            if (Math.abs(priceChange) >= priceChangeThreshold) {
              callback({
                type: 'price_alert',
                contractAddress,
                oldPrice: lastPrice,
                newPrice: currentPrice,
                change: priceChange,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          if (lastLiquidity !== null && currentLiquidity > 0) {
            const liquidityChange = ((currentLiquidity - lastLiquidity) / lastLiquidity) * 100;
            
            if (Math.abs(liquidityChange) >= liquidityChangeThreshold) {
              callback({
                type: 'liquidity_alert',
                contractAddress,
                oldLiquidity: lastLiquidity,
                newLiquidity: currentLiquidity,
                change: liquidityChange,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          lastPrice = currentPrice;
          lastLiquidity = currentLiquidity;
          
        } catch (error) {
          console.error('Monitoring error:', error);
          callback({
            type: 'error',
            contractAddress,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      // Initial call
      await monitor();
      
      // Set up interval
      const intervalId = setInterval(monitor, interval);
      
      // Store the interval ID for cleanup
      this.watchers.set(contractAddress, intervalId);
      
      return intervalId;
    } catch (error) {
      console.error('Failed to start price monitoring:', error);
      throw error;
    }
  }

  stopPriceMonitoring(contractAddress) {
    const intervalId = this.watchers.get(contractAddress);
    if (intervalId) {
      clearInterval(intervalId);
      this.watchers.delete(contractAddress);
      console.log(`Stopped monitoring ${contractAddress}`);
      return true;
    }
    return false;
  }

  stopAllMonitoring() {
    this.watchers.forEach((intervalId, contractAddress) => {
      clearInterval(intervalId);
      console.log(`Stopped monitoring ${contractAddress}`);
    });
    this.watchers.clear();
  }

  async watchWalletActivity(walletAddress, tokenAddress, callback) {
    try {
      const erc20Abi = [
        'event Transfer(address indexed from, address indexed to, uint256 value)'
      ];

      const contract = new Contract(tokenAddress, erc20Abi, this.provider);
      
      const filterFrom = contract.filters.Transfer(walletAddress, null);
      const filterTo = contract.filters.Transfer(null, walletAddress);

      const watcherFrom = contract.on(filterFrom, (from, to, value, event) => {
        callback({
          type: 'outgoing',
          from,
          to,
          value: value.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      const watcherTo = contract.on(filterTo, (from, to, value, event) => {
        callback({
          type: 'incoming',
          from,
          to,
          value: value.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      return { watcherFrom, watcherTo };
    } catch (error) {
      console.error('Failed to watch wallet activity:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const tokenAnalysisService = new TokenAnalysisService();
export default tokenAnalysisService;