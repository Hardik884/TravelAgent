import { motion } from 'framer-motion';
import { Download, MapPin, Calendar, Users, Wallet, Hotel, Plane } from 'lucide-react';
import BudgetChart from '../components/BudgetChart';
import { useTripContext } from '../context/TripContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import jsPDF from 'jspdf';

export default function Summary() {
  const { tripData, budgetData, selectedHotel, selectedTransport, itinerary } = useTripContext();
  const navigate = useNavigate();

  // Redirect if no trip data
  useEffect(() => {
    if (!tripData) {
      navigate('/trip-planner');
    }
  }, [tripData, navigate]);

  if (!tripData || !budgetData) {
    return null;
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPos = 20;

    // Helper function to check page break
    const checkPageBreak = (spaceNeeded: number = 20) => {
      if (yPos > pageHeight - spaceNeeded) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Title
    doc.setFontSize(24);
    doc.setTextColor(20, 184, 166);
    doc.text('Trip Summary', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Trip Details
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Trip Details', margin, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    doc.setFontSize(11);
    doc.text(`From: ${tripData.origin}`, margin, yPos);
    yPos += 7;
    doc.text(`To: ${tripData.destination}`, margin, yPos);
    yPos += 7;
    doc.text(`Dates: ${new Date(tripData.start_date).toLocaleDateString()} - ${new Date(tripData.end_date).toLocaleDateString()}`, margin, yPos);
    yPos += 7;
    doc.text(`Travelers: ${tripData.adults} Adult(s)${tripData.children > 0 ? `, ${tripData.children} Child(ren)` : ''}`, margin, yPos);
    yPos += 7;
    doc.text(`Trip Type: ${tripData.trip_type}`, margin, yPos);
    yPos += 12;

    // Budget Breakdown
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Budget Breakdown', margin, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    doc.setFontSize(11);
    budgetData.breakdown.forEach((item) => {
      const rupeeSymbol = 'Rs.'; // Use Rs. instead of ₹
      doc.text(`${item.name}: ${rupeeSymbol}${item.value.toLocaleString()} (${item.percentage}%)`, margin, yPos);
      yPos += 7;
    });
    doc.setFontSize(12);
    doc.setTextColor(20, 184, 166);
    doc.text(`Total Budget: Rs.${budgetData.total.toLocaleString()}`, margin, yPos);
    yPos += 12;
    doc.setTextColor(0, 0, 0);

    // Hotel
    if (selectedHotel) {
      checkPageBreak(50);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Accommodation', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text(`Hotel: ${selectedHotel.name}`, margin, yPos);
      yPos += 7;
      doc.text(`Location: ${selectedHotel.location}`, margin, yPos);
      yPos += 7;
      doc.text(`Price: Rs.${selectedHotel.price.toLocaleString()}/night`, margin, yPos);
      yPos += 7;
      doc.text(`Rating: ${selectedHotel.rating}/5.0`, margin, yPos);
      yPos += 7;
      
      // Amenities
      if (selectedHotel.amenities && selectedHotel.amenities.length > 0) {
        doc.text(`Amenities: ${selectedHotel.amenities.join(', ')}`, margin, yPos);
        yPos += 7;
      }
      yPos += 5;
    }

    // Transport
    if (selectedTransport) {
      checkPageBreak(40);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Transportation', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text(`Mode: ${selectedTransport.mode}`, margin, yPos);
      yPos += 7;
      doc.text(`Duration: ${selectedTransport.duration}`, margin, yPos);
      yPos += 7;
      // Replace ₹ with Rs. in price range
      const priceRange = selectedTransport.price_range.replace(/₹/g, 'Rs.');
      doc.text(`Price Range: ${priceRange}`, margin, yPos);
      yPos += 7;
      doc.text(`Note: ${selectedTransport.note} option`, margin, yPos);
      yPos += 12;
    }

    // Itinerary
    if (itinerary && itinerary.itinerary.length > 0) {
      checkPageBreak(40);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Day-by-Day Itinerary', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;

      itinerary.itinerary.forEach((day) => {
        checkPageBreak(30);
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Day ${day.day} - ${day.date}`, margin, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 8;
        
        doc.setFontSize(10);
        day.activities.forEach((activity) => {
          checkPageBreak(25);
          
          // Activity name and time
          doc.setFont('helvetica', 'bold');
          const activityHeader = `${activity.name} - ${activity.time}`;
          const headerLines = doc.splitTextToSize(activityHeader, maxWidth - 5);
          headerLines.forEach((line: string) => {
            doc.text(line, margin + 5, yPos);
            yPos += 5;
          });
          
          // Description
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(activity.description, maxWidth - 5);
          descLines.forEach((line: string) => {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, margin + 5, yPos);
            yPos += 5;
          });
          
          // Cost
          doc.text(`Cost: Rs.${activity.cost.toLocaleString()}`, margin + 5, yPos);
          yPos += 8;
        });
        yPos += 3;
      });
    }

    // Footer
    checkPageBreak(30);
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPos);
    doc.text(`Total Budget: Rs.${budgetData.total.toLocaleString()}`, pageWidth - margin - 50, yPos);

    // Save PDF
    const filename = `trip-summary-${tripData.destination.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
  };

  const calculateNights = () => {
    const start = new Date(tripData.start_date);
    const end = new Date(tripData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
              <h3 className="text-lg font-semibold text-white mb-2">Route</h3>
              <p className="muted">{tripData.origin} → {tripData.destination}</p>
            </div>

            <div className="glass rounded-xl p-6">
              <Calendar className="w-8 h-8 text-teal-300 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Duration</h3>
              <p className="muted">{calculateNights()} Days, {calculateNights() - 1} Night{calculateNights() > 2 ? 's' : ''}</p>
            </div>

            <div className="glass rounded-xl p-6">
              <Users className="w-8 h-8 text-teal-300 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Travelers</h3>
              <p className="muted">{tripData.adults} Adult{tripData.adults > 1 ? 's' : ''}{tripData.children > 0 ? `, ${tripData.children} Child${tripData.children > 1 ? 'ren' : ''}` : ''}</p>
            </div>
          </div>

          <div className="mb-8">
            <BudgetChart data={budgetData} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {selectedHotel && (
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
                      <span className="text-teal-300 text-sm">{selectedHotel.rating} ⭐</span>
                      <p className="text-white font-bold">₹{selectedHotel.price.toLocaleString()}/night</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedHotel && (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Hotel className="w-6 h-6 text-teal-300" />
                  <h2 className="text-2xl font-bold text-white">Accommodation</h2>
                </div>
                <p className="text-gray-400 text-center py-8">No hotel selected</p>
              </div>
            )}

            {selectedTransport && (
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
                    <p className="text-white font-bold">{selectedTransport.price_range}</p>
                  </div>
                  <div className="bg-white/6 rounded-lg p-3 mt-3">
                    <p className="text-teal-200 text-sm">{selectedTransport.note} option</p>
                  </div>
                </div>
              </div>
            )}

            {!selectedTransport && (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Plane className="w-6 h-6 text-teal-300" />
                  <h2 className="text-2xl font-bold text-white">Transportation</h2>
                </div>
                <p className="text-gray-400 text-center py-8">No transport selected</p>
              </div>
            )}
          </div>

          {itinerary && itinerary.itinerary.length > 0 && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-teal-300" />
                <h2 className="text-2xl font-bold text-white">Complete Itinerary</h2>
              </div>
              <div className="space-y-6">
                {itinerary.itinerary.map((dayPlan) => (
                  <div key={dayPlan.day} className="border-l-4 border-teal-500 pl-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Day {dayPlan.day} - {dayPlan.date}</h3>
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
          )}

          <div className="mt-8 bg-gray-800 rounded-xl p-6 shadow-xl border-2 border-teal-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-teal-400" />
                <div>
                  <p className="text-gray-400 text-sm">Total Budget</p>
                  <p className="text-4xl font-bold text-white">₹{budgetData.total.toLocaleString()}</p>
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
