import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TripProvider } from './context/TripContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import TripPlanner from './pages/TripPlanner';
import Hotels from './pages/Hotels';
import Transport from './pages/Transport';
import Activities from './pages/Activities';
import Summary from './pages/Summary';
import TripHistory from './pages/TripHistory';

function App() {
  return (
    <TripProvider>
      <Router>
        <div className="min-h-screen flex flex-col app-background">
          <Navbar />
          <main className="flex-1 pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/trip-planner" element={<TripPlanner />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/summary" element={<Summary />} />
              <Route path="/trip-history" element={<TripHistory />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </TripProvider>
  );
}

export default App;
