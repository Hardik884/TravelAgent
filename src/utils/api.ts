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

export default api;
