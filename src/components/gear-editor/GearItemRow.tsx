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
        {item.always && <span className="gear-item-badge">Always</span>}
      </div>
      <button
        type="button"
        className="btn btn-danger btn-small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        Delete
      </button>
    </div>
  );
}
