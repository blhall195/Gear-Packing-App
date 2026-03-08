import type { GearItem } from '../../logic/types';
import PackingItem from './PackingItem';

interface Props {
  category: string;
  items: GearItem[];
}

export default function CategoryGroup({ category, items }: Props) {
  return (
    <div className="category-group">
      <h3 className="category-title">{category}</h3>
      <div className="category-items">
        {items.map((item) => (
          <PackingItem key={item.id} name={item.name} />
        ))}
      </div>
    </div>
  );
}
