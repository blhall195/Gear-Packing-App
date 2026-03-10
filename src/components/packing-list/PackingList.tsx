import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { useGear } from '../../context/GearContext';
import { matchGear } from '../../logic/matching';
import type { GearItem } from '../../logic/types';
import { CATEGORY_ORDER } from '../../logic/types';
import CategoryGroup from './CategoryGroup';

const CHECKED_STORAGE_KEY = 'checked-items';

function loadChecked(): Set<string> {
  try {
    const stored = localStorage.getItem(CHECKED_STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveChecked(ids: Set<string>) {
  localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify([...ids]));
}

export default function PackingList() {
  const { answers } = useTrip();
  const { items } = useGear();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(loadChecked);

  const handleToggle = useCallback((id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(next);
      return next;
    });
  }, []);

  const matched = useMemo(() => matchGear(items, answers), [items, answers]);

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
          <CategoryGroup key={category} category={category} items={categoryItems} checkedIds={checkedIds} onToggle={handleToggle} />
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
