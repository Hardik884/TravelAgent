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
        <div className="activity-icon">
          <span className="text-xl">{activity.icon}</span>
        </div>
        {!isLast && <div className="activity-timeline" />}
      </div>

      <div className="flex-1 pb-8">
        <div className="activity-card group">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-teal-200 transition-colors">{activity.name}</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{activity.description}</p>
            </div>
            <div className="text-right space-y-2">
              <div className="activity-time">
                <Clock className="w-4 h-4" />
                <span>{activity.time}</span>
              </div>
              <div className="activity-cost">
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
