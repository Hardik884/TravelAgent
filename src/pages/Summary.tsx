import { motion } from 'framer-motion';
import { Download, MapPin, Calendar, Users, Wallet, Hotel, Plane, Save, Loader2 } from 'lucide-react';
import BudgetChart from '../components/BudgetChart';
import { useTripContext } from '../context/TripContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { tripHistoryAPI } from '../utils/api';
import type { SavedTrip } from '../types';

// Capitalize hotel names properly
const formatHotelName = (name: string) => {
  const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of'];
  
  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (lowercase.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export default function Summary() {
  const { tripData, budgetData, selectedHotel, selectedTransport, itinerary, setTripData, setBudgetData, setSelectedHotel, setSelectedTransport, setItinerary } = useTripContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // TODO: Replace with actual user ID from auth
  const userId = 'user_demo';

  // Load saved trip if coming from history
  useEffect(() => {
    const savedTrip = location.state?.savedTrip as SavedTrip | undefined;
    if (savedTrip) {
      setIsViewingHistory(true);
      // Populate context with saved trip data
      setTripData(savedTrip.trip);
      setBudgetData(savedTrip.budget);
      if (savedTrip.hotel) setSelectedHotel(savedTrip.hotel);
      if (savedTrip.transport) setSelectedTransport(savedTrip.transport);
      if (savedTrip.itinerary) setItinerary(savedTrip.itinerary);
    }
  }, [location.state, setTripData, setBudgetData, setSelectedHotel, setSelectedTransport, setItinerary]);

  // Redirect if no trip data
  useEffect(() => {
    if (!tripData && !location.state?.savedTrip) {
      navigate('/trip-planner');
    }
  }, [tripData, navigate, location.state]);

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
    if (!tripData) return 0;
    const start = new Date(tripData.start_date);
    const end = new Date(tripData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate actual trip costs
  const calculateActualCosts = () => {
    const nights = calculateNights();
    
    // Hotel cost (price per night * number of nights)
    const hotelCost = selectedHotel ? selectedHotel.price * nights : 0;
    
    // Transport cost (2-way)
    let transportCost = 0;
    if (selectedTransport?.selectedOption) {
      transportCost = selectedTransport.selectedOption.price * 2;
    } else if (selectedTransport?.price_range) {
      // Parse price range like "₹5,000 - ₹8,000" and take average
      const priceMatch = selectedTransport.price_range.match(/₹([\d,]+)\s*-\s*₹([\d,]+)/);
      if (priceMatch) {
        const min = parseInt(priceMatch[1].replace(/,/g, ''));
        const max = parseInt(priceMatch[2].replace(/,/g, ''));
        transportCost = ((min + max) / 2) * 2;
      }
    }
    
    // Activities + Food cost from itinerary
    const activitiesCost = itinerary?.total_activities_cost || 0;
    
    // Miscellaneous (10% of total)
    const subtotal = hotelCost + transportCost + activitiesCost;
    const miscCost = subtotal * 0.10;
    
    // Total actual cost
    const totalActual = subtotal + miscCost;
    
    // Round to nearest thousand
    const totalRounded = Math.round(totalActual / 1000) * 1000;
    
    // Compare with user's budget
    const userBudget = budgetData?.total || 0;
    const difference = userBudget - totalRounded;
    const percentageUsed = (totalRounded / userBudget) * 100;
    
    return {
      hotelCost,
      transportCost,
      activitiesCost,
      miscCost,
      subtotal,
      totalActual: totalRounded,
      userBudget,
      difference,
      percentageUsed,
      isOverBudget: difference < 0,
      nights
    };
  };

  const budgetAnalysis = calculateActualCosts();  const handleSaveTrip = async () => {
    if (!tripData || !budgetData) {
      alert('No trip data to save');
      return;
    }

    setSaving(true);
    try {
      await tripHistoryAPI.saveTrip({
        user_id: userId,
        trip: tripData,
        budget: budgetData,
        hotel: selectedHotel || undefined,
        transport: selectedTransport || undefined,
        itinerary: itinerary || undefined,
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Optional: Navigate to trip history after a delay
      setTimeout(() => {
        navigate('/trip-history');
      }, 1500);
    } catch (err) {
      console.error('Failed to save trip:', err);
      alert('Failed to save trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container summary-bg">
      <div className="page-overlay" />
      <div className="page-content max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-extrabold text-white mb-2">Trip Summary</h1>
              <p className="text-gray-400">Your complete travel plan at a glance</p>
            </div>
            <div className="flex gap-3">
              {!isViewingHistory && (
                <button
                  onClick={handleSaveTrip}
                  disabled={saving || saveSuccess}
                  className="glass-button px-6 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Save className="w-5 h-5" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Trip
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleDownloadPDF}
                className="glass-button px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
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

          {/* Budget Analysis Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className={`glass rounded-xl p-6 border-2 ${budgetAnalysis.isOverBudget ? 'border-red-500/50' : 'border-green-500/50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Wallet className={`w-7 h-7 ${budgetAnalysis.isOverBudget ? 'text-red-400' : 'text-green-400'}`} />
                <h2 className="text-2xl font-bold text-white">Budget Analysis</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Cost Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-3">Actual Costs</h3>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 flex items-center gap-2">
                      <Hotel className="w-4 h-4" />
                      Accommodation ({budgetAnalysis.nights} nights)
                    </span>
                    <span className="text-white font-semibold">₹{budgetAnalysis.hotelCost.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 flex items-center gap-2">
                      <Plane className="w-4 h-4" />
                      Transport (Round trip)
                    </span>
                    <span className="text-white font-semibold">₹{Math.round(budgetAnalysis.transportCost).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 flex items-center gap-2">
                      <span className="text-sm">🍽️</span>
                      Food + Activities
                    </span>
                    <span className="text-white font-semibold">₹{Math.round(budgetAnalysis.activitiesCost).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 flex items-center gap-2">
                      <span className="text-sm">✨</span>
                      Miscellaneous (10%)
                    </span>
                    <span className="text-white font-semibold">₹{Math.round(budgetAnalysis.miscCost).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/20">
                    <span className="text-white font-bold">Total Estimated Cost</span>
                    <span className="text-xl font-bold text-white">₹{budgetAnalysis.totalActual.toLocaleString()}</span>
                  </div>
                </div>

                {/* Budget Comparison */}
                <div className="flex flex-col justify-center">
                  <div className="glass-card p-5 rounded-lg">
                    <div className="text-center mb-4">
                      <p className="text-gray-300 text-sm mb-2">Your Budget</p>
                      <p className="text-3xl font-bold text-white">₹{budgetAnalysis.userBudget.toLocaleString()}</p>
                    </div>

                    <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden mb-4">
                      <div 
                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                          budgetAnalysis.isOverBudget ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budgetAnalysis.percentageUsed, 100)}%` }}
                      />
                    </div>

                    <div className="text-center">
                      {budgetAnalysis.isOverBudget ? (
                        <>
                          <div className="text-red-400 text-2xl font-bold mb-2">
                            ₹{Math.abs(budgetAnalysis.difference).toLocaleString()}
                          </div>
                          <p className="text-red-300 text-sm font-medium">Over Budget</p>
                          <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                            <p className="text-red-200 text-xs">
                              💡 Consider increasing your budget or selecting a more affordable hotel/transport option.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-green-400 text-2xl font-bold mb-2">
                            ₹{budgetAnalysis.difference.toLocaleString()}
                          </div>
                          <p className="text-green-300 text-sm font-medium">Saved!</p>
                          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                            <p className="text-green-200 text-xs">
                              🎉 Great planning! You're staying within budget with room for extra experiences.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-gray-400 text-xs">
                      Using {budgetAnalysis.percentageUsed.toFixed(1)}% of your budget
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

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
                    <h3 className="text-lg font-semibold text-white mb-1">{formatHotelName(selectedHotel.name)}</h3>
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
                      {selectedTransport.selectedOption && (
                        <p className="text-teal-300 text-sm mt-1">{selectedTransport.selectedOption.carrier}</p>
                      )}
                    </div>
                    <span className="text-2xl">{selectedTransport.icon}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-gray-300">
                      {selectedTransport.selectedOption ? 'Selected Cost' : 'Estimated Cost'}
                    </span>
                    <p className="text-white font-bold">
                      {selectedTransport.selectedOption 
                        ? `₹${selectedTransport.selectedOption.price.toLocaleString()}`
                        : selectedTransport.price_range
                      }
                    </p>
                  </div>
                  {selectedTransport.selectedOption && (
                    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3 mt-3">
                      <p className="text-teal-200 text-sm">
                        {selectedTransport.selectedOption.carrier} • {selectedTransport.selectedOption.time}
                        {selectedTransport.selectedOption.class_type && ` • ${selectedTransport.selectedOption.class_type}`}
                      </p>
                    </div>
                  )}
                  {!selectedTransport.selectedOption && (
                    <div className="bg-white/6 rounded-lg p-3 mt-3">
                      <p className="text-teal-200 text-sm">{selectedTransport.note.replace(/\s*-\s*Real flight data from Amadeus/i, '').replace(/\s*\|\s*Real IRCTC Data/i, '').trim()} option</p>
                    </div>
                  )}
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
