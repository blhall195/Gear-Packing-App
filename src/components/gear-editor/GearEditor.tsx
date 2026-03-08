import { useState, useMemo } from 'react';
import type { GearItem } from '../../logic/types';
import { CATEGORY_ORDER } from '../../logic/types';
import GearItemRow from './GearItemRow';
import GearItemForm from './GearItemForm';
import gearData from '../../assets/gear-data.json';

function generateId(): string {
  return crypto.randomUUID();
}

function createEmptyItem(category?: string): GearItem {
  return {
    id: generateId(),
    name: '',
    category: category || '',
    always: false,
    activities: [],
    weather: [],
    duration: [],
    shelter: [],
    sleepProvision: [],
    location: [],
    cooking: [],
  };
}

function exportJson(items: GearItem[]) {
  const json = JSON.stringify(items, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gear-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function groupByCategory(items: GearItem[]): [string, GearItem[]][] {
  const groups: Record<string, GearItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'Uncategorised';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return Object.entries(groups).sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export default function GearEditor() {
  const [items, setItems] = useState<GearItem[]>(gearData as GearItem[]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.category.toLowerCase().includes(filter.toLowerCase())
  );

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  const selectedItem = items.find((i) => i.id === selectedId) || null;

  const handleSave = (updated: GearItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
    setSelectedId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this item?')) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleAdd = (category?: string) => {
    const newItem = createEmptyItem(category);
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  return (
    <div className="gear-editor">
      <div className="editor-header">
        <h2>Gear Editor</h2>
        <div className="editor-actions">
          <button type="button" className="btn btn-primary" onClick={() => handleAdd()}>
            Add Item
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const name = prompt('New category name:');
              if (name?.trim()) handleAdd(name.trim());
            }}
          >
            Add Category
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => exportJson(items)}>
            Export JSON
          </button>
        </div>
      </div>

      <input
        type="text"
        className="editor-search"
        placeholder="Search items..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="editor-categories">
        {grouped.map(([category, categoryItems]) => (
          <div key={category} className="editor-category-card">
            <div className="editor-category-header">
              <h3 className="editor-category-title">{category}</h3>
              <button
                type="button"
                className="btn btn-small btn-primary"
                onClick={() => handleAdd(category)}
              >
                +
              </button>
            </div>
            <div className="editor-category-items">
              {categoryItems.map((item) => (
                <GearItemRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedId}
                  onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="editor-empty">No items found.</p>
        )}
      </div>

      {selectedItem && (
        <div className="editor-form-overlay" onClick={() => setSelectedId(null)}>
          <div className="editor-form-panel" onClick={(e) => e.stopPropagation()}>
            <GearItemForm
              key={selectedItem.id}
              item={selectedItem}
              allItems={items}
              onSave={handleSave}
              onCancel={() => setSelectedId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
