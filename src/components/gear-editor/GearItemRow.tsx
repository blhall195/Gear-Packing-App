import type { GearItem } from '../../logic/types';

interface Props {
  item: GearItem;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export default function GearItemRow({ item, isSelected, onClick, onDelete }: Props) {
  return (
    <div className={`gear-item-row ${isSelected ? 'selected' : ''}`}>
      <div className="gear-item-info" onClick={onClick}>
        <span className="gear-item-name">{item.name}</span>
        <span className="gear-item-category">{item.category}</span>
        {item.optional && <span className="gear-item-badge optional-badge">Optional</span>}
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
