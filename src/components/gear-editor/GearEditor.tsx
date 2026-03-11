import { useState, useMemo, useRef, useCallback } from 'react';
import type { DragEvent } from 'react';
import type { GearItem, CategoryFieldConfig } from '../../logic/types';
import { CATEGORY_ORDER, CONDITION_FIELDS } from '../../logic/types';
import GearItemRow from './GearItemRow';
import GearItemForm from './GearItemForm';
import CategoryForm from './CategoryForm';
import { useGear } from '../../context/GearContext';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function createEmptyItem(category?: string, defaults?: CategoryFieldConfig): GearItem {
  return {
    id: generateId(),
    name: '',
    category: category || '',
    always: false,
    optional: false,
    activities: defaults?.activities ? [...defaults.activities] : [],
    climbingType: defaults?.climbingType ? [...defaults.climbingType] : [],
    cavingType: defaults?.cavingType ? [...defaults.cavingType] : [],
    weather: defaults?.weather ? [...defaults.weather] : [],
    duration: defaults?.duration ? [...defaults.duration] : [],
    shelter: defaults?.shelter ? [...defaults.shelter] : [],
    sleepProvision: defaults?.sleepProvision ? [...defaults.sleepProvision] : [],
    location: defaults?.location ? [...defaults.location] : [],
    cooking: defaults?.cooking ? [...defaults.cooking] : [],
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
  const { items, setItems, categoryFields, setCategoryFields, importFromFile, resetToDefault, isCustom } = useGear();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [categoryOrder, setCategoryOrder] = useState<string[]>([...CATEGORY_ORDER]);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const dragCategory = useRef<string | null>(null);

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.category.toLowerCase().includes(filter.toLowerCase())
  );

  const grouped = useMemo(() => groupByCategory(filtered, categoryOrder), [filtered, categoryOrder]);

  const handleEditorDragStart = useCallback((category: string) => {
    dragCategory.current = category;
  }, []);

  const handleEditorDragOver = useCallback((category: string, e: DragEvent) => {
    e.preventDefault();
    if (dragCategory.current && dragCategory.current !== category) {
      setDragOverCategory(category);
    }
  }, []);

  const handleEditorDrop = useCallback((targetCategory: string, e: DragEvent) => {
    e.preventDefault();
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

    setCategoryOrder(newOrder);
    setDragOverCategory(null);
    dragCategory.current = null;
  }, [grouped]);

  const handleEditorDragEnd = useCallback(() => {
    dragCategory.current = null;
    setDragOverCategory(null);
  }, []);

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
    const defaults = category ? categoryFields[category] : undefined;
    const newItem = createEmptyItem(category, defaults);
    setItems([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const handleAddCategorySave = (name: string, config: CategoryFieldConfig) => {
    const newItem = createEmptyItem(name, config);
    setItems([...items, newItem]);
    setCategoryOrder((prev) => prev.includes(name) ? prev : [...prev, name]);
    setCategoryFields({ ...categoryFields, [name]: config });
    setAddingCategory(false);
  };

  const handleEditCategorySave = (name: string, config: CategoryFieldConfig) => {
    const oldName = editingCategory!;
    const updated = { ...categoryFields };
    if (oldName !== name) {
      delete updated[oldName];
      setItems(items.map((i) => i.category === oldName ? { ...i, category: name } : i));
      setCategoryOrder((prev) => prev.map((c) => c === oldName ? name : c));
    }
    updated[name] = config;
    setCategoryFields(updated);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (category: string) => {
    if (!confirm(`Delete "${category}" and all its items?`)) return;
    setItems(items.filter((i) => i.category !== category));
    const updated = { ...categoryFields };
    delete updated[category];
    setCategoryFields(updated);
    setSelectedId(null);
    setEditingCategory(null);
  };

  const getFieldsForCategory = (category: string): string[] => {
    const config = categoryFields[category];
    return config ? Object.keys(config) : CONDITION_FIELDS.map((cf) => cf.key);
  };

  return (
    <div className="gear-editor">
      <div className="editor-header">
        <h2>Gear Editor</h2>
        <div className="editor-actions">
          <button type="button" className="btn btn-primary" onClick={() => setAddingCategory(true)}>
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

      {isCustom && !isLocal && !warningDismissed && (
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
        {grouped.map(([category, categoryItems]) => (
          <div
            key={category}
            className={`editor-category-card ${dragOverCategory === category ? 'drag-over' : ''} ${collapsedCategories.has(category) ? 'collapsed' : ''}`}
            onDragOver={(e) => handleEditorDragOver(category, e)}
            onDrop={(e) => handleEditorDrop(category, e)}
          >
            <div className="editor-category-header">
              <h3
                className="editor-category-title drag-handle"
                draggable
                onDragStart={() => handleEditorDragStart(category)}
                onDragEnd={handleEditorDragEnd}
                title="Drag to reorder"
              >
                <span className="drag-icon">&#9776;</span>
                {category}
              </h3>
              <div className="editor-category-buttons">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setEditingCategory(category)}
                  title="Edit category settings"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.45"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/></svg>
                </button>
                <button
                  type="button"
                  className="collapse-toggle"
                  onClick={() => setCollapsedCategories(prev => {
                    const next = new Set(prev);
                    next.has(category) ? next.delete(category) : next.add(category);
                    return next;
                  })}
                  aria-label={collapsedCategories.has(category) ? 'Expand' : 'Collapse'}
                >{collapsedCategories.has(category) ? '\u25B2' : '\u25BC'}</button>
              </div>
            </div>
            {!collapsedCategories.has(category) && <div className="editor-category-items">
              {categoryItems.map((item) => (
                <GearItemRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedId}
                  onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
              <button
                type="button"
                className="add-item-hint"
                onClick={() => handleAdd(category)}
              >+ Add new item...</button>
            </div>}
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="editor-empty">No items found.</p>
        )}
      </div>

      {selectedItem && (
        <div className="editor-form-overlay">
          <div className="editor-form-panel">
            <GearItemForm
              key={selectedItem.id}
              item={selectedItem}
              allItems={items}
              categoryFields={getFieldsForCategory(selectedItem.category)}
              onSave={handleSave}
              onCancel={() => setSelectedId(null)}
            />
          </div>
        </div>
      )}

      {addingCategory && (
        <div className="editor-form-overlay">
          <div className="editor-form-panel">
            <CategoryForm
              name=""
              fieldConfig={{}}
              allItems={items}
              onSave={handleAddCategorySave}
              onCancel={() => setAddingCategory(false)}
              isNew
            />
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="editor-form-overlay">
          <div className="editor-form-panel">
            <CategoryForm
              name={editingCategory}
              fieldConfig={categoryFields[editingCategory] || {}}
              allItems={items}
              onSave={handleEditCategorySave}
              onCancel={() => setEditingCategory(null)}
              onDelete={() => handleDeleteCategory(editingCategory)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
