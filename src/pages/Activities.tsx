import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import ActivityCard from '../components/ActivityCard';
import { useTripContext } from '../context/TripContext';
import { itineraryAPI } from '../utils/api';

export default function Activities() {
  const navigate = useNavigate();
  const { tripData, budgetData, itinerary, setItinerary } = useTripContext();
  
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tripData && budgetData) {
      generateItinerary();
    } else {
      navigate('/trip-planner');
    }
  }, []);

  const generateItinerary = async () => {
    if (!tripData || !budgetData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get both activities and food budgets
      const activitiesBudget = budgetData.breakdown.find(
        item => item.name.toLowerCase() === 'activities'
      );
      
      const foodBudget = budgetData.breakdown.find(
        item => item.name.toLowerCase() === 'food'
      );

      // Combine activities and food budget for itinerary planning
      const combinedBudget = (activitiesBudget?.value || 0) + (foodBudget?.value || 0);
      
  // Generating itinerary using combined activities + food budget

      const request = {
        destination: tripData.destination,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        trip_type: tripData.trip_type,
        budget_allocation: combinedBudget, // Send combined activities + food budget
        interests: [], // You can enhance this with user preferences
      };

      const response = await itineraryAPI.generate(request);
      setItinerary(response);
    } catch (err) {
      console.error('Itinerary generation error:', err);
      setError('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setRegenerating(true);
    await generateItinerary();
    setRegenerating(false);
  };

  const handleContinue = () => {
    navigate('/summary');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="loading-spinner" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🗺️</span>
            </div>
          </div>
          <div className="loading-dots justify-center">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
          <p className="loading-text">Creating your perfect itinerary</p>
          <p className="text-gray-400 text-sm mt-2">Personalizing activities for {tripData?.destination}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container activities-bg">
      <div className="page-overlay" />
      <div className="page-content max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-extrabold text-white mb-2">Your Itinerary</h1>
              <p className="text-gray-400">Day-by-day activities crafted for your trip</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={regenerating}
              className="glass-button px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 hover:scale-105"
            >
              {regenerating ? (
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

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {itinerary && itinerary.itinerary && (
              <>
                <div className="space-y-6">
                  {itinerary.itinerary.map((dayPlan, dayIndex) => (
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

                {itinerary.recommendations && (
                  <div className="mt-8 glass-scope rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">💡 Travel Tips</h3>
                    <div className="text-gray-300 whitespace-pre-line">
                      {itinerary.recommendations}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleContinue}
                    className="glass-button px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                  >
                    View Summary →
                  </button>
                </div>
              </>
            )}
        </motion.div>
      </div>
    </div>
  );
}
