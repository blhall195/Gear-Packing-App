import { useState } from 'react';
import type { GearItem } from '../../logic/types';
import { CONDITION_FIELDS } from '../../logic/types';

interface Props {
  item: GearItem;
  allItems: GearItem[];
  categoryFields: string[];
  onSave: (item: GearItem) => void;
  onCancel: () => void;
}

function getOptionsForField(allItems: GearItem[], field: string): string[] {
  const values = new Set<string>();
  for (const item of allItems) {
    const arr = (item as Record<string, unknown>)[field];
    if (Array.isArray(arr)) {
      arr.forEach((v: string) => values.add(v));
    }
  }
  return Array.from(values).sort();
}

function getCategories(allItems: GearItem[]): string[] {
  const cats = new Set(allItems.map((i) => i.category));
  return Array.from(cats).sort();
}

export default function GearItemForm({ item, allItems, categoryFields, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<GearItem>({ ...item });
  const [newValues, setNewValues] = useState<Record<string, string>>({});

  const categories = getCategories(allItems);

  const handleToggleCondition = (field: string, value: string) => {
    const arr = [...((draft as Record<string, unknown>)[field] as string[] || [])];
    const idx = arr.indexOf(value);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(value);
    }
    setDraft({ ...draft, [field]: arr });
  };

  const handleAddNewValue = (field: string) => {
    const val = (newValues[field] || '').trim().toLowerCase().replace(/\s+/g, '_');
    if (!val) return;
    const arr = [...((draft as Record<string, unknown>)[field] as string[] || [])];
    if (!arr.includes(val)) {
      arr.push(val);
      setDraft({ ...draft, [field]: arr });
    }
    setNewValues({ ...newValues, [field]: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onSave(draft);
  };

  return (
    <form className="gear-item-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>Item Name</label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g. Sleeping bag"
        />
      </div>

      <div className="form-field">
        <label>Category</label>
        <input
          type="text"
          list="category-list"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          placeholder="e.g. Sleep System"
        />
        <datalist id="category-list">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={draft.always}
            onChange={(e) => setDraft({ ...draft, always: e.target.checked })}
          />
          Always include (regardless of conditions)
        </label>
      </div>

      {!draft.always && CONDITION_FIELDS.filter((cf) => {
        return categoryFields.includes(cf.key);
      }).map((cf) => {
        const options = getOptionsForField(allItems, cf.key);
        const selected = (draft as Record<string, unknown>)[cf.key] as string[];

        return (
          <div key={cf.key} className="form-field">
            <label>{cf.label}</label>
            <div className="condition-options">
              {options.map((opt) => (
                <label key={opt} className="condition-checkbox">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => handleToggleCondition(cf.key, opt)}
                  />
                  {opt.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
            <div className="add-new-value">
              <input
                type="text"
                placeholder={`Add new ${cf.label.toLowerCase()}...`}
                value={newValues[cf.key] || ''}
                onChange={(e) => setNewValues({ ...newValues, [cf.key]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewValue(cf.key);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-small"
                onClick={() => handleAddNewValue(cf.key)}
              >
                Add
              </button>
            </div>
          </div>
        );
      })}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}
