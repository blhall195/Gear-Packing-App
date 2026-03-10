import { useState } from 'react';
import type { QuestionConfig, ShowWhenCondition } from '../../logic/types';

interface Props {
  question: QuestionConfig;
  allQuestions: QuestionConfig[];
  onSave: (question: QuestionConfig) => void;
  onCancel: () => void;
}

/** Walk up the parentId chain to collect ancestor questions */
function getAncestors(questionId: string, allQuestions: QuestionConfig[]): QuestionConfig[] {
  const ancestors: QuestionConfig[] = [];
  let current = allQuestions.find((q) => q.id === questionId);
  while (current?.parentId) {
    const parent = allQuestions.find((q) => q.id === current!.parentId);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }
  return ancestors;
}

export default function QuestionForm({ question, allQuestions, onSave, onCancel }: Props) {
  const ancestors = question.parentId ? getAncestors(question.id, allQuestions) : [];

  // For nested questions, default showWhen to parent's field if not already set
  const defaultShowWhen = ancestors.length > 0 && !question.showWhen
    ? { field: ancestors[0].field }
    : undefined;

  const [draft, setDraft] = useState<QuestionConfig>({
    ...question,
    ...(defaultShowWhen && { showWhen: defaultShowWhen }),
  });
  const [newOptionLabel, setNewOptionLabel] = useState('');

  const generateUniqueValue = (label: string, existing: { value: string }[]): string => {
    const base = label.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
    if (!base) return '';
    if (!existing.some((o) => o.value === base)) return base;
    let i = 2;
    while (existing.some((o) => o.value === `${base}_${i}`)) i++;
    return `${base}_${i}`;
  };

  const handleAddOption = () => {
    const lbl = newOptionLabel.trim();
    if (!lbl) return;
    const val = generateUniqueValue(lbl, draft.baseOptions);
    if (!val) return;
    setDraft({
      ...draft,
      baseOptions: [...draft.baseOptions, { value: val, label: lbl }],
    });
    setNewOptionLabel('');
  };

  const handleRemoveOption = (value: string) => {
    setDraft({
      ...draft,
      baseOptions: draft.baseOptions.filter((o) => o.value !== value),
    });
  };

  const handleUpdateOptionLabel = (value: string, newLabel: string) => {
    setDraft({
      ...draft,
      baseOptions: draft.baseOptions.map((o) =>
        o.value === value ? { ...o, label: newLabel } : o,
      ),
    });
  };

  const handleMoveOption = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= draft.baseOptions.length) return;
    const opts = [...draft.baseOptions];
    [opts[index], opts[newIndex]] = [opts[newIndex], opts[index]];
    setDraft({ ...draft, baseOptions: opts });
  };

  const handleShowWhenChange = (field: string, key: string, value: string) => {
    if (!field) {
      const { showWhen: _, ...rest } = draft;
      setDraft(rest as QuestionConfig);
      return;
    }
    const condition: ShowWhenCondition = { field };
    if (key && value) {
      (condition as Record<string, string>)[key] = value;
    }
    setDraft({ ...draft, showWhen: condition });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.label.trim() || !draft.field) return;
    onSave(draft);
  };

  const showWhenField = draft.showWhen?.field || '';
  const showWhenType = draft.showWhen
    ? (draft.showWhen.includes !== undefined ? 'includes'
      : draft.showWhen.equals !== undefined ? 'equals'
      : draft.showWhen.notIncludes !== undefined ? 'notIncludes'
      : draft.showWhen.notEquals !== undefined ? 'notEquals'
      : '')
    : '';
  const showWhenValue = draft.showWhen
    ? (draft.showWhen.includes ?? draft.showWhen.equals ?? draft.showWhen.notIncludes ?? draft.showWhen.notEquals ?? '')
    : '';

  return (
    <form className="gear-item-form" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {question.label ? 'Edit Question' : 'New Question'}
      </h3>

      <div className="form-field">
        <label>Question Label</label>
        <input
          type="text"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          placeholder="e.g. What activities are you doing?"
        />
      </div>

      <div className="form-field">
        <label>Condition Field</label>
        <input
          type="text"
          value={draft.field}
          onChange={(e) => setDraft({ ...draft, field: e.target.value })}
          placeholder="e.g. activities, weather, climbingType"
        />
        <p className="form-hint">
          The gear item field this answer filters on. Type a new name to create a custom field.
        </p>
      </div>

      <div className="form-field">
        <label>Select Mode</label>
        <div className="question-radio-group">
          <label className="condition-checkbox">
            <input
              type="radio"
              name="selectMode"
              value="single"
              checked={draft.selectMode === 'single'}
              onChange={() => setDraft({ ...draft, selectMode: 'single' })}
            />
            Single select
          </label>
          <label className="condition-checkbox">
            <input
              type="radio"
              name="selectMode"
              value="multi"
              checked={draft.selectMode === 'multi'}
              onChange={() => setDraft({ ...draft, selectMode: 'multi' })}
            />
            Multi select
          </label>
        </div>
      </div>

      <div className="form-field">
        <label>Options</label>
        {draft.baseOptions.length > 0 && (
          <div className="question-options-list">
            {draft.baseOptions.map((opt, i) => (
              <div key={opt.value} className="question-option-row">
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => handleUpdateOptionLabel(opt.value, e.target.value)}
                  className="question-option-label-input"
                />
                <div className="question-option-buttons">
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => handleMoveOption(i, -1)}
                    disabled={i === 0}
                  >
                    &#9650;
                  </button>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => handleMoveOption(i, 1)}
                    disabled={i === draft.baseOptions.length - 1}
                  >
                    &#9660;
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => handleRemoveOption(opt.value)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="question-option-row">
          <input
            type="text"
            placeholder="Option"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
            className="question-option-label-input"
          />
          <div className="question-option-buttons">
            <button type="button" className="btn btn-small" onClick={handleAddOption}>
              Add
            </button>
          </div>
        </div>
      </div>

      {ancestors.length > 0 && (
        <div className="form-field">
          <label>Show When (conditional visibility)</label>
          <p className="form-hint">
            Set a condition to only show this question when a prior answer matches.
          </p>
          <div className="question-condition-row">
            <select
              value={showWhenField}
              onChange={(e) => handleShowWhenChange(e.target.value, showWhenType, showWhenValue)}
              className="question-select"
            >
              <option value="">Always show</option>
              {ancestors.map((aq) => (
                <option key={aq.id} value={aq.field}>{aq.label || aq.field}</option>
              ))}
            </select>
            {showWhenField && (
              <>
                <select
                  value={showWhenType}
                  onChange={(e) => handleShowWhenChange(showWhenField, e.target.value, showWhenValue)}
                  className="question-select"
                >
                  <option value="includes">includes</option>
                  <option value="equals">equals</option>
                  <option value="notIncludes">not includes</option>
                  <option value="notEquals">not equals</option>
                </select>
                {(() => {
                  const selectedAncestor = ancestors.find((aq) => aq.field === showWhenField);
                  return selectedAncestor ? (
                    <select
                      value={showWhenValue}
                      onChange={(e) => handleShowWhenChange(showWhenField, showWhenType, e.target.value)}
                      className="question-select"
                    >
                      <option value="">Select a value...</option>
                      {selectedAncestor.baseOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={showWhenValue}
                      onChange={(e) => handleShowWhenChange(showWhenField, showWhenType, e.target.value)}
                      placeholder="value"
                    />
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!draft.label.trim() || !draft.field}>
          Save
        </button>
      </div>
    </form>
  );
}
