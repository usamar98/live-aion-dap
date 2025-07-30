import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Dashboard from './Dashboard';
import Header from './Header';
import PhishingScanner from './PhishingScanner';
import TeamBundleWalletScanner from './TeamBundleWalletScanner';
import ThreeBackground from './ThreeBackground';

const MainApp = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard setActiveSection={setActiveSection} />;
      case 'phishing-scanner':
        return <PhishingScanner />;
      case 'team-bundle-scanner':
        return <TeamBundleWalletScanner />;
      default:
        return <Dashboard setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ThreeBackground />
      </div>
      
      {/* Main Layout - Removed Sidebar */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <Header activeSection={activeSection} setActiveSection={setActiveSection} />
        
        {/* Content Area - Full width without sidebar margin */}
        <main className="min-h-screen pt-20">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderActiveSection()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MainApp;