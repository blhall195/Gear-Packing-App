import { useState } from 'react';
import { CONDITION_FIELDS } from '../../logic/types';

interface Props {
  name: string;
  selectedFields: string[];
  onSave: (name: string, fields: string[]) => void;
  onCancel: () => void;
  isNew?: boolean;
}

export default function CategoryForm({ name: initialName, selectedFields, onSave, onCancel, isNew }: Props) {
  const [name, setName] = useState(initialName);
  const [fields, setFields] = useState<string[]>([...selectedFields]);

  const handleToggle = (key: string) => {
    setFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), fields);
  };

  return (
    <form className="gear-item-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>{isNew ? 'Category Name' : 'Rename Category'}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Water Sports"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label>Which questions apply to items in this category?</label>
        <div className="condition-options">
          {CONDITION_FIELDS.map((cf) => (
            <label key={cf.key} className="condition-checkbox">
              <input
                type="checkbox"
                checked={fields.includes(cf.key)}
                onChange={() => handleToggle(cf.key)}
              />
              {cf.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {isNew ? 'Create Category' : 'Save'}
        </button>
      </div>
    </form>
  );
}
