import type { GearItem } from '../../logic/types';
import PackingItem from './PackingItem';

interface Props {
  category: string;
  items: GearItem[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function CategoryGroup({ category, items, checkedIds, onToggle }: Props) {
  return (
    <div className="category-group">
      <h3 className="category-title">{category}</h3>
      <div className="category-items">
        {items.map((item) => (
          <PackingItem
            key={item.id}
            name={item.name}
            optional={!!item.optional}
            checked={checkedIds.has(item.id)}
            onChange={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
