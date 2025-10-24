import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import HotelCard from '../components/HotelCard';
import { mockHotels } from '../utils/mockData';

export default function Hotels() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);

  const filteredHotels = mockHotels
    .filter(hotel =>
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      hotel.price >= priceRange[0] &&
      hotel.price <= priceRange[1] &&
      parseFloat(hotel.rating) >= ratingFilter
    )
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return parseFloat(b.rating) - parseFloat(a.rating);
    });

  const handleContinue = () => {
    if (selectedHotel) {
      navigate('/transport', { state: { selectedHotel } });
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "linear-gradient(rgba(4,6,12,0.45), rgba(2,4,8,0.6)), url('https://images.unsplash.com/photo-1501117716987-c8e24d3c9b4a?auto=format&fit=crop&w=1800&q=80')" }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold text-white">Choose Your Stay</h1>
            {selectedHotel && (
              <button
                onClick={handleContinue}
                className="glass-button px-5 py-2 rounded-md font-semibold"
              >
                Continue to Transport
              </button>
            )}
          </div>

          <div className="glass-scope rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search hotels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full glass-input rounded-lg pl-11 pr-4 py-3"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-ghost px-5 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-3 gap-6"
              >
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Price Range</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <p className="muted text-sm">Up to ₹{priceRange[1].toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Minimum Rating</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(parseFloat(e.target.value))}
                    className="w-full glass-input px-4 py-2 rounded-lg"
                  >
                    <option value="0">All Ratings</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full glass-input px-4 py-2 rounded-lg"
                  >
                    <option value="rating">Highest Rating</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </motion.div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 mb-6">
            <p className="muted mb-4">Showing {filteredHotels.length} hotels</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel, index) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={selectedHotel?.id === hotel.id ? 'ring-2 ring-teal-500 rounded-xl' : ''}
                >
                  <HotelCard hotel={hotel} onSelect={setSelectedHotel} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
