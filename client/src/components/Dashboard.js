import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Wallet, 
  Search, 
  FlaskConical,
  ArrowRight,
  Users // Add Users icon for Team & Bundle Scanner
} from 'lucide-react';

const Dashboard = ({ setActiveSection }) => {
  const services = [
    {
      id: 'phishing-scanner',
      title: 'Phishing Link Scanner',
      description: 'Advanced detection of malicious links and phishing attempts',
      icon: Search,
      color: 'from-red-600 to-red-400',
      features: ['URL Analysis', 'Domain Reputation', 'Real-time Scanning'],
      clickable: true
    },
    // Add Team & Bundle Scanner card
    {
      id: 'team-bundle-scanner',
      title: 'Team & Bundle Scanner',
      description: '', // Removed the description text
      icon: Users,
      color: 'from-blue-600 to-blue-400',
      features: [], // Removed all features
      clickable: true
    },
    {
      id: 'wallet-detection',
      title: 'Phishing Wallets',
      description: 'Identify and track suspicious wallet addresses',
      icon: Wallet,
      color: 'from-yellow-600 to-yellow-400',
      clickable: false
    },
    {
      id: 'trace-funds',
      title: 'Trace Stolen Funds',
      description: 'Track and trace stolen cryptocurrency across blockchains',
      icon: Shield,
      color: 'from-green-600 to-green-400',
      clickable: false
    },
    {
      id: 'aion-lab',
      title: 'Aion Lab',
      description: 'Experimental tools and research for blockchain security',
      icon: FlaskConical,
      color: 'from-purple-600 to-purple-400',
      clickable: false
    }
  ];

  const handleCardClick = (serviceId, clickable) => {
    if (clickable && setActiveSection) {
      setActiveSection(serviceId);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl">
          <span className="bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400 bg-clip-text text-transparent">
            Aion Ai Security
          </span>
        </h1>
        <p className="text-gray-300 text-xl drop-shadow-lg">
          Comprehensive blockchain security tools powered by artificial intelligence
        </p>
      </motion.div>

      {/* Services Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <motion.div
              key={index}
              onClick={() => handleCardClick(service.id, service.clickable)}
              className={`relative overflow-hidden bg-black/40 backdrop-blur-lg border border-gray-600/50 rounded-xl p-6 hover:border-gray-500/70 transition-all duration-300 group shadow-2xl ${
                service.clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
              }`}
              whileHover={service.clickable ? { scale: 1.02, y: -5 } : {}}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Video background for Phishing Link Scanner */}
              {service.id === 'phishing-scanner' && (
                <video 
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/security.mp4" type="video/mp4" />
                </video>
              )}
              
              {/* Video background for Team & Bundle Scanner */}
              {service.id === 'team-bundle-scanner' && (
                <video 
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/securityTwo.mp4" type="video/mp4" />
                </video>
              )}
              
              {/* Content overlay */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${service.color} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {service.clickable && (
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">{service.title}</h3>
                
                {/* Show description and features for all cards except phishing-scanner and team-bundle-scanner */}
                {service.id !== 'phishing-scanner' && service.id !== 'team-bundle-scanner' && (
                  <>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed drop-shadow">{service.description}</p>
                    
                    {service.clickable ? (
                      <div className="space-y-2">
                        {service.features && service.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center text-xs text-gray-400">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="text-lg font-semibold text-gray-400 drop-shadow">Coming Soon</span>
                      </div>
                    )}
                  </>
                )}
                
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Dashboard;