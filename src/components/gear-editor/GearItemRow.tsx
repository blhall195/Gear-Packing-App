import type { DragEvent } from 'react';
import type { GearItem } from '../../logic/types';

interface Props {
  item: GearItem;
  isSelected: boolean;
  isDragOver: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
}

export default function GearItemRow({ item, isSelected, isDragOver, onClick, onDelete, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  return (
    <div
      className={`gear-item-row ${isSelected ? 'selected' : ''} ${isDragOver ? 'item-drag-over' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span
        className="item-drag-handle"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title="Drag to reorder"
      >&#9776;</span>
      <div className="gear-item-info" onClick={onClick}>
        <span className="gear-item-name">{item.name}</span>
        <span className="gear-item-category">{item.category}</span>
      </div>
      <button
        type="button"
        className="item-remove-btn"
        title="Delete item"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >&times;</button>
    </div>
  );
}
