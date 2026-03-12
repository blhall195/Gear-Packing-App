import { useState, useRef, useEffect } from 'react';
import type { DragEvent } from 'react';
import type { GearItem } from '../../logic/types';
import PackingItem from './PackingItem';

interface CustomItem {
  id: string;
  name: string;
}

interface Props {
  category: string;
  items: GearItem[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  customItems: CustomItem[];
  onAddCustomItem: (category: string, name: string) => void;
  onRemoveCustomItem: (id: string) => void;
  onHideItem: (id: string) => void;
}

export default function CategoryGroup({
  category, items, checkedIds, onToggle,
  collapsed, onToggleCollapse,
  isDragOver, onDragStart, onDragOver, onDrop, onDragEnd,
  customItems, onAddCustomItem, onRemoveCustomItem, onHideItem,
}: Props) {
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddPopup && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddPopup]);

  useEffect(() => {
    if (!showAddPopup) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowAddPopup(false);
        setNewItemName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddPopup]);

  const handleAdd = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    onAddCustomItem(category, trimmed);
    setNewItemName('');
    setShowAddPopup(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    onDragOver();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    onDrop();
  };

  return (
    <div
      className={`category-group ${isDragOver ? 'drag-over' : ''} ${collapsed ? 'collapsed' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3
        className="category-title drag-handle no-print"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title="Drag to reorder"
      >
        <span className="drag-icon">&#9776;</span>
        {category}
        <button
          type="button"
          className="collapse-toggle no-print"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >{collapsed ? '\u25B2' : '\u25BC'}</button>
      </h3>
      {!collapsed && <div className="category-items">
        {[...items].sort((a, b) => (a.optional ? 1 : 0) - (b.optional ? 1 : 0)).map((item) => (
          <PackingItem
            key={item.id}
            name={item.name}
            optional={!!item.optional}
            checked={checkedIds.has(item.id)}
            onChange={() => onToggle(item.id)}
            onRemove={() => onHideItem(item.id)}
          />
        ))}
        {customItems.map((item) => (
          <PackingItem
            key={item.id}
            name={item.name}
            checked={checkedIds.has(item.id)}
            onChange={() => onToggle(item.id)}
            onRemove={() => onRemoveCustomItem(item.id)}
          />
        ))}
        {showAddPopup ? (
          <div className="add-item-inline" ref={popupRef}>
            <input
              ref={inputRef}
              type="text"
              className="custom-item-input"
              placeholder="Item name..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setShowAddPopup(false); setNewItemName(''); }
              }}
            />
            <button type="button" className="btn btn-primary btn-small" onClick={handleAdd}>
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="add-item-hint no-print"
            onClick={() => setShowAddPopup(true)}
          >+ Add new item...</button>
        )}
      </div>}
    </div>
  );
}
