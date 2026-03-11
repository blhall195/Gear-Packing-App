import { useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { useGear } from '../../context/GearContext';
import { matchGear } from '../../logic/matching';
import type { GearItem } from '../../logic/types';
import { CATEGORY_ORDER } from '../../logic/types';
import CategoryGroup from './CategoryGroup';

const CHECKED_STORAGE_KEY = 'checked-items';
const ORDER_STORAGE_KEY = 'category-order';
const CUSTOM_ITEMS_KEY = 'custom-packing-items';
const HIDDEN_ITEMS_KEY = 'hidden-packing-items';
const COLLAPSED_STORAGE_KEY = 'collapsed-categories';

interface CustomItem {
  id: string;
  name: string;
  category: string;
}

function loadCustomItems(): CustomItem[] {
  try {
    const stored = localStorage.getItem(CUSTOM_ITEMS_KEY);
    if (stored) return JSON.parse(stored) as CustomItem[];
  } catch { /* ignore */ }
  return [];
}

function saveCustomItems(items: CustomItem[]) {
  localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(items));
}

function loadHiddenIds(): Set<string> {
  try {
    const stored = localStorage.getItem(HIDDEN_ITEMS_KEY);
    if (stored) return new Set(JSON.parse(stored) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveHiddenIds(ids: Set<string>) {
  localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify([...ids]));
}

function loadCollapsed(): Set<string> {
  try {
    const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveCollapsed(ids: Set<string>) {
  localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...ids]));
}

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

function loadCustomOrder(): string[] | null {
  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as string[];
  } catch { /* ignore */ }
  return null;
}

function saveCustomOrder(order: string[]) {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
}

export default function PackingList() {
  const { answers } = useTrip();
  const { items } = useGear();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(loadChecked);
  const [customOrder, setCustomOrder] = useState<string[] | null>(loadCustomOrder);
  const [customItems, setCustomItems] = useState<CustomItem[]>(loadCustomItems);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(loadHiddenIds);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(loadCollapsed);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const dragCategory = useRef<string | null>(null);

  const handleToggleCollapse = useCallback((category: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      saveCollapsed(next);
      return next;
    });
  }, []);

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
      if (hiddenIds.has(item.id)) continue;
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }

    const sorted = Object.entries(groups).sort(([a], [b]) => {
      const aCollapsed = collapsedIds.has(a) ? 1 : 0;
      const bCollapsed = collapsedIds.has(b) ? 1 : 0;
      if (aCollapsed !== bCollapsed) return aCollapsed - bCollapsed;

      if (customOrder) {
        const ai = customOrder.indexOf(a);
        const bi = customOrder.indexOf(b);
        const aIdx = ai === -1 ? 999 : ai;
        const bIdx = bi === -1 ? 999 : bi;
        return aIdx - bIdx;
      }
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      const aIdx = ai === -1 ? 999 : ai;
      const bIdx = bi === -1 ? 999 : bi;
      return aIdx - bIdx;
    });

    return sorted;
  }, [matched, customOrder, hiddenIds, collapsedIds]);

  const handleDragStart = useCallback((category: string) => {
    dragCategory.current = category;
  }, []);

  const handleDragOver = useCallback((category: string) => {
    if (dragCategory.current && dragCategory.current !== category) {
      setDragOverCategory(category);
    }
  }, []);

  const handleDrop = useCallback((targetCategory: string) => {
    const source = dragCategory.current;
    if (!source || source === targetCategory) {
      setDragOverCategory(null);
      return;
    }

    const currentCategories = grouped.map(([cat]) => cat);
    const sourceIdx = currentCategories.indexOf(source);
    const targetIdx = currentCategories.indexOf(targetCategory);
    if (sourceIdx === -1 || targetIdx === -1) {
      setDragOverCategory(null);
      return;
    }

    const newOrder = [...currentCategories];
    newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, source);

    setCustomOrder(newOrder);
    saveCustomOrder(newOrder);
    setDragOverCategory(null);
    dragCategory.current = null;
  }, [grouped]);

  const handleDragEnd = useCallback(() => {
    dragCategory.current = null;
    setDragOverCategory(null);
  }, []);

  const handleHideItem = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveHiddenIds(next);
      return next;
    });
  }, []);

  const handleAddCustomItem = useCallback((category: string, name: string) => {
    setCustomItems(prev => {
      const next = [...prev, { id: `custom-${Date.now()}`, name, category }];
      saveCustomItems(next);
      return next;
    });
  }, []);

  const handleRemoveCustomItem = useCallback((id: string) => {
    setCustomItems(prev => {
      const next = prev.filter(i => i.id !== id);
      saveCustomItems(next);
      return next;
    });
    setCheckedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      saveChecked(next);
      return next;
    });
  }, []);

  const customByCategory = useMemo(() => {
    const map: Record<string, CustomItem[]> = {};
    for (const item of customItems) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [customItems]);

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
        <p className="item-count">{matched.length - hiddenIds.size + customItems.length} items</p>
      </div>

      <div className="list-content">
        {grouped.map(([category, categoryItems]) => (
          <CategoryGroup
            key={category}
            category={category}
            items={categoryItems}
            checkedIds={checkedIds}
            onToggle={handleToggle}
            collapsed={collapsedIds.has(category)}
            onToggleCollapse={() => handleToggleCollapse(category)}
            isDragOver={dragOverCategory === category}
            onDragStart={() => handleDragStart(category)}
            onDragOver={() => handleDragOver(category)}
            onDrop={() => handleDrop(category)}
            onDragEnd={handleDragEnd}
            customItems={customByCategory[category] || []}
            onAddCustomItem={handleAddCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
            onHideItem={handleHideItem}
          />
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
