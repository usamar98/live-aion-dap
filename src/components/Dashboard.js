import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Shield, 
  TrendingUp, 
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

const Dashboard = () => {
  // Mini chart component for each stat card
  const MiniChart = ({ data, type }) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - minValue) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    if (type === 'bar') {
      return (
        <div className="flex items-end justify-between h-12 mt-4 px-2">
          {data.map((value, index) => {
            const height = ((value - minValue) / range) * 100;
            return (
              <motion.div
                key={index}
                className="w-3 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t shadow-sm"
                style={{ height: `${Math.max(height, 15)}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 15)}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div className="mt-4 h-12 px-2">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.polyline
            fill="none"
            stroke="url(#greyGradient)"
            strokeWidth="2.5"
            points={points}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          {/* Add dots at data points */}
          {data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((value - minValue) / range) * 100;
            return (
              <motion.circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#9CA3AF"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.5 + index * 0.1 }}
              />
            );
          })}
          <defs>
            <linearGradient id="greyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6B7280" />
              <stop offset="50%" stopColor="#9CA3AF" />
              <stop offset="100%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  const stats = [
    {
      title: 'Total Scans',
      value: '12,847',
      change: '+12%',
      icon: Activity,
      chartData: [8500, 9200, 10100, 11200, 12000, 12847],
      chartType: 'line'
    },
    {
      title: 'Threats Detected',
      value: '1,234',
      change: '+8%',
      icon: Shield,
      chartData: [800, 950, 1100, 1050, 1180, 1234],
      chartType: 'bar'
    },
    {
      title: 'Funds Traced',
      value: '$2.4M',
      change: '+15%',
      icon: DollarSign,
      chartData: [1.8, 2.0, 2.1, 2.2, 2.3, 2.4],
      chartType: 'line'
    },
    {
      title: 'Active Users',
      value: '8,492',
      change: '+23%',
      icon: Users,
      chartData: [6200, 6800, 7200, 7600, 8100, 8492],
      chartType: 'bar'
    }
  ];

  const recentActivity = [
    {
      type: 'scan',
      message: 'Phishing Wallet Detection: 0x1234...5678',
      time: '2 minutes ago',
      status: 'danger'
    },
    {
      type: 'trace',
      message: 'Funds traced successfully: $50,000',
      time: '5 minutes ago',
      status: 'success'
    },
    {
      type: 'bot',
      message: 'Aion Bot analysis completed',
      time: '10 minutes ago',
      status: 'info'
    },
    {
      type: 'lab',
      message: 'New experiment started in Aion Lab',
      time: '15 minutes ago',
      status: 'warning'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening with your security tools.</p>
      </motion.div>

      {/* Stats Grid - 2x2 Layout */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-300 text-sm font-medium">{stat.change}</span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                </div>
                <div className="w-16">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              {/* Mini Chart */}
              <MiniChart 
                data={stat.chartData} 
                type={stat.chartType}
              />
              
              {/* Chart Labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>6 months ago</span>
                <span>Now</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => {
            const getStatusIcon = () => {
              switch (activity.status) {
                case 'danger': return <AlertTriangle className="w-5 h-5 text-gray-400" />;
                case 'success': return <CheckCircle className="w-5 h-5 text-gray-400" />;
                case 'warning': return <Clock className="w-5 h-5 text-gray-400" />;
                default: return <Activity className="w-5 h-5 text-gray-400" />;
              }
            };

            return (
              <motion.div
                key={index}
                className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon()}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis">{activity.message}</p>
                  <p className="text-gray-400 text-xs">{activity.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;