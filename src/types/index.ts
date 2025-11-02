// Trip Planning Types
export interface TripData {
  trip_type: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  adults: number;
  children: number;
}

// Budget Types
export interface BudgetBreakdown {
  name: string;
  value: number;
  percentage: number;
}

export interface BudgetResponse {
  total: number;
  breakdown: BudgetBreakdown[];
  recommendations: string;
}

// Hotel Types
export interface Hotel {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  location: string;
  amenities: string[];
  description: string;
  tag: string;
}

export interface HotelSearchRequest {
  destination: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  max_price: number;
  trip_type: string;
}

export interface HotelSearchResponse {
  hotels: Hotel[];
  total_count: number;
}

// Transport Types
export interface TransportOption {
  carrier: string;
  time: string;
  price: number;
  duration: string;
  class_type?: string;
}

export interface TransportMode {
  mode: string;
  icon: string;
  duration: string;
  price_range: string;
  note: string;
  options: TransportOption[];
  selectedOption?: TransportOption; // Store the selected specific option
}

export interface TransportSearchRequest {
  origin: string;
  destination: string;
  travel_date: string;
  adults: number;
  children: number;
  budget_allocation: number;
}

export interface TransportSearchResponse {
  transport_modes: TransportMode[];
}

// Itinerary Types
export interface Activity {
  name: string;
  icon: string;
  time: string;
  cost: number;
  description: string;
}

export interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
  total_cost: number;
}

export interface ItineraryRequest {
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: string;
  budget_allocation: number;
  interests?: string[];
}

export interface ItineraryResponse {
  itinerary: DayPlan[];
  total_activities_cost: number;
  recommendations: string;
}

// Trip History Types
export interface SavedTrip {
  id?: string;
  user_id: string;
  trip: TripData;
  budget: BudgetResponse;
  hotel?: Hotel;
  transport?: TransportMode;
  itinerary?: ItineraryResponse;
  created_at: string;
  updated_at: string;
}

export interface SaveTripRequest {
  user_id: string;
  trip: TripData;
  budget: BudgetResponse;
  hotel?: Hotel;
  transport?: TransportMode;
  itinerary?: ItineraryResponse;
}

export interface UpdateTripRequest {
  trip?: TripData;
  budget?: BudgetResponse;
  hotel?: Hotel;
  transport?: TransportMode;
  itinerary?: ItineraryResponse;
}

export interface TripListResponse {
  trips: SavedTrip[];
  total: number;
  page: number;
  limit: number;
}
