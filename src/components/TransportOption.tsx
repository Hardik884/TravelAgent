import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useState } from 'react';

interface TransportOption {
  mode: string;
  icon: string;
  duration: string;
  priceRange: string;
  note: string;
  options: Array<{
    carrier: string;
    time: string;
    price: number;
  }>;
}

interface Props {
  transport: TransportOption;
  onSelect?: (mode: string, option: any) => void;
  selected?: boolean;
}

export default function TransportOption({ transport, onSelect, selected }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelectedOption(index);
    onSelect?.(transport.mode, transport.options[index]);
  };

  return (
    <div className="glass rounded-xl overflow-hidden shadow-lg transition-all">
      <div
        className="p-5 cursor-pointer hover:scale-[1.01] transition-transform"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.08), rgba(124,58,237,0.08))' }}>
              <span>{transport.icon}</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{transport.mode}</h3>
              <p className="text-gray-300 text-sm">{transport.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-medium">{transport.priceRange}</p>
              <p className="text-teal-300 text-sm">{transport.note}</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-white/10 p-5 space-y-3 bg-transparent">
          {transport.options.map((option, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                selectedOption === index
                  ? 'bg-gradient-to-r from-teal-900 to-indigo-900 border-2 border-white/10 text-white'
                  : 'bg-white/6 hover:bg-white/8 text-gray-100'
              }`}
              onClick={() => handleSelect(index)}
            >
              <div>
                <p className="text-white font-medium">{option.carrier}</p>
                <p className="text-gray-300 text-sm">{option.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-white font-bold">₹{option.price.toLocaleString()}</p>
                {selectedOption === index && (
                  <Check className="w-5 h-5 text-teal-300" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
