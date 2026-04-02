import { trends } from '../data/trends';
import TrendCard from './TrendCard';

export default function Feed() {
  return (
    <div className="feed">
      {trends.map((trend) => (
        <TrendCard key={trend.id} trend={trend} />
      ))}
    </div>
  );
}
