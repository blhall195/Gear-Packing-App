interface Props {
  name: string;
  optional?: boolean;
  checked: boolean;
  onChange: () => void;
  onRemove?: () => void;
}

export default function PackingItem({ name, optional, checked, onChange, onRemove }: Props) {
  const className = [
    'packing-item',
    checked ? 'checked' : '',
    optional ? 'optional' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="packing-item-row">
      <label className={className}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <span className="item-name">{name}</span>
      </label>
      {onRemove && (
        <button
          type="button"
          className="item-remove-btn no-print"
          title="Remove item"
          onClick={onRemove}
        >&times;</button>
      )}
    </div>
  );
}
