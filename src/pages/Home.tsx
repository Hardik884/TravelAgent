import { motion } from 'framer-motion';
import { Compass, Calendar, Wallet, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Wallet,
      title: 'Smart Budgeting',
      description: 'AI-powered budget allocation for your perfect trip',
    },
    {
      icon: Compass,
      title: 'Curated Stays',
      description: 'Handpicked hotels matching your travel style',
    },
    {
      icon: Calendar,
      title: 'Custom Itinerary',
      description: 'Day-by-day plans tailored to your preferences',
    },
    {
      icon: Sparkles,
      title: 'Seamless Experience',
      description: 'From planning to booking, all in one place',
    },
  ];

  return (
    <div className="page-container home-bg">
      <div className="page-overlay" />
      
      <div className="page-content">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="mx-auto max-w-4xl glass-scope rounded-3xl p-12 card-fade">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-teal-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-teal-300" />
                <span className="text-sm font-medium text-teal-200">AI-Powered Travel Assistant</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                Plan Your Perfect Trip with
                <span className="block mt-2 bg-gradient-to-r from-teal-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Smart AI Assistance
                </span>
              </h1>
              <p className="text-xl muted mb-8 leading-relaxed">
                Budget allocation • Curated stays • Custom itineraries — all in one intelligent platform
              </p>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => navigate('/trip-planner')} 
                  className="hero-cta group"
                >
                  <Compass className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Start Planning</span>
                </button>
                <button 
                  onClick={() => navigate('/trip-history')} 
                  className="hero-cta-secondary"
                >
                  <Calendar className="w-5 h-5" />
                  <span>View History</span>
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 * index }}
                className="feature-card group"
              >
                <div className="feature-icon-wrapper">
                  <feature.icon className="w-6 h-6 text-teal-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-200 transition-colors">{feature.title}</h3>
                <p className="muted text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
