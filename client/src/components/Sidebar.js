import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Bot, 
  Shield, 
  Wallet, 
  Search, 
  FlaskConical,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'aion-bot',
      label: 'Aion Bot',
      icon: Bot
    },
    {
      id: 'phishing-scanner',
      label: 'Phishing Link Scanner',
      icon: Shield
    },
    {
      id: 'wallet-detection',
      label: 'Phishing Wallets',
      icon: Wallet
    },
    {
      id: 'trace-funds',
      label: 'Trace Stolen Funds',
      icon: Search
    },
    {
      id: 'aion-lab',
      label: 'Aion Lab',
      icon: FlaskConical
    }
  ];

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700"
      >
        {isMobileOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-700 z-40 transform transition-transform lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: isCollapsed ? '80px' : '280px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <motion.div
                  variants={itemVariants}
                  animate={isCollapsed ? 'collapsed' : 'expanded'}
                  className="flex items-center space-x-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src="/AioAi.jpg" 
                      alt="AioAi Logo" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <h1 className="text-xl font-bold text-white">AioAi</h1>
                </motion.div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:block p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                  isCollapsed ? 'rotate-0' : 'rotate-180'
                }`} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-2 rounded-lg ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gray-800 group-hover:bg-gray-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {!isCollapsed && (
                    <motion.span
                      variants={itemVariants}
                      animate={isCollapsed ? 'collapsed' : 'expanded'}
                      className="font-medium text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            {!isCollapsed && (
              <motion.div
                variants={itemVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                className="text-xs text-gray-500 text-center"
              >
                © 2024 Code Reveal DApp
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;