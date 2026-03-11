import { useState } from 'react';
import type { GearItem, CategoryFieldConfig } from '../../logic/types';
import type { QuestionConfig } from '../../logic/types';
import { CONDITION_FIELDS } from '../../logic/types';
import { useQuestions } from '../../context/QuestionContext';

interface Props {
  name: string;
  fieldConfig: CategoryFieldConfig;
  allItems: GearItem[];
  onSave: (name: string, config: CategoryFieldConfig) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

function getOptionsForField(allItems: GearItem[], field: string, questions: QuestionConfig[]): string[] {
  const values = new Set<string>();
  for (const item of allItems) {
    const arr = (item as Record<string, unknown>)[field];
    if (Array.isArray(arr)) {
      arr.forEach((v: string) => values.add(v));
    }
  }
  const questionConfig = questions.find((q) => q.field === field);
  if (questionConfig) {
    for (const opt of questionConfig.baseOptions) {
      values.add(opt.value);
    }
  }
  return Array.from(values).sort();
}

export default function CategoryForm({ name: initialName, fieldConfig, allItems, onSave, onCancel, onDelete, isNew }: Props) {
  const { questions } = useQuestions();
  const [name, setName] = useState(initialName);
  const [config, setConfig] = useState<CategoryFieldConfig>({ ...fieldConfig });

  const handleToggleField = (key: string) => {
    setConfig((prev) => {
      const next = { ...prev };
      if (key in next) {
        delete next[key];
      } else {
        next[key] = [];
      }
      return next;
    });
  };

  const handleToggleDefault = (field: string, value: string) => {
    setConfig((prev) => {
      const arr = [...(prev[field] || [])];
      const idx = arr.indexOf(value);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(value);
      }
      return { ...prev, [field]: arr };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), config);
  };

  const selectedFields = Object.keys(config);

  return (
    <form className="gear-item-form" onSubmit={handleSubmit}>
      <button type="button" className="form-close-btn" onClick={onCancel} aria-label="Close">&times;</button>
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
                checked={selectedFields.includes(cf.key)}
                onChange={() => handleToggleField(cf.key)}
              />
              {cf.label}
            </label>
          ))}
        </div>
      </div>

      {selectedFields.length > 0 && (
        <div className="form-field">
          <label>Default values for new items</label>
          <p className="form-hint">Pre-selected when you add a new item to this category</p>
          {CONDITION_FIELDS.filter((cf) => selectedFields.includes(cf.key)).map((cf) => {
            const options = getOptionsForField(allItems, cf.key, questions);
            const defaults = config[cf.key] || [];

            if (options.length === 0) return null;

            return (
              <div key={cf.key} className="category-default-field">
                <label className="category-default-label">{cf.label}</label>
                <div className="condition-options">
                  {options.map((opt) => (
                    <label key={opt} className="condition-checkbox">
                      <input
                        type="checkbox"
                        checked={defaults.includes(opt)}
                        onChange={() => handleToggleDefault(cf.key, opt)}
                      />
                      {opt.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="form-actions">
        {onDelete && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            Delete Category
          </button>
        )}
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
