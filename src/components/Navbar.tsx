import { Link, useLocation } from 'react-router-dom';
import { Plane, Home, History, MapPin } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 text-white hover:opacity-90 transition-all duration-300 group">
            <div className="glass-icon-wrapper" style={{ animation: 'floaty 6s ease-in-out infinite' }}>
              <Plane className="w-6 h-6 text-teal-300 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold brand-title bg-gradient-to-r from-white via-teal-200 to-purple-200 bg-clip-text text-transparent">
                TravelSmart
              </span>
              <span className="text-xs text-white/50 -mt-1">AI-Powered Planning</span>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link 
              to="/trip-history" 
              className={`nav-link ${isActive('/trip-history') ? 'nav-link-active' : ''}`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Link>
            <Link 
              to="/trip-planner" 
              className="nav-link-primary"
            >
              <MapPin className="w-4 h-4" />
              <span>Plan Trip</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
