import { motion } from 'framer-motion';
import { Download, MapPin, Calendar, Users, Wallet, Hotel, Plane } from 'lucide-react';
import BudgetChart from '../components/BudgetChart';
import { mockBudgetData, mockItinerary, mockHotels, mockTransportOptions } from '../utils/mockData';

export default function Summary() {
  const selectedHotel = mockHotels[0];
  const selectedTransport = mockTransportOptions[0];

  const handleDownloadPDF = () => {
    alert('PDF download will be implemented with backend integration');
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "linear-gradient(rgba(4,6,12,0.35), rgba(3,6,12,0.45)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80')" }} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold text-white">Trip Summary</h1>
            <button
              onClick={handleDownloadPDF}
              className="glass-button px-5 py-2 rounded-md font-semibold flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="glass rounded-xl p-6">
              <MapPin className="w-8 h-8 text-teal-300 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Destination</h3>
              <p className="muted">Goa, India</p>
            </div>

            <div className="glass rounded-xl p-6">
              <Calendar className="w-8 h-8 text-teal-300 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Duration</h3>
              <p className="muted">3 Days, 2 Nights</p>
            </div>

            <div className="glass rounded-xl p-6">
              <Users className="w-8 h-8 text-teal-300 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Travelers</h3>
              <p className="muted">2 Adults</p>
            </div>
          </div>

          <div className="mb-8">
            <BudgetChart data={mockBudgetData} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Hotel className="w-6 h-6 text-teal-300" />
                <h2 className="text-2xl font-bold text-white">Accommodation</h2>
              </div>
              <div className="flex gap-4 items-center">
                <img
                  src={selectedHotel.image}
                  alt={selectedHotel.name}
                  className="w-36 h-36 object-cover rounded-lg shadow-md"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{selectedHotel.name}</h3>
                  <p className="text-gray-300 text-sm mb-2">{selectedHotel.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-teal-300 text-sm">{selectedHotel.tag}</span>
                    <p className="text-white font-bold">₹{selectedHotel.price.toLocaleString()}/night</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Plane className="w-6 h-6 text-teal-300" />
                <h2 className="text-2xl font-bold text-white">Transportation</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{selectedTransport.mode}</p>
                    <p className="text-gray-300 text-sm">{selectedTransport.duration}</p>
                  </div>
                  <span className="text-2xl">{selectedTransport.icon}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-gray-300">Estimated Cost</span>
                  <p className="text-white font-bold">{selectedTransport.priceRange}</p>
                </div>
                <div className="bg-white/6 rounded-lg p-3 mt-3">
                  <p className="text-teal-200 text-sm">{selectedTransport.note} option</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-teal-300" />
              <h2 className="text-2xl font-bold text-white">Complete Itinerary</h2>
            </div>
            <div className="space-y-6">
              {mockItinerary.map((dayPlan) => (
                <div key={dayPlan.day} className="border-l-4 border-teal-500 pl-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Day {dayPlan.day}</h3>
                  <div className="space-y-3">
                    {dayPlan.activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 bg-white/6 p-4 rounded-lg">
                        <span className="text-2xl">{activity.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-white font-medium">{activity.name}</h4>
                            <span className="text-teal-300 text-sm font-medium">
                              {activity.cost === 0 ? 'Free' : `₹${activity.cost.toLocaleString()}`}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{activity.description}</p>
                          <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-gray-800 rounded-xl p-6 shadow-xl border-2 border-teal-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-teal-400" />
                <div>
                  <p className="text-gray-400 text-sm">Estimated Total Cost</p>
                  <p className="text-4xl font-bold text-white">₹{mockBudgetData.total.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="glass-button px-8 py-4 rounded-lg font-semibold flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Full Itinerary
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
