import { useState } from 'react';
import type { CategoryFieldConfig } from '../../logic/types';
import type { QuestionConfig } from '../../logic/types';
import { useQuestions } from '../../context/QuestionContext';

interface Props {
  name: string;
  fieldConfig: CategoryFieldConfig;
  onSave: (name: string, config: CategoryFieldConfig) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

function getOptionsForField(field: string, questions: QuestionConfig[]): string[] {
  const questionConfig = questions.find((q) => q.field === field);
  if (!questionConfig) return [];
  return questionConfig.baseOptions.map((opt) => opt.value);
}

interface FieldNode {
  key: string;
  label: string;
  children: FieldNode[];
}

function buildFieldTree(questions: QuestionConfig[]): FieldNode[] {
  const withField = questions.filter((q) => q.field);
  const seen = new Set<string>();

  function getChildren(parentId: string | null): FieldNode[] {
    return withField
      .filter((q) => q.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .reduce<FieldNode[]>((acc, q) => {
        if (!seen.has(q.field)) {
          seen.add(q.field);
          acc.push({ key: q.field, label: q.label, children: getChildren(q.id) });
        }
        return acc;
      }, []);
  }

  return getChildren(null);
}

/** Collect all field keys in a subtree (node + descendants) */
function collectKeys(node: FieldNode): string[] {
  return [node.key, ...node.children.flatMap(collectKeys)];
}

/** Collect only fields that are selected AND whose full ancestor chain is also selected */
function collectVisibleSelected(nodes: FieldNode[], selected: Set<string>): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  for (const node of nodes) {
    if (selected.has(node.key)) {
      result.push({ key: node.key, label: node.label });
      result.push(...collectVisibleSelected(node.children, selected));
    }
  }
  return result;
}

export default function CategoryForm({ name: initialName, fieldConfig, onSave, onCancel, onDelete, isNew }: Props) {
  const { questions } = useQuestions();

  const fieldTree = buildFieldTree(questions);

  const [name, setName] = useState(initialName);
  const [config, setConfig] = useState<CategoryFieldConfig>({ ...fieldConfig });

  const handleToggleField = (key: string, node: FieldNode) => {
    setConfig((prev) => {
      const next = { ...prev };
      if (key in next) {
        // Unchecking: also remove all descendant fields
        for (const k of collectKeys(node)) {
          delete next[k];
        }
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

  function renderFieldNodes(nodes: FieldNode[], depth: number) {
    return (
      <div className="condition-options" style={depth > 0 ? { marginLeft: '1.25rem', marginTop: '0.3rem' } : undefined}>
        {nodes.map((node) => (
          <div key={node.key}>
            <label className="condition-checkbox">
              <input
                type="checkbox"
                checked={selectedFields.includes(node.key)}
                onChange={() => handleToggleField(node.key, node)}
              />
              {node.label}
            </label>
            {selectedFields.includes(node.key) && node.children.length > 0 && renderFieldNodes(node.children, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

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
        {renderFieldNodes(fieldTree, 0)}
      </div>

      {selectedFields.length > 0 && (
        <div className="form-field">
          <label>Default values for new items</label>
          <p className="form-hint">Pre-selected when you add a new item to this category</p>
          {collectVisibleSelected(fieldTree, new Set(selectedFields)).map((cf) => {
            const options = getOptionsForField(cf.key, questions);
            const defaults = config[cf.key] || [];

            if (options.length === 0) return null;

            return (
              <div key={cf.key} className="category-default-field">
                <label className="category-default-label">{cf.label}</label>
                <div className="condition-options">
                  {options.map((opt) => {
                    const qConfig = questions.find(q => q.field === cf.key);
                    const optLabel = qConfig?.baseOptions.find(o => o.value === opt)?.label || opt.replace(/_/g, ' ');
                    return (
                      <label key={opt} className="condition-checkbox">
                        <input
                          type="checkbox"
                          checked={defaults.includes(opt)}
                          onChange={() => handleToggleDefault(cf.key, opt)}
                        />
                        {optLabel}
                      </label>
                    );
                  })}
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
