import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import ActivityCard from '../components/ActivityCard';
import { mockItinerary } from '../utils/mockData';

export default function Activities() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(mockItinerary);

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const handleContinue = () => {
    navigate('/summary');
  };

  return (
    <div className="min-h-screen">
      <div className="relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "linear-gradient(rgba(6,8,15,0.25), rgba(3,6,12,0.35)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1650&q=80')" }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-white mb-2">Your Itinerary</h1>
                <p className="muted">Day-by-day activities crafted for your trip</p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="glass-button px-5 py-2 rounded-md font-semibold transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Regenerate
                  </>
                )}
              </button>
            </div>

            <div className="space-y-6">
              {itinerary.map((dayPlan, dayIndex) => (
                <motion.div
                  key={dayPlan.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: dayIndex * 0.2 }}
                  className="glass-scope rounded-xl p-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Day {dayPlan.day}</h2>
                  <div className="space-y-6">
                    {dayPlan.activities.map((activity, activityIndex) => (
                      <ActivityCard
                        key={activityIndex}
                        activity={activity}
                        isLast={activityIndex === dayPlan.activities.length - 1}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleContinue}
                className="glass-button px-8 py-3 rounded-lg font-semibold"
              >
                View Summary
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
