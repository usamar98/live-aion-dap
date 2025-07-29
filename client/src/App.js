import React, { useState } from 'react';
import { Web3Provider } from './context/Web3Context';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TeamBundleWalletScanner from './components/TeamBundleWalletScanner';
import PhishingScanner from './components/PhishingScanner';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard setActiveSection={setActiveSection} />;
      case 'team-scanner':
        return <TeamBundleWalletScanner />;
      case 'team-bundle-scanner':
        return <TeamBundleWalletScanner />;
      case 'phishing-scanner':
        return <PhishingScanner />;
      default:
        return <Dashboard setActiveSection={setActiveSection} />;
    }
  };

  return (
    <Web3Provider>
      <div className="min-h-screen bg-gray-900 relative overflow-hidden">
        {/* 3D Background Image */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-gray-900/70 to-black/90 z-10"></div>
          <img 
            src="/cs.png" 
            alt="Background" 
            className="w-full h-full object-cover transform scale-110 hover:scale-105 transition-transform duration-[3000ms] ease-out"
            style={{
              filter: 'brightness(0.4) contrast(1.2) saturate(1.1)',
              transform: 'perspective(1000px) rotateX(2deg) rotateY(-1deg) scale(1.1)',
              transformOrigin: 'center center'
            }}
          />
          {/* 3D Shadow Effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20 z-20"></div>
          {/* Animated Light Overlay */}
          <div className="absolute inset-0 z-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-30">
          <Header activeSection={activeSection} setActiveSection={setActiveSection} />
          <main className="w-full">
            {renderActiveSection()}
          </main>
        </div>
      </div>
    </Web3Provider>
  );
}

export default App;