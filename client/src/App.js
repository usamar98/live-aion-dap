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
      <div className="min-h-screen bg-gray-900">
        <Header activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="w-full">
          {renderActiveSection()}
        </main>
      </div>
    </Web3Provider>
  );
}

export default App;