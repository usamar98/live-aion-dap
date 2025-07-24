import axios from 'axios';
import { ethers } from 'ethers';
import WalletAnalyticsService from './WalletAnalyticsService';

class RealTimeMonitor {
  constructor() {
    this.monitoredWallets = new Map();
    this.alertSubscribers = new Set();
    this.isMonitoring = false;
    this.monitorInterval = null;
  }

  // Start monitoring flagged wallets
  startMonitoring(wallets, tokenAddress, network = 'ethereum') {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }
    
    // Add wallets to monitoring list
    wallets.forEach(wallet => {
      this.monitoredWallets.set(wallet.address, {
        ...wallet,
        tokenAddress,
        network,
        lastBalance: null,
        lastChecked: null
      });
    });
    
    this.isMonitoring = true;
    this.startPolling();
    
    console.log(`Started monitoring ${wallets.length} wallets for token ${tokenAddress}`);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.isMonitoring = false;
    this.monitoredWallets.clear();
    
    console.log('Stopped wallet monitoring');
  }

  // Start polling for changes
  startPolling() {
    this.monitorInterval = setInterval(async () => {
      await this.checkAllWallets();
    }, 30000); // Check every 30 seconds
  }

  // Check all monitored wallets for changes
  async checkAllWallets() {
    const promises = Array.from(this.monitoredWallets.values()).map(wallet => 
      this.checkWalletChanges(wallet)
    );
    
    await Promise.all(promises);
  }

  // Check individual wallet for balance changes
  async checkWalletChanges(wallet) {
    try {
      const currentBalance = await WalletAnalyticsService.getTokenBalance(
        wallet.address,
        wallet.tokenAddress,
        wallet.network
      );
      
      if (!currentBalance) return;
      
      const currentBalanceNum = parseFloat(currentBalance.formatted);
      
      // First time checking this wallet
      if (wallet.lastBalance === null) {
        wallet.lastBalance = currentBalanceNum;
        wallet.lastChecked = Date.now();
        return;
      }
      
      // Check for significant balance decrease (potential sell)
      const balanceChange = wallet.lastBalance - currentBalanceNum;
      const changePercentage = (balanceChange / wallet.lastBalance) * 100;
      
      if (balanceChange > 0 && changePercentage > 1) { // More than 1% decrease
        await this.handleSellDetected(wallet, balanceChange, currentBalanceNum);
      }
      
      // Update wallet data
      wallet.lastBalance = currentBalanceNum;
      wallet.lastChecked = Date.now();
      
    } catch (error) {
      console.error(`Error checking wallet ${wallet.address}:`, error);
    }
  }

  // Handle detected sell transaction
  async handleSellDetected(wallet, amountSold, newBalance) {
    try {
      // Get recent transactions to find the sell transaction
      const recentTxs = await WalletAnalyticsService.getTransactionHistory(
        wallet.address,
        wallet.tokenAddress,
        wallet.network
      );
      
      // Find the most recent outgoing transaction
      const sellTx = recentTxs.find(tx => 
        tx.from.toLowerCase() === wallet.address.toLowerCase() &&
        Date.now() - tx.timestamp < 5 * 60 * 1000 // Within last 5 minutes
      );
      
      if (sellTx) {
        const usdValue = await WalletAnalyticsService.getUSDValue(
          amountSold,
          wallet.tokenAddress,
          sellTx.timestamp,
          wallet.network
        );
        
        const destination = await WalletAnalyticsService.identifyDEX(
          sellTx.to,
          wallet.network
        );
        
        const alertData = {
          walletAddress: wallet.address,
          walletType: wallet.type,
          tokenAddress: wallet.tokenAddress,
          network: wallet.network,
          amountSold,
          usdValue,
          previousBalance: wallet.lastBalance,
          newBalance,
          changePercentage: ((amountSold / wallet.lastBalance) * 100).toFixed(2),
          destination,
          transactionHash: sellTx.hash,
          timestamp: sellTx.timestamp,
          explorerLink: this.getExplorerLink(sellTx.hash, wallet.network)
        };
        
        // Send alerts
        await this.sendAlert(alertData);
        
        // Store in database
        await this.storeAlert(alertData);
        
        // Notify subscribers
        this.notifySubscribers(alertData);
      }
    } catch (error) {
      console.error('Error handling sell detection:', error);
    }
  }

  // Send alert via multiple channels
  async sendAlert(alertData) {
    // Send Telegram alert
    await this.sendTelegramAlert(alertData);
    
    // Send dashboard notification
    await this.sendDashboardAlert(alertData);
  }

  // Send Telegram alert
  async sendTelegramAlert(alertData) {
    try {
      const message = this.formatTelegramMessage(alertData);
      
      await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Error sending Telegram alert:', error);
    }
  }

  // Send dashboard alert
  async sendDashboardAlert(alertData) {
    try {
      await axios.post('/api/alerts', {
        type: 'wallet_sell',
        data: alertData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending dashboard alert:', error);
    }
  }

  // Format Telegram message
  formatTelegramMessage(alertData) {
    return `
🚨 <b>WALLET SELL ALERT</b> 🚨

💼 <b>Wallet:</b> <code>${alertData.walletAddress}</code>
🏷️ <b>Type:</b> ${alertData.walletType}

💰 <b>Amount Sold:</b> ${alertData.amountSold.toFixed(4)} tokens
💵 <b>USD Value:</b> $${alertData.usdValue.toFixed(2)}

📊 <b>Balance Change:</b>
   • Previous: ${alertData.previousBalance.toFixed(4)}
   • New: ${alertData.newBalance.toFixed(4)}
   • Change: -${alertData.changePercentage}%

🏪 <b>DEX:</b> ${alertData.destination}
🌐 <b>Network:</b> ${alertData.network.toUpperCase()}

🔗 <b>Transaction:</b> <a href="${alertData.explorerLink}">${alertData.transactionHash.substring(0, 10)}...</a>

⏰ <b>Time:</b> ${new Date(alertData.timestamp).toLocaleString()}
    `;
  }

  // Store alert in database
  async storeAlert(alertData) {
    try {
      await axios.post('/api/alerts/store', alertData);
    } catch (error) {
      console.error('Error storing alert:', error);
    }
  }

  // Get explorer link
  getExplorerLink(txHash, network) {
    const explorers = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`
    };
    
    return explorers[network] || `#${txHash}`;
  }

  // Subscribe to alerts
  subscribe(callback) {
    this.alertSubscribers.add(callback);
    
    return () => {
      this.alertSubscribers.delete(callback);
    };
  }

  // Notify all subscribers
  notifySubscribers(alertData) {
    this.alertSubscribers.forEach(callback => {
      try {
        callback(alertData);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Get monitoring status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      walletCount: this.monitoredWallets.size,
      subscriberCount: this.alertSubscribers.size,
      lastChecked: Math.max(...Array.from(this.monitoredWallets.values()).map(w => w.lastChecked || 0))
    };
  }
}

// Export as singleton instance
export default new RealTimeMonitor();