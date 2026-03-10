import { useState } from 'react';
import type { QuestionConfig } from '../../logic/types';
import { useQuestions } from '../../context/QuestionContext';
import QuestionRow from './QuestionRow';
import QuestionForm from './QuestionForm';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'q-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function createEmptyQuestion(): QuestionConfig {
  return {
    id: generateId(),
    field: '',
    label: '',
    selectMode: 'single',
    baseOptions: [],
    parentId: null,
    order: 0,
  };
}

interface TreeNode {
  question: QuestionConfig;
  children: TreeNode[];
}

function buildTree(questions: QuestionConfig[]): TreeNode[] {
  const roots = questions
    .filter((q) => !q.parentId)
    .sort((a, b) => a.order - b.order);

  function getChildren(parentId: string): TreeNode[] {
    return questions
      .filter((q) => q.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((q) => ({ question: q, children: getChildren(q.id) }));
  }

  return roots.map((q) => ({ question: q, children: getChildren(q.id) }));
}

/** Get the flat ordered list of siblings for a given parentId */
function getSiblings(questions: QuestionConfig[], parentId: string | null): QuestionConfig[] {
  return questions
    .filter((q) => q.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

export default function QuestionEditor() {
  const { questions, setQuestions, importFromFile, resetToDefault, isCustom } = useQuestions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const tree = buildTree(questions);

  const handleSave = (updated: QuestionConfig) => {
    const exists = questions.some((q) => q.id === updated.id);
    if (exists) {
      setQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
    } else {
      const siblings = questions.filter((q) => q.parentId === updated.parentId);
      updated.order = siblings.length;
      setQuestions([...questions, updated]);
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const dependents = questions.filter((q) => q.parentId === id);
    const deletedField = questions.find((q) => q.id === id)?.field;
    const depByShowWhen = questions.filter(
      (q) => q.showWhen?.field === deletedField && q.id !== id,
    );

    let msg = 'Delete this question?';
    if (dependents.length > 0) {
      msg += `\n\n${dependents.length} sub-question(s) will also be removed.`;
    }
    if (depByShowWhen.length > 0) {
      msg += `\n\n${depByShowWhen.length} question(s) reference this field in their show-when condition.`;
    }

    if (!confirm(msg)) return;

    const idsToRemove = new Set<string>();
    function collectIds(parentId: string) {
      idsToRemove.add(parentId);
      for (const q of questions) {
        if (q.parentId === parentId) {
          collectIds(q.id);
        }
      }
    }
    collectIds(id);

    setQuestions(questions.filter((q) => !idsToRemove.has(q.id)));
    if (editingId && idsToRemove.has(editingId)) {
      setEditingId(null);
    }
  };

  const handleMove = (id: string, direction: -1 | 1) => {
    const q = questions.find((q) => q.id === id);
    if (!q) return;

    const siblings = getSiblings(questions, q.parentId);
    const idx = siblings.findIndex((s) => s.id === id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= siblings.length) return;

    const updated = questions.map((item) => {
      if (item.id === siblings[idx].id) return { ...item, order: siblings[newIdx].order };
      if (item.id === siblings[newIdx].id) return { ...item, order: siblings[idx].order };
      return item;
    });

    setQuestions(updated);
  };

  const handleIndent = (id: string) => {
    // Make this question a child of the previous sibling at the same level
    const q = questions.find((q) => q.id === id);
    if (!q) return;

    const siblings = getSiblings(questions, q.parentId);
    const idx = siblings.findIndex((s) => s.id === id);
    if (idx <= 0) return; // Can't indent the first sibling

    const newParent = siblings[idx - 1];
    const newSiblings = getSiblings(questions, newParent.id);
    const newOrder = newSiblings.length; // Add at end of new parent's children

    setQuestions(questions.map((item) =>
      item.id === id ? { ...item, parentId: newParent.id, order: newOrder } : item,
    ));
  };

  const handleOutdent = (id: string) => {
    // Move this question up one level: become a sibling of its current parent
    const q = questions.find((q) => q.id === id);
    if (!q || !q.parentId) return; // Already top-level

    const parent = questions.find((p) => p.id === q.parentId);
    if (!parent) return;

    const newParentId = parent.parentId; // Could be null (top-level)
    // Insert right after the old parent
    const newOrder = parent.order + 0.5; // Will be normalised

    // Normalise orders for the new sibling level
    const updated = questions.map((item) =>
      item.id === id ? { ...item, parentId: newParentId, order: newOrder } : item,
    );

    // Renumber siblings at the new level to clean up fractional orders
    const newLevelSiblings = updated
      .filter((item) => item.parentId === newParentId)
      .sort((a, b) => a.order - b.order);

    const renumbered = new Map<string, number>();
    newLevelSiblings.forEach((s, i) => renumbered.set(s.id, i));

    setQuestions(updated.map((item) =>
      renumbered.has(item.id) && item.parentId === newParentId
        ? { ...item, order: renumbered.get(item.id)! }
        : item,
    ));
  };

  const handleExport = () => {
    const json = JSON.stringify(questions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdd = () => {
    const newQ = createEmptyQuestion();
    const topLevel = getSiblings(questions, null);
    newQ.order = topLevel.length;
    setEditingId(newQ.id);
    setQuestions([...questions, newQ]);
  };

  const handleCancelEdit = () => {
    const q = questions.find((q) => q.id === editingId);
    if (q && !q.label.trim()) {
      setQuestions(questions.filter((q) => q.id !== editingId));
    }
    setEditingId(null);
  };

  const editingQuestion = questions.find((q) => q.id === editingId) || null;

  function renderTree(nodes: TreeNode[], depth: number, parentId: string | null) {
    return nodes.map((node, index) => {
      const canIndent = index > 0; // Has a previous sibling to become child of
      const canOutdent = parentId !== null; // Has a parent to escape from

      return (
        <div key={node.question.id}>
          <QuestionRow
            question={node.question}
            depth={depth}
            index={index}
            siblingCount={nodes.length}
            canIndent={canIndent}
            canOutdent={canOutdent}
            onEdit={() => setEditingId(node.question.id)}
            onDelete={() => handleDelete(node.question.id)}
            onMove={(dir) => handleMove(node.question.id, dir)}
            onIndent={() => handleIndent(node.question.id)}
            onOutdent={() => handleOutdent(node.question.id)}
          />
          {node.children.length > 0 && renderTree(node.children, depth + 1, node.question.id)}
        </div>
      );
    });
  }

  return (
    <div className="question-editor">
      <div className="editor-header">
        <h2>Question Editor</h2>
        <div className="editor-actions">
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            Add Question
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            Download Questions
          </button>
          <button type="button" className="btn btn-secondary" onClick={importFromFile}>
            Upload Questions
          </button>
          {isCustom && (
            <button type="button" className="btn btn-danger" onClick={resetToDefault}>
              Reset to Default
            </button>
          )}
        </div>
      </div>

      {isCustom && !isLocal && !warningDismissed && (
        <p className="gear-warning">
          You are using a custom question setup. These settings are stored in your browser and will be lost if you clear your browser data.
          <button
            type="button"
            className="gear-warning-close"
            onClick={() => setWarningDismissed(true)}
            aria-label="Dismiss warning"
          >
            &times;
          </button>
        </p>
      )}

      <div className="question-tree">
        {tree.length > 0 ? (
          renderTree(tree, 0, null)
        ) : (
          <p className="editor-empty">No questions configured. Add a question or reset to defaults.</p>
        )}
      </div>

      {editingQuestion && (
        <div className="editor-form-overlay" onClick={handleCancelEdit}>
          <div className="editor-form-panel" onClick={(e) => e.stopPropagation()}>
            <QuestionForm
              key={editingQuestion.id}
              question={editingQuestion}
              allQuestions={questions}
              onSave={handleSave}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
