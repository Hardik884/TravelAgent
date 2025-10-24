import { Clock, IndianRupee } from 'lucide-react';

interface Activity {
  name: string;
  icon: string;
  time: string;
  cost: number;
  description: string;
}

interface Props {
  activity: Activity;
  isLast?: boolean;
}

export default function ActivityCard({ activity, isLast }: Props) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.12), rgba(124,58,237,0.12))' }}>
          <span className="text-xl">{activity.icon}</span>
        </div>
        {!isLast && <div className="w-px h-full bg-white/6 mt-3" />}
      </div>

      <div className="flex-1 pb-8">
        <div className="glass rounded-xl p-5 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">{activity.name}</h4>
              <p className="text-gray-300 text-sm mb-3">{activity.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300 mb-2 flex items-center justify-end gap-2">
                <Clock className="w-4 h-4" />
                <span>{activity.time}</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/6 text-white/90 px-3 py-1 rounded-full font-medium">
                <IndianRupee className="w-4 h-4" />
                <span>{activity.cost === 0 ? 'Free' : `₹${activity.cost.toLocaleString()}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
