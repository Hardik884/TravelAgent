import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Wallet, MapPin, Loader2, User } from 'lucide-react';
import BudgetChart from '../components/BudgetChart';
import { mockBudgetData, tripTypes } from '../utils/mockData';

interface TripData {
  tripType: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  adults: string;
  children: string;
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TripData>({
    tripType: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    adults: '2',
    children: '0',
  });
  const [loading, setLoading] = useState(false);
  const [showBudget, setShowBudget] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoading(false);
    setShowBudget(true);
  };

  const handleContinue = () => {
    navigate('/hotels', { state: { tripData: formData } });
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
              </form>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <BudgetChart data={mockBudgetData} />
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
