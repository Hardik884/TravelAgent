import React, { createContext, useContext, useState, ReactNode } from 'react';
import type {
  TripData,
  BudgetResponse,
  Hotel,
  TransportMode,
  ItineraryResponse,
} from '../types';

interface TripContextType {
  tripData: TripData | null;
  setTripData: (data: TripData) => void;
  
  budgetData: BudgetResponse | null;
  setBudgetData: (data: BudgetResponse) => void;
  
  selectedHotel: Hotel | null;
  setSelectedHotel: (hotel: Hotel | null) => void;
  
  selectedTransport: TransportMode | null;
  setSelectedTransport: (transport: TransportMode | null) => void;
  
  itinerary: ItineraryResponse | null;
  setItinerary: (itinerary: ItineraryResponse) => void;
  
  clearAll: () => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetResponse | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<TransportMode | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);

  const clearAll = () => {
    setTripData(null);
    setBudgetData(null);
    setSelectedHotel(null);
    setSelectedTransport(null);
    setItinerary(null);
  };

  return (
    <TripContext.Provider
      value={{
        tripData,
        setTripData,
        budgetData,
        setBudgetData,
        selectedHotel,
        setSelectedHotel,
        selectedTransport,
        setSelectedTransport,
        itinerary,
        setItinerary,
        clearAll,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
};
