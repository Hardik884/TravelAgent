import axios from 'axios';
import type {
  TripData,
  BudgetResponse,
  HotelSearchRequest,
  HotelSearchResponse,
  TransportSearchRequest,
  TransportSearchResponse,
  ItineraryRequest,
  ItineraryResponse,
  SaveTripRequest,
  UpdateTripRequest,
  SavedTrip,
  TripListResponse,
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 120000, // Increased to 2 minutes for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const budgetAPI = {
  analyze: async (tripData: TripData): Promise<BudgetResponse> => {
    const response = await api.post('/budget/analyze', tripData);
    return response.data;
  },
};

export const hotelAPI = {
  search: async (searchData: HotelSearchRequest): Promise<HotelSearchResponse> => {
    const response = await api.post('/hotels/search', searchData);
    return response.data;
  },
};

export const transportAPI = {
  search: async (searchData: TransportSearchRequest): Promise<TransportSearchResponse> => {
    const response = await api.post('/transport/search', searchData);
    return response.data;
  },
};

export const itineraryAPI = {
  generate: async (requestData: ItineraryRequest): Promise<ItineraryResponse> => {
    const response = await api.post('/itinerary/generate', requestData);
    return response.data;
  },
};

export const tripHistoryAPI = {
  saveTrip: async (tripData: SaveTripRequest): Promise<{ id: string; message: string }> => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },
  
  getTrips: async (userId: string, page: number = 1, limit: number = 20): Promise<TripListResponse> => {
    const response = await api.get('/trips', {
      params: { user_id: userId, page, limit }
    });
    return response.data;
  },
  
  getTrip: async (tripId: string): Promise<SavedTrip> => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },
  
  updateTrip: async (tripId: string, updateData: UpdateTripRequest): Promise<SavedTrip> => {
    const response = await api.put(`/trips/${tripId}`, updateData);
    return response.data;
  },
  
  deleteTrip: async (tripId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data;
  },
};

export default api;
