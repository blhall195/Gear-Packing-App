import { useState } from 'react';
import type { GearItem } from '../../logic/types';
import type { QuestionConfig } from '../../logic/types';
import { useQuestions } from '../../context/QuestionContext';

interface Props {
  item: GearItem;
  allItems: GearItem[];
  categoryFields: string[];
  onSave: (item: GearItem) => void;
  onCancel: () => void;
}

function getOptionsForField(currentItem: GearItem, field: string, questions: QuestionConfig[]): string[] {
  const questionConfig = questions.find((q) => q.field === field);
  const values = new Set<string>();

  if (questionConfig) {
    // Use question baseOptions as source of truth
    for (const opt of questionConfig.baseOptions) {
      values.add(opt.value);
    }
  }

  // Include values on the current item (so stale values can be seen and unticked)
  const currentArr = (currentItem as Record<string, unknown>)[field];
  if (Array.isArray(currentArr)) {
    currentArr.forEach((v: string) => values.add(v));
  }

  return Array.from(values).sort();
}

function getCategories(allItems: GearItem[]): string[] {
  const cats = new Set(allItems.map((i) => i.category));
  return Array.from(cats).sort();
}

export default function GearItemForm({ item, allItems, categoryFields, onSave, onCancel }: Props) {
  const { questions } = useQuestions();
  const [draft, setDraft] = useState<GearItem>({ ...item, optional: item.optional ?? false });
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

      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={draft.optional}
            onChange={(e) => setDraft({ ...draft, optional: e.target.checked })}
          />
          Optional item (shown greyed out on packing list)
        </label>
      </div>

      {!draft.always && questions
        .filter((q) => q.field && categoryFields.includes(q.field))
        .map((q) => {
        const options = getOptionsForField(draft, q.field, questions);
        const selected = ((draft as Record<string, unknown>)[q.field] as string[]) || [];

        return (
          <div key={q.field} className="form-field">
            <label>{q.label}</label>
            <div className="condition-options">
              {options.map((opt) => {
                const optLabel = q.baseOptions.find(o => o.value === opt)?.label || opt.replace(/_/g, ' ');
                return (
                  <label key={opt} className="condition-checkbox">
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => handleToggleCondition(q.field, opt)}
                    />
                    {optLabel}
                  </label>
                );
              })}
            </div>
            <div className="add-new-value">
              <input
                type="text"
                placeholder={`Add new ${q.label.toLowerCase()}...`}
                value={newValues[q.field] || ''}
                onChange={(e) => setNewValues({ ...newValues, [q.field]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewValue(q.field);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-small"
                onClick={() => handleAddNewValue(q.field)}
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
