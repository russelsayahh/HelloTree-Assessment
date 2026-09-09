import { useState } from 'react';
import { createRequest } from '../api.js';

const EMPTY = { title: '', description: '', priority: 'normal' };

export default function NewRequestForm({ user, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createRequest(user.id, form);
      setForm(EMPTY);
      onCreated();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Submit a request</h2>

      <label>
        Title
        <input
          value={form.title}
          onChange={(event) => update('title', event.target.value)}
        />
      </label>

      <label>
        Description
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </label>

      <label>
        Priority
        <select
          value={form.priority}
          onChange={(event) => update('priority', event.target.value)}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </select>
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={saving}>
        {saving ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  );
}
