import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import TransportOption from '../components/TransportOption';
import { useTripContext } from '../context/TripContext';
import { transportAPI } from '../utils/api';
import type { TransportMode } from '../types';

export default function Transport() {
  const navigate = useNavigate();
  const { tripData, budgetData, selectedTransport, setSelectedTransport } = useTripContext();
  
  const [transportModes, setTransportModes] = useState<TransportMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tripData && budgetData) {
      fetchTransport();
    } else {
      navigate('/trip-planner');
    }
  }, []);

  const fetchTransport = async () => {
    if (!tripData || !budgetData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const transportBudget = budgetData.breakdown.find(
        item => item.name.toLowerCase() === 'transport'
      );

      const searchRequest = {
        origin: tripData.origin, // Use user's origin city
        destination: tripData.destination,
        travel_date: tripData.start_date,
        adults: tripData.adults,
        children: tripData.children,
        budget_allocation: transportBudget?.value || 10000,
      };

      const response = await transportAPI.search(searchRequest);
      setTransportModes(response.transport_modes);
    } catch (err) {
      console.error('Transport search error:', err);
      setError('Failed to load transport options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (transportMode: TransportMode) => {
    setSelectedTransport(transportMode);
  };

  const handleContinue = () => {
    if (selectedTransport) {
      navigate('/activities');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Finding best transport options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "linear-gradient(rgba(6,8,15,0.25), rgba(3,6,12,0.4)), url('https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1800&q=80')" }} />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2">Choose Your Transport</h1>
              <p className="muted">Select how you'd like to travel</p>
            </div>
            {selectedTransport && (
              <button
                onClick={handleContinue}
                className="glass-button px-5 py-2 rounded-md font-semibold"
              >
                Continue to Activities
              </button>
            )}
          </div>

          {selectedTransport && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 mb-6"
            >
              <p className="text-white">
                <span className="font-semibold">Selected:</span> {selectedTransport.mode} - {selectedTransport.price_range}
              </p>
            </motion.div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {transportModes.map((transport, index) => (
              <motion.div
                key={transport.mode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.07 }}
              >
                <TransportOption transport={transport} onSelect={handleSelect} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
