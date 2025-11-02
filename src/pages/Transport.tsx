import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      <div className="loading-container">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="loading-spinner" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">✈️</span>
            </div>
          </div>
          <div className="loading-dots justify-center">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
          <p className="loading-text">Finding best transport options</p>
          <p className="text-gray-400 text-sm mt-2">Comparing flights, trains, buses & cabs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container transport-bg">
      <div className="page-overlay" />
      <div className="page-content max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-extrabold text-white mb-2">Choose Your Transport</h1>
              <p className="text-gray-400">Select how you'd like to travel</p>
            </div>
            {selectedTransport && (
              <button
                onClick={handleContinue}
                className="glass-button px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                Continue to Activities →
              </button>
            )}
          </div>

          {/* Price Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 mb-6 border border-yellow-500/30"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="text-yellow-200 font-semibold mb-1">Price Information</p>
                <p className="text-gray-300 text-sm">
                  Prices shown are estimates for planning purposes only. Actual prices may vary based on availability, booking time, and current market rates. 
                  Please verify prices on airline/transport websites before booking.
                </p>
              </div>
            </div>
          </motion.div>

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
