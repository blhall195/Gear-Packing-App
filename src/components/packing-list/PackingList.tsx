import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { matchGear } from '../../logic/matching';
import type { GearItem } from '../../logic/types';
import { CATEGORY_ORDER } from '../../logic/types';
import CategoryGroup from './CategoryGroup';
import gearData from '../../assets/gear-data.json';

const items = gearData as GearItem[];

export default function PackingList() {
  const { answers } = useTrip();

  const matched = useMemo(() => matchGear(items, answers), [answers]);

  const grouped = useMemo(() => {
    const groups: Record<string, GearItem[]> = {};
    for (const item of matched) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }

    const sorted = Object.entries(groups).sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      const aIdx = ai === -1 ? 999 : ai;
      const bIdx = bi === -1 ? 999 : bi;
      return aIdx - bIdx;
    });

    return sorted;
  }, [matched]);

  const handlePrint = () => window.print();

  if (matched.length === 0) {
    return (
      <div className="packing-list">
        <h2>Your Packing List</h2>
        <p>No items matched your trip. Try adjusting your answers.</p>
        <Link to="/" className="btn btn-primary">Start Over</Link>
      </div>
    );
  }

  return (
    <div className="packing-list">
      <div className="list-header">
        <h2>Your Packing List</h2>
        <p className="item-count">{matched.length} items</p>
      </div>

      <div className="list-content">
        {grouped.map(([category, categoryItems]) => (
          <CategoryGroup key={category} category={category} items={categoryItems} />
        ))}
      </div>

      <div className="list-actions no-print">
        <Link to="/" className="btn btn-secondary">Start Over</Link>
        <button type="button" className="btn btn-primary" onClick={handlePrint}>
          Print List
        </button>
      </div>
    </div>
  );
}
