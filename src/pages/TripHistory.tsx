import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, Users, Wallet, Trash2, Eye, Download, Loader2, Edit2 } from 'lucide-react';
import { tripHistoryAPI } from '../utils/api';
import type { SavedTrip, UpdateTripRequest } from '../types';
import jsPDF from 'jspdf';

export default function TripHistory() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<SavedTrip | null>(null);
  const [editingBudget, setEditingBudget] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // TODO: Replace with actual user ID from auth
  const userId = 'user_demo';

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tripHistoryAPI.getTrips(userId, 1, 20);
      setTrips(response.trips);
    } catch (err: any) {
      console.error('Failed to fetch trips:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.detail || 'Failed to load trip history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!tripId) {
      alert('Invalid trip ID');
      return;
    }
    
    // Open confirmation modal instead of browser confirm
    setTripToDelete(tripId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tripToDelete) return;

    setDeletingId(tripToDelete);
    setDeleteModalOpen(false);
    
    try {
      await tripHistoryAPI.deleteTrip(tripToDelete);
      setTrips(trips.filter(t => t.id !== tripToDelete));
      setTripToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete trip:', err);
      console.error('Error details:', err.response?.data);
      alert(`Failed to delete trip: ${err.response?.data?.detail || err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setTripToDelete(null);
  };

  const handleEdit = (trip: SavedTrip) => {
    setTripToEdit(trip);
    setEditingBudget(trip.budget?.total?.toString() || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!tripToEdit || !tripToEdit.id) return;

    setSaving(true);
    try {
      const updateData: Partial<UpdateTripRequest> = {};
      
      // Only include budget in update if it changed
      const newBudgetTotal = parseFloat(editingBudget);
      if (editingBudget && !isNaN(newBudgetTotal) && newBudgetTotal !== tripToEdit.budget?.total) {
        // Update budget with new total, keeping existing breakdown proportions
        const existingBreakdown = tripToEdit.budget?.breakdown || [];
        const updatedBreakdown = existingBreakdown.map(item => ({
          ...item,
          value: (item.percentage / 100) * newBudgetTotal
        }));
        
        updateData.budget = {
          total: newBudgetTotal,
          breakdown: updatedBreakdown,
          recommendations: tripToEdit.budget?.recommendations || ''
        };
      }

      if (Object.keys(updateData).length === 0) {
        setEditModalOpen(false);
        setTripToEdit(null);
        return;
      }

      const updatedTrip = await tripHistoryAPI.updateTrip(tripToEdit.id, updateData);
      setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
      setEditModalOpen(false);
      setTripToEdit(null);
    } catch (err: unknown) {
      console.error('Failed to update trip:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to update trip: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditModalOpen(false);
    setTripToEdit(null);
    setEditingBudget('');
  };

  const handleView = async (tripId: string) => {
    if (!tripId) {
      alert('Invalid trip ID');
      return;
    }
    try {
      const trip = await tripHistoryAPI.getTrip(tripId);
      // Navigate to summary with trip data
      navigate('/summary', { state: { savedTrip: trip } });
    } catch (err: any) {
      console.error('Failed to load trip:', err);
      console.error('Error details:', err.response?.data);
      alert(`Failed to load trip details: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDownload = async (trip: SavedTrip) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(24);
    doc.setTextColor(20, 184, 166);
    doc.text('Trip Summary', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Trip Details
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Trip Details', margin, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 10;

    doc.setFontSize(11);
    doc.text(`From: ${trip.trip.origin}`, margin, yPos);
    yPos += 7;
    doc.text(`To: ${trip.trip.destination}`, margin, yPos);
    yPos += 7;
    doc.text(`Dates: ${new Date(trip.trip.start_date).toLocaleDateString()} - ${new Date(trip.trip.end_date).toLocaleDateString()}`, margin, yPos);
    yPos += 7;
    doc.text(`Travelers: ${trip.trip.adults} Adult(s)${trip.trip.children > 0 ? `, ${trip.trip.children} Child(ren)` : ''}`, margin, yPos);
    yPos += 7;
    doc.text(`Budget: Rs.${trip.budget.total.toLocaleString()}`, margin, yPos);
    yPos += 15;

    // Hotel
    if (trip.hotel) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Accommodation', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;

      doc.setFontSize(11);
      doc.text(`Hotel: ${trip.hotel.name}`, margin, yPos);
      yPos += 7;
      doc.text(`Location: ${trip.hotel.location}`, margin, yPos);
      yPos += 7;
      doc.text(`Price: Rs.${trip.hotel.price.toLocaleString()}/night`, margin, yPos);
      yPos += 7;
      doc.text(`Rating: ${trip.hotel.rating}/5.0`, margin, yPos);
      yPos += 12;
    }

    // Transport
    if (trip.transport) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Transportation', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;

      doc.setFontSize(11);
      doc.text(`Mode: ${trip.transport.mode}`, margin, yPos);
      yPos += 7;
      doc.text(`Duration: ${trip.transport.duration}`, margin, yPos);
      yPos += 7;
      const priceRange = trip.transport.price_range.replace(/₹/g, 'Rs.');
      doc.text(`Price Range: ${priceRange}`, margin, yPos);
      yPos += 12;
    }

    const filename = `trip-${trip.trip.destination.toLowerCase().replace(/\s+/g, '-')}-${new Date(trip.created_at).toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const calculateNights = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container history-bg">
      <div className="page-overlay" />
      
      <div className="page-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-extrabold text-white mb-2">Trip History</h1>
              <p className="text-gray-400">Your past adventures and saved trips</p>
            </div>
            <button
              onClick={() => navigate('/trip-planner')}
              className="glass-button px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Plan New Trip
            </button>
          </div>

          {error && (
            <div className="glass-scope rounded-xl p-6 mb-8 border border-red-500/50">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {trips.length === 0 ? (
            <div className="glass-scope rounded-xl p-12 text-center">
              <div className="mb-6">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Trips Yet</h3>
                <p className="text-gray-400 mb-6">Start planning your next adventure!</p>
              </div>
              <button
                onClick={() => navigate('/trip-planner')}
                className="glass-button px-8 py-3 rounded-lg font-semibold"
              >
                Plan Your First Trip
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass rounded-xl overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {trip.trip.destination}
                        </h3>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          from {trip.trip.origin}
                        </p>
                      </div>
                      <span className="glass-button text-xs px-3 py-1 rounded-full">
                        {trip.trip.trip_type}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Clock className="w-4 h-4 text-teal-400" />
                        {calculateNights(trip.trip.start_date, trip.trip.end_date)} Days
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Users className="w-4 h-4 text-teal-400" />
                        {trip.trip.adults} Adult{trip.trip.adults > 1 ? 's' : ''}
                        {trip.trip.children > 0 && `, ${trip.trip.children} Child${trip.trip.children > 1 ? 'ren' : ''}`}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Wallet className="w-4 h-4 text-teal-400" />
                        ₹{trip.budget.total.toLocaleString()}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <p className="text-gray-400 text-xs mb-3">
                        Saved on {new Date(trip.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (trip.id) {
                              handleView(trip.id);
                            } else {
                              alert('Invalid trip ID - trip.id is undefined');
                            }
                          }}
                          className="flex-1 glass-button-teal px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(trip)}
                          className="glass-button-blue px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                          aria-label="Download PDF"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(trip)}
                          className="glass-button-purple px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                          aria-label="Edit trip"
                          title="Edit trip"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (trip.id) {
                              handleDelete(trip.id);
                            } else {
                              alert('Invalid trip ID - trip.id is undefined');
                            }
                          }}
                          disabled={deletingId === trip.id}
                          className="glass-button-red px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                          aria-label="Delete trip"
                          title="Delete trip"
                        >
                          {deletingId === trip.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal with Glassmorphism */}
      {deleteModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={cancelDelete}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 bg-opacity-20 mb-4">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Delete Trip?</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this trip? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 glass-button px-4 py-3 rounded-lg font-medium hover:scale-105 transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 glass-button-red px-4 py-3 rounded-lg font-medium hover:scale-105 transition-transform"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Trip Modal with Glassmorphism */}
      {editModalOpen && tripToEdit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={cancelEdit}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 bg-opacity-20 mb-4">
                <Edit2 className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">Edit Trip Budget</h3>
              <p className="text-gray-300 mb-6 text-center">
                Update the budget for your trip to {tripToEdit.trip.destination}
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Budget (₹)
                </label>
                <input
                  type="number"
                  value={editingBudget}
                  onChange={(e) => setEditingBudget(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  placeholder="Enter new budget"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Current budget: ₹{tripToEdit.budget?.total?.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 glass-button px-4 py-3 rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 glass-button-purple px-4 py-3 rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
