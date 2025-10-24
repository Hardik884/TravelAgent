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
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(6,8,15,0.35), rgba(3,6,12,0.4)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1650&q=80')" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="mx-auto max-w-3xl glass-scope rounded-2xl p-10 card-fade">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                Plan Your Perfect Trip with
                <span className="text-white">{' '}Smart Assistance</span>
              </h1>
              <p className="text-lg muted mb-6">Budget. Stay. Travel. Adventure — all in one place.</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => navigate('/trip-planner')} className="glass-button px-6 py-3 rounded-lg text-lg font-semibold flex items-center gap-2">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 * index }}
                className="glass rounded-xl p-6 soft-shadow transform hover:-translate-y-1 hover:scale-[1.02] transition-all"
              >
                <div className="w-12 h-12 rounded-md flex items-center justify-center mb-4" style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.12), rgba(124,58,237,0.12))' }}>
                  <feature.icon className="w-6 h-6 text-teal-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                <p className="muted text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
