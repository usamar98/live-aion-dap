import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const navigate = useNavigate();

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        
        // Store authentication data
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('loginTime', Date.now().toString());
        
        toast.success(`Wallet connected successfully!`);
        
        // Redirect to dashboard after successful connection
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Check for existing wallet connection on component mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      const savedConnection = localStorage.getItem('walletConnected');
      const savedAddress = localStorage.getItem('walletAddress');
      const loginTime = localStorage.getItem('loginTime');
      
      // Check if login is still valid (24 hours)
      const isLoginValid = loginTime && (Date.now() - parseInt(loginTime)) < 24 * 60 * 60 * 1000;
      
      if (savedConnection === 'true' && savedAddress && isLoginValid) {
        if (isMetaMaskInstalled()) {
          try {
            const accounts = await window.ethereum.request({
              method: 'eth_accounts'
            });
            
            if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
              // User is already connected, redirect to dashboard
              navigate('/dashboard');
              return;
            }
          } catch (error) {
            console.error('Error checking wallet connection:', error);
          }
        }
      }
      
      // Clear invalid session data
      if (!isLoginValid) {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('loginTime');
      }
    };

    checkExistingConnection();
  }, [navigate]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/securityTwo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-10"></div>
      
      <div className="max-w-md w-full relative z-20">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="bg-black/20 backdrop-blur-md rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center border border-white/10">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Aion Dapp</h1>
          <p className="text-gray-400">Advanced Security Solutions</p>
        </div>

        {/* Login Card */}
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-8 border border-white/10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Connect your MetaMask wallet to access the dashboard</p>
          </div>

          {/* MetaMask Connect Button */}
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 mb-6"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <img 
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMwLjEgMTYuMUMyOS45IDE2IDI5LjcgMTUuOSAyOS41IDE1LjlDMjkuMyAxNS45IDI5LjEgMTYgMjguOSAxNi4xTDI4LjkgMTYuMUMyOC43IDE2LjIgMjguNSAxNi4zIDI4LjMgMTYuNEMyOC4xIDE2LjUgMjcuOSAxNi42IDI3LjcgMTYuN0MyNy41IDE2LjggMjcuMyAxNi45IDI3LjEgMTdDMjYuOSAxNy4xIDI2LjcgMTcuMiAyNi41IDE3LjNDMjYuMyAxNy40IDI2LjEgMTcuNSAyNS45IDE3LjZDMjUuNyAxNy43IDI1LjUgMTcuOCAyNS4zIDE3LjlDMjUuMSAxOCAyNC45IDE4LjEgMjQuNyAxOC4yQzI0LjUgMTguMyAyNC4zIDE4LjQgMjQuMSAxOC41QzIzLjkgMTguNiAyMy43IDE4LjcgMjMuNSAxOC44QzIzLjMgMTguOSAyMy4xIDE5IDIyLjkgMTkuMUMyMi43IDE5LjIgMjIuNSAxOS4zIDIyLjMgMTkuNEMyMi4xIDE5LjUgMjEuOSAxOS42IDIxLjcgMTkuN0MyMS41IDE5LjggMjEuMyAxOS45IDIxLjEgMjBDMjAuOSAyMC4xIDIwLjcgMjAuMiAyMC41IDIwLjNDMjAuMyAyMC40IDIwLjEgMjAuNSAxOS45IDIwLjZDMTkuNyAyMC43IDE5LjUgMjAuOCAxOS4zIDIwLjlDMTkuMSAyMSAxOC45IDIxLjEgMTguNyAyMS4yQzE4LjUgMjEuMyAxOC4zIDIxLjQgMTguMSAyMS41QzE3LjkgMjEuNiAxNy43IDIxLjcgMTcuNSAyMS44QzE3LjMgMjEuOSAxNy4xIDIyIDE2LjkgMjIuMUMxNi43IDIyLjIgMTYuNSAyMi4zIDE2LjMgMjIuNEMxNi4xIDIyLjUgMTUuOSAyMi42IDE1LjcgMjIuN0MxNS41IDIyLjggMTUuMyAyMi45IDE1LjEgMjNDMTQuOSAyMy4xIDE0LjcgMjMuMiAxNC41IDIzLjNDMTQuMyAyMy40IDE0LjEgMjMuNSAxMy45IDIzLjZDMTMuNyAyMy43IDEzLjUgMjMuOCAxMy4zIDIzLjlDMTMuMSAyNCAxMi45IDI0LjEgMTIuNyAyNC4yQzEyLjUgMjQuMyAxMi4zIDI0LjQgMTIuMSAyNC41QzExLjkgMjQuNiAxMS43IDI0LjcgMTEuNSAyNC44QzExLjMgMjQuOSAxMS4xIDI1IDEwLjkgMjUuMUMxMC43IDI1LjIgMTAuNSAyNS4zIDEwLjMgMjUuNEMxMC4xIDI1LjUgOS45IDI1LjYgOS43IDI1LjdDOS41IDI1LjggOS4zIDI1LjkgOS4xIDI2QzguOSAyNi4xIDguNyAyNi4yIDguNSAyNi4zQzguMyAyNi40IDguMSAyNi41IDcuOSAyNi42QzcuNyAyNi43IDcuNSAyNi44IDcuMyAyNi45QzcuMSAyNyA2LjkgMjcuMSA2LjcgMjcuMkM2LjUgMjcuMyA2LjMgMjcuNCA2LjEgMjcuNUM1LjkgMjcuNiA1LjcgMjcuNyA1LjUgMjcuOEM1LjMgMjcuOSA1LjEgMjggNC45IDI4LjFDNC43IDI4LjIgNC41IDI4LjMgNC4zIDI4LjRDNC4xIDI4LjUgMy45IDI4LjYgMy43IDI4LjdDMy41IDI4LjggMy4zIDI4LjkgMy4xIDI5QzIuOSAyOS4xIDIuNyAyOS4yIDIuNSAyOS4zQzIuMyAyOS40IDIuMSAyOS41IDEuOSAyOS42QzEuNyAyOS43IDEuNSAyOS44IDEuMyAyOS45QzEuMSAzMCAwLjkgMzAuMSAwLjcgMzAuMkMwLjUgMzAuMyAwLjMgMzAuNCAwLjEgMzAuNUMwIDMwLjUgMCAzMC41IDAgMzAuNUMwIDMwLjUgMCAzMC41IDAuMSAzMC41QzAuMyAzMC40IDAuNSAzMC4zIDAuNyAzMC4yQzAuOSAzMC4xIDEuMSAzMCAxLjMgMjkuOUMxLjUgMjkuOCAxLjcgMjkuNyAxLjkgMjkuNkMyLjEgMjkuNSAyLjMgMjkuNCAyLjUgMjkuM0MyLjcgMjkuMiAyLjkgMjkuMSAzLjEgMjlDMy4zIDI4LjkgMy41IDI4LjggMy43IDI4LjdDMy45IDI4LjYgNC4xIDI4LjUgNC4zIDI4LjRDNC41IDI4LjMgNC43IDI4LjIgNC45IDI4LjFDNS4xIDI4IDUuMyAyNy45IDUuNSAyNy44QzUuNyAyNy43IDUuOSAyNy42IDYuMSAyNy41QzYuMyAyNy40IDYuNSAyNy4zIDYuNyAyNy4yQzYuOSAyNy4xIDcuMSAyNyA3LjMgMjYuOUM3LjUgMjYuOCA3LjcgMjYuNyA3LjkgMjYuNkM4LjEgMjYuNSA4LjMgMjYuNCA4LjUgMjYuM0M4LjcgMjYuMiA4LjkgMjYuMSA5LjEgMjZDOS4zIDI1LjkgOS41IDI1LjggOS43IDI1LjdDOS45IDI1LjYgMTAuMSAyNS41IDEwLjMgMjUuNEMxMC41IDI1LjMgMTAuNyAyNS4yIDEwLjkgMjUuMUMxMS4xIDI1IDExLjMgMjQuOSAxMS41IDI0LjhDMTEuNyAyNC43IDExLjkgMjQuNiAxMi4xIDI0LjVDMTIuMyAyNC40IDEyLjUgMjQuMyAxMi43IDI0LjJDMTIuOSAyNC4xIDEzLjEgMjQgMTMuMyAyMy45QzEzLjUgMjMuOCAxMy43IDIzLjcgMTMuOSAyMy42QzE0LjEgMjMuNSAxNC4zIDIzLjQgMTQuNSAyMy4zQzE0LjcgMjMuMiAxNC45IDIzLjEgMTUuMSAyM0MxNS4zIDIyLjkgMTUuNSAyMi44IDE1LjcgMjIuN0MxNS45IDIyLjYgMTYuMSAyMi41IDE2LjMgMjIuNEMxNi41IDIyLjMgMTYuNyAyMi4yIDE2LjkgMjIuMUMxNy4xIDIyIDE3LjMgMjEuOSAxNy41IDIxLjhDMTcuNyAyMS43IDE3LjkgMjEuNiAxOC4xIDIxLjVDMTguMyAyMS40IDE4LjUgMjEuMyAxOC43IDIxLjJDMTguOSAyMS4xIDE5LjEgMjEgMTkuMyAyMC45QzE5LjUgMjAuOCAxOS43IDIwLjcgMTkuOSAyMC42QzIwLjEgMjAuNSAyMC4zIDIwLjQgMjAuNSAyMC4zQzIwLjcgMjAuMiAyMC45IDIwLjEgMjEuMSAyMEMyMS4zIDE5LjkgMjEuNSAxOS44IDIxLjcgMTkuN0MyMS45IDE5LjYgMjIuMSAxOS41IDIyLjMgMTkuNEMyMi41IDE5LjMgMjIuNyAxOS4yIDIyLjkgMTkuMUMyMy4xIDE5IDIzLjMgMTguOSAyMy41IDE4LjhDMjMuNyAxOC43IDIzLjkgMTguNiAyNC4xIDE4LjVDMjQuMyAxOC40IDI0LjUgMTguMyAyNC43IDE4LjJDMjQuOSAxOC4xIDI1LjEgMTggMjUuMyAxNy45QzI1LjUgMTcuOCAyNS43IDE3LjcgMjUuOSAxNy42QzI2LjEgMTcuNSAyNi4zIDE3LjQgMjYuNSAxNy4zQzI2LjcgMTcuMiAyNi45IDE3LjEgMjcuMSAxN0MyNy4zIDE2LjkgMjcuNSAxNi44IDI3LjcgMTYuN0MyNy45IDE2LjYgMjguMSAxNi41IDI4LjMgMTYuNEMyOC41IDE2LjMgMjguNyAxNi4yIDI4LjkgMTYuMUwyOC45IDE2LjFDMjkuMSAxNiAyOS4zIDE1LjkgMjkuNSAxNS45QzI5LjcgMTUuOSAyOS45IDE2IDMwLjEgMTYuMUMzMC4xIDE2LjEgMzAuMSAxNi4xIDMwLjEgMTYuMVoiIGZpbGw9IiNGNjY1MkEiLz4KPC9zdmc+" 
                  alt="MetaMask" 
                  className="w-6 h-6"
                />
                <span>Connect with MetaMask</span>
              </>
            )}
          </button>

          {/* Features List */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-gray-300">
              <span className="text-green-400 mr-3">✅</span>
              <span>Secure wallet-based authentication</span>
            </div>
            <div className="flex items-center text-gray-300">
              <span className="text-green-400 mr-3">✅</span>
              <span>No personal data required</span>
            </div>
            <div className="flex items-center text-gray-300">
              <span className="text-green-400 mr-3">✅</span>
              <span>Full control over your connection</span>
            </div>
            <div className="flex items-center text-gray-300">
              <span className="text-green-400 mr-3">✅</span>
              <span>Advanced token analysis tools</span>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              Don't have MetaMask? 
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:underline ml-1"
              >
                Download here
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2025 Aion Dapp. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;