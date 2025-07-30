import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const walletConnected = localStorage.getItem('walletConnected');
        const walletAddress = localStorage.getItem('walletAddress');
        const loginTime = localStorage.getItem('loginTime');
        
        // Check if login is still valid (24 hours)
        const isLoginValid = loginTime && (Date.now() - parseInt(loginTime)) < 24 * 60 * 60 * 1000;
        
        if (walletConnected === 'true' && walletAddress && isLoginValid) {
          // Verify wallet is still connected in MetaMask
          if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({
              method: 'eth_accounts'
            });
            
            if (accounts.length > 0 && accounts[0].toLowerCase() === walletAddress.toLowerCase()) {
              setIsAuthenticated(true);
            } else {
              // Wallet disconnected, clear session
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('walletAddress');
              localStorage.removeItem('loginTime');
              setIsAuthenticated(false);
              toast.error('Wallet disconnected. Please login again.');
            }
          } else {
            setIsAuthenticated(false);
            toast.error('MetaMask not detected. Please install MetaMask.');
          }
        } else {
          // Clear expired session
          if (!isLoginValid) {
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('loginTime');
          }
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;