import { useState } from 'react';

interface Props {
  name: string;
}

export default function PackingItem({ name }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <label className={`packing-item ${checked ? 'checked' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
      />
      <span className="item-name">{name}</span>
    </label>
  );
}
