import { Link } from 'react-router-dom';

export default function Help() {
  return (
    <div className="help-page">
      <h2>How to Use</h2>

      <section className="help-section">
        <h3>Creating a Packing List</h3>
        <ol>
          <li>Click <strong>Pack</strong> in the navigation bar to start.</li>
          <li>Answer each question about your trip — activities, weather, duration, and more.</li>
          <li>Use <strong>Back</strong> and <strong>Next</strong> to navigate between questions. For multi-select questions, pick all that apply then press <strong>Next</strong>.</li>
          <li>When you're done, a personalised packing list is generated based on your answers.</li>
        </ol>
      </section>

      <section className="help-section">
        <h3>Using the Packing List</h3>
        <ul>
          <li>Items are grouped by category (e.g. Clothing, Cooking, Navigation).</li>
          <li>Tick items off as you pack them — checked items turn green with a strikethrough.</li>
          <li>Use <strong>Print List</strong> to print or save a PDF of your list.</li>
          <li>Click <strong>Change Answers</strong> to go back and adjust your trip details.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>How Matching Works</h3>
        <ul>
          <li>Items marked as <strong>always</strong> are included on every trip.</li>
          <li>Other items are included when your trip answers match the item's conditions.</li>
          <li>If you skip a question, items that require a specific answer for that field won't be included.</li>
          <li>Single-day trips automatically skip questions about accommodation, sleeping arrangements, location, and cooking.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>Gear Editor</h3>
        <ul>
          <li>Click <strong>Gear Editor</strong> in the navigation bar to view and edit all gear items.</li>
          <li>Click any item to edit its name, category, and conditions.</li>
          <li>Use <strong>+ Add Item</strong> on a category card to add a new item to that category.</li>
          <li>When editing conditions, you can add new values (e.g. a new activity) — these will appear as options throughout the app.</li>
          <li>Use <strong>Export JSON</strong> to download your gear data. Replace the file in the repo and push to update the live app.</li>
        </ul>
      </section>

      <div className="help-back">
        <Link to="/" className="btn btn-primary">Back to App</Link>
      </div>
    </div>
  );
}
