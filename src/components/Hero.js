import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Code, Shield, Zap } from 'lucide-react';

const Hero = () => {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    )
    .fromTo(subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    )
    .fromTo(featuresRef.current.children,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: 'power3.out' },
      '-=0.3'
    );
  }, []);

  const features = [
    {
      icon: Code,
      title: 'Smart Contract Analysis',
      description: 'Deep dive into contract bytecode and source code'
    },
    {
      icon: Shield,
      title: 'Security Insights',
      description: 'Identify potential vulnerabilities and risks'
    },
    {
      icon: Zap,
      title: 'Real-time Data',
      description: 'Live blockchain data and transaction history'
    }
  ];

  return (
    <section ref={heroRef} className="py-20 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-4xl mx-auto"
      >
        <h1 
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold mb-6 gradient-text"
        >
          Code Reveal
        </h1>
        
        <p 
          ref={subtitleRef}
          className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto"
        >
          Unveil the secrets of smart contracts with advanced Web3 analysis and real-time blockchain insights
        </p>

        <div ref={featuresRef} className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="glassmorphism p-6 rounded-xl hover:scale-105 transition-transform duration-300"
                whileHover={{ y: -10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;