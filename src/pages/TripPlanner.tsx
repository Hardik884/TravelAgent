import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Wallet, MapPin, Loader2, User } from 'lucide-react';
import BudgetChart from '../components/BudgetChart';
import { tripTypes } from '../utils/mockData';
import { budgetAPI } from '../utils/api';
import { useTripContext } from '../context/TripContext';
import type { TripData } from '../types';

interface FormData {
  tripType: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  adults: string;
  children: string;
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const { setTripData, budgetData, setBudgetData } = useTripContext();
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<FormData>({
    tripType: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    adults: '2',
    children: '0',
  });
  const [loading, setLoading] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Date validation
    if (name === 'startDate') {
      if (value < today) {
        setError('Start date cannot be in the past');
        return;
      }
      // If end date is set and is before new start date, clear end date
      if (formData.endDate && value > formData.endDate) {
        setFormData({ ...formData, startDate: value, endDate: '' });
        setError('End date reset - please select end date after start date');
        return;
      }
    }
    
    if (name === 'endDate') {
      if (value < today) {
        setError('End date cannot be in the past');
        return;
      }
      if (formData.startDate && value < formData.startDate) {
        setError('End date must be after start date');
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare trip data
      const tripDataPayload: TripData = {
        trip_type: formData.tripType,
        origin: formData.origin,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: parseFloat(formData.budget),
        adults: parseInt(formData.adults),
        children: parseInt(formData.children),
      };

      // Call budget analysis API
      const budgetResponse = await budgetAPI.analyze(tripDataPayload);
      
      // Store in context
      setTripData(tripDataPayload);
      setBudgetData(budgetResponse);
      
      setShowBudget(true);
    } catch (err) {
      console.error('Budget analysis error:', err);
      setError('Failed to analyze budget. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/hotels');
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(15,23,42,0.45), rgba(2,6,23,0.45)), url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1650&q=80')" }} />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Plan Your Journey</h1>

          {!showBudget ? (
            <div className="glass-scope rounded-xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass rounded-lg p-4">
                  <label className="block text-gray-100 mb-2 font-medium">Trip Type</label>
                  <div className="relative">
                    <select
                      name="tripType"
                      value={formData.tripType}
                      onChange={handleChange}
                      required
                      className="w-full glass-input rounded-lg px-4 py-3"
                    >
                      <option value="">Select trip type</option>
                      {tripTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="glass rounded-lg p-4">
                  <label className="block text-gray-100 mb-2 font-medium">Origin City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-teal-400" />
                    <input
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleChange}
                      required
                      placeholder="Where are you traveling from?"
                      className="w-full glass-input rounded-lg pl-11 pr-4 py-3"
                    />
                  </div>
                </div>

                <div className="glass rounded-lg p-4">
                  <label className="block text-gray-100 mb-2 font-medium">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      required
                      placeholder="Where do you want to go?"
                      className="w-full glass-input rounded-lg pl-11 pr-4 py-3"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass rounded-lg p-4">
                    <label className="block text-gray-100 mb-2 font-medium">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={today}
                        required
                        className="w-full glass-input rounded-lg pl-11 pr-4 py-3"
                      />
                    </div>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <label className="block text-gray-100 mb-2 font-medium">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate || today}
                        required
                        className="w-full glass-input rounded-lg pl-11 pr-4 py-3"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="glass rounded-lg p-4">
                    <label className="block text-gray-100 mb-2 font-medium">Budget (₹)</label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        required
                        placeholder="50000"
                        className="w-full glass-input rounded-lg pl-11 pr-4 py-3"
                      />
                    </div>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <label className="block text-gray-100 mb-2 font-medium">Adults</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="adults"
                        value={formData.adults}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="2"
                        className="w-full glass-input rounded-lg pl-11 pr-4 py-3"
                      />
                    </div>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <label className="block text-gray-100 mb-2 font-medium">Children</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="children"
                        value={formData.children}
                        onChange={handleChange}
                        required
                        min="0"
                        placeholder="0"
                        className="w-full glass-input rounded-lg pl-11 pr-4 py-3"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full glass-button text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Budget...
                    </>
                  ) : (
                    'Generate Budget Plan'
                  )}
                </button>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                    {error}
                  </div>
                )}
              </form>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {budgetData && <BudgetChart data={budgetData} />}
              
              {budgetData?.recommendations && (
                <div className="glass-scope rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">💡 AI Recommendations</h3>
                  <div className="text-gray-300 whitespace-pre-line">
                    {budgetData.recommendations}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowBudget(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Modify Trip
                </button>
                <button
                  onClick={handleContinue}
                  className="glass-button px-6 py-3 rounded-lg font-semibold"
                >
                  Continue to Hotels
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
