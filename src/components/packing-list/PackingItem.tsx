interface Props {
  name: string;
  optional?: boolean;
  checked: boolean;
  onChange: () => void;
}

export default function PackingItem({ name, optional, checked, onChange }: Props) {
  const className = [
    'packing-item',
    checked ? 'checked' : '',
    optional ? 'optional' : '',
  ].filter(Boolean).join(' ');

  return (
    <label className={className}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="item-name">{name}</span>
    </label>
  );
}
