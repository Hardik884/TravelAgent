import { Heart, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto glass-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">TravelSmart</h3>
            <p className="text-sm muted leading-relaxed">
              Your AI-powered travel companion. Plan smarter, travel better.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="footer-social-link">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="footer-social-link">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="footer-social-link">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white/90">Quick Links</h4>
            <ul className="space-y-2 text-sm muted">
              <li><a href="/" className="footer-link">Home</a></li>
              <li><a href="/trip-planner" className="footer-link">Plan a Trip</a></li>
              <li><a href="/trip-history" className="footer-link">Trip History</a></li>
              <li><a href="#" className="footer-link">About Us</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white/90">Support</h4>
            <ul className="space-y-2 text-sm muted">
              <li><a href="#" className="footer-link">Help Center</a></li>
              <li><a href="#" className="footer-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-link">Terms of Service</a></li>
              <li><a href="#" className="footer-link">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm muted">
            <p className="flex items-center gap-2">
              © 2025 TravelSmart. Made with <Heart className="w-4 h-4 text-red-400 inline" /> for travelers
            </p>
            <p className="text-xs">
              Powered by AI • Real-time Data • Smart Planning
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
