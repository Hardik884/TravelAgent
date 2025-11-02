import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useState } from 'react';
import type { TransportMode } from '../types';

interface Props {
  transport: TransportMode;
  onSelect?: (transportMode: TransportMode) => void;
  selected?: boolean;
}

export default function TransportOption({ transport, onSelect, selected }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelectedOption(index);
    // Pass the transport mode with the selected option attached
    const transportWithSelection = {
      ...transport,
      selectedOption: transport.options[index]
    };
    onSelect?.(transportWithSelection);
  };

  // Clean up the note text to remove API references
  const cleanNote = (note: string) => {
    return note
      .replace(/\s*-\s*Real flight data from Amadeus/i, '')
      .replace(/\s*\|\s*Real IRCTC Data/i, '')
      .trim();
  };

  return (
    <div className="transport-card group">
      <div
        className="transport-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="transport-icon">
              <span>{transport.icon}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-teal-200 transition-colors">{transport.mode}</h3>
              <p className="text-gray-300 text-sm mt-1">{transport.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-bold text-lg">{transport.price_range}</p>
              <p className="text-teal-300 text-sm font-medium">{cleanNote(transport.note)}</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-teal-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-teal-300 transition-colors" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="transport-options">
          {transport.options.map((option, index) => (
            <div
              key={index}
              className={`transport-option ${
                selectedOption === index ? 'transport-option-selected' : ''
              }`}
              onClick={() => handleSelect(index)}
            >
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">{option.carrier}</p>
                <p className="text-gray-300 text-sm">{option.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-white font-bold text-lg">₹{option.price.toLocaleString()}</p>
                {selectedOption === index && (
                  <div className="transport-check">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
