import { Star, MapPin } from 'lucide-react';
import type { Hotel } from '../types';

interface Props {
  hotel: Hotel;
  onSelect?: (hotel: Hotel | null) => void;
}

export default function HotelCard({ hotel, onSelect }: Props) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-transparent">
      <div className="relative h-56 overflow-hidden rounded-xl">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent opacity-90" />
        <div className="absolute top-4 left-4 bg-white/6 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
          {hotel.tag}
        </div>
        <div className="absolute bottom-4 right-4 bg-white/6 px-3 py-1 rounded-full text-white font-semibold">
          ₹{hotel.price.toLocaleString()}
        </div>
      </div>

      <div className="p-5 glass">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{hotel.name}</h3>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{hotel.location}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-white font-medium">{hotel.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <button
            onClick={() => onSelect?.(hotel)}
            className="w-full glass-button py-2 rounded-lg transition-transform transform hover:-translate-y-0.5 font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
