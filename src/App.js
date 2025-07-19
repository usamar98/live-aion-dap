import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Hero from './components/Hero';
import CodeRevealForm from './components/CodeRevealForm';
import ResultsDisplay from './components/ResultsDisplay';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { Scene } from './components/rubikcube.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { Web3Provider } from './context/Web3Context';
import './index.css';

function App() {
  const [contractData, setContractData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'aion-bot':
        return (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-white mb-4">Aion Bot</h1>
            <p className="text-gray-400">AI-powered blockchain analysis coming soon...</p>
          </div>
        );
      case 'phishing-scanner':
        return (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-white mb-4">Phishing Link Scanner</h1>
            <p className="text-gray-400">Advanced phishing detection tools coming soon...</p>
          </div>
        );
      case 'wallet-detection':
        return (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-white mb-4">Phishing Wallets Detection</h1>
            <p className="text-gray-400">Wallet security analysis coming soon...</p>
          </div>
        );
      case 'trace-funds':
        return (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-white mb-4">Trace Stolen Funds</h1>
            <p className="text-gray-400">Fund tracing capabilities coming soon...</p>
          </div>
        );
      case 'aion-lab':
        return (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-white mb-4">Aion Lab</h1>
            <p className="text-gray-400">Experimental features and research tools coming soon...</p>
          </div>
        );
      default:
        return (
          <>
            <Hero />
            <CodeRevealForm 
              onDataFetch={setContractData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
            <AnimatePresence>
              {contractData && (
                <ResultsDisplay 
                  data={contractData}
                  isLoading={isLoading}
                />
              )}
            </AnimatePresence>
          </>
        );
    }
  };

  return (
    <ThemeProvider>
      <Web3Provider>
        <div className="min-h-screen bg-black relative">
          {/* Rubik's Cube Background */}
          <div className="fixed inset-0 z-0">
            <Scene />
          </div>
          
          {/* Main Content Overlay */}
          <div className="relative z-10 flex">
            <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
            
            <div className="flex-1 lg:ml-[280px] transition-all duration-300">
              <Header />
              <main className="p-6">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {renderContent()}
                </motion.div>
              </main>
            </div>
          </div>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff'
              }
            }}
          />
        </div>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;