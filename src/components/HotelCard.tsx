import { Star, MapPin } from 'lucide-react';
import type { Hotel } from '../types';

interface Props {
  hotel: Hotel;
  onSelect?: (hotel: Hotel | null) => void;
}

// Capitalize hotel names properly
const formatHotelName = (name: string) => {
  // List of words that should stay lowercase (unless at the start)
  const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of'];
  
  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Keep certain words lowercase unless they're the first word
      if (lowercase.includes(word)) {
        return word;
      }
      // Capitalize other words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Capitalize location names (e.g., "MUMBAI" -> "Mumbai", "NEW DELHI" -> "New Delhi")
const formatLocation = (location: string) => {
  return location
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function HotelCard({ hotel, onSelect }: Props) {
  return (
    <div className="hotel-card group">
      <div className="relative h-56 overflow-hidden rounded-t-xl">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute top-4 left-4 hotel-tag">
          {hotel.tag}
        </div>
        <div className="absolute bottom-4 right-4 hotel-price">
          ₹{hotel.price.toLocaleString()}
        </div>
      </div>

      <div className="p-6 hotel-card-content">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-200 transition-colors">
              {formatHotelName(hotel.name)}
            </h3>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>{formatLocation(hotel.location)}</span>
            </div>
          </div>
          <div className="hotel-rating">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-bold ml-1">{hotel.rating.toFixed(1)}</span>
          </div>
        </div>

        <button
          onClick={() => onSelect?.(hotel)}
          className="w-full hotel-cta"
        >
          Select Hotel
        </button>
      </div>
    </div>
  );
}
