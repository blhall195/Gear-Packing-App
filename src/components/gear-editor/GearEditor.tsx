import { useState, useMemo } from 'react';
import type { GearItem } from '../../logic/types';
import { CATEGORY_ORDER } from '../../logic/types';
import GearItemRow from './GearItemRow';
import GearItemForm from './GearItemForm';
import { useGear } from '../../context/GearContext';

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
    climbingType: [],
    cavingType: [],
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

function groupByCategory(items: GearItem[], order: string[]): [string, GearItem[]][] {
  const groups: Record<string, GearItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'Uncategorised';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return Object.entries(groups).sort(([a], [b]) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

function getCategoryNames(items: GearItem[], order: string[]): string[] {
  const cats = new Set(items.map((i) => i.category || 'Uncategorised'));
  const ordered = order.filter((c) => cats.has(c));
  const remaining = [...cats].filter((c) => !order.includes(c));
  return [...ordered, ...remaining];
}

export default function GearEditor() {
  const { items, setItems, importFromFile, resetToDefault, isCustom } = useGear();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [categoryOrder, setCategoryOrder] = useState<string[]>([...CATEGORY_ORDER]);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.category.toLowerCase().includes(filter.toLowerCase())
  );

  const grouped = useMemo(() => groupByCategory(filtered, categoryOrder), [filtered, categoryOrder]);

  const handleMoveCategory = (category: string, direction: -1 | 1) => {
    setCategoryOrder((prev) => {
      const allCats = getCategoryNames(items, prev);
      const idx = allCats.indexOf(category);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= allCats.length) return prev;
      const reordered = [...allCats];
      [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
      return reordered;
    });
  };

  const selectedItem = items.find((i) => i.id === selectedId) || null;

  const handleSave = (updated: GearItem) => {
    setItems(items.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this item?')) return;
    setItems(items.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleAdd = (category?: string) => {
    const newItem = createEmptyItem(category);
    setItems([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const handleAddCategory = () => {
    const name = prompt('New category name:');
    if (!name?.trim()) return;
    const trimmed = name.trim();
    const newItem = createEmptyItem(trimmed);
    setItems([...items, newItem]);
    setCategoryOrder((prev) => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  };

  const handleDeleteCategory = (category: string) => {
    if (!confirm(`Delete "${category}" and all its items?`)) return;
    setItems(items.filter((i) => i.category !== category));
    setSelectedId(null);
  };

  return (
    <div className="gear-editor">
      <div className="editor-header">
        <h2>Gear Editor</h2>
        <div className="editor-actions">
          <button type="button" className="btn btn-primary" onClick={() => handleAdd()}>
            Add Item
          </button>
          <button type="button" className="btn btn-primary" onClick={handleAddCategory}>
            Add Category
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => exportJson(items)}>
            Download Gear Settings
          </button>
          <button type="button" className="btn btn-secondary" onClick={importFromFile}>
            Upload Gear Settings
          </button>
          {isCustom && (
            <button type="button" className="btn btn-danger" onClick={resetToDefault}>
              Reset to Default
            </button>
          )}
        </div>
      </div>

      {isCustom && !warningDismissed && (
        <p className="gear-warning">
          You are using a custom gear setup. These settings are stored in your browser and will be lost if you clear your browser data. Use "Download Gear Settings" to save a backup.
          <button
            type="button"
            className="gear-warning-close"
            onClick={() => setWarningDismissed(true)}
            aria-label="Dismiss warning"
          >
            &times;
          </button>
        </p>
      )}

      <input
        type="text"
        className="editor-search"
        placeholder="Search items..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="editor-categories">
        {grouped.map(([category, categoryItems], idx) => (
          <div key={category} className="editor-category-card">
            <div className="editor-category-header">
              <h3 className="editor-category-title">{category}</h3>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={() => handleMoveCategory(category, -1)}
                  disabled={idx === 0}
                  title="Move left"
                >
                  &#8592;
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={() => handleMoveCategory(category, 1)}
                  disabled={idx === grouped.length - 1}
                  title="Move right"
                >
                  &#8594;
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-primary"
                  onClick={() => handleAdd(category)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteCategory(category)}
                >
                  &times;
                </button>
              </div>
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
