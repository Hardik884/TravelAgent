import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="backdrop-blur-sm bg-gradient-to-r from-transparent to-transparent border-b border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity">
            <div className="bg-white/5 p-2 rounded-md flex items-center justify-center" style={{ animation: 'floaty 6s ease-in-out infinite' }}>
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold brand-title">TravelSmart</span>
          </Link>

          <div className="flex items-center space-x-3">
            <Link to="/" className="px-4 py-2 rounded-md btn-ghost text-sm">
              Home
            </Link>
            <Link to="/trip-planner" className="px-4 py-2 rounded-md glass-button text-sm font-semibold">
              Plan Trip
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
