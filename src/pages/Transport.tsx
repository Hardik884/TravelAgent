import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TransportOption from '../components/TransportOption';
import { mockTransportOptions } from '../utils/mockData';

export default function Transport() {
  const navigate = useNavigate();
  const [selectedTransport, setSelectedTransport] = useState<any>(null);

  const handleSelect = (mode: string, option: any) => {
    setSelectedTransport({ mode, ...option });
  };

  const handleContinue = () => {
    if (selectedTransport) {
      navigate('/activities', { state: { selectedTransport } });
    }
  };

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
                <span className="font-semibold">Selected:</span> {selectedTransport.mode} - {selectedTransport.carrier} (₹{selectedTransport.price.toLocaleString()})
              </p>
            </motion.div>
          )}

          <div className="space-y-4">
            {mockTransportOptions.map((transport, index) => (
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
