import { useState } from 'react';
import { updateStatus } from '../api.js';

/**
 * The status controls for one row. Only the next legal status is offered, but
 * the API is the thing that enforces that -- this just avoids showing buttons
 * that would be rejected.
 */
export default function StatusActions({ user, request, onChanged, onError }) {
  const [completing, setCompleting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function move(status, resolutionNote) {
    setBusy(true);
    onError(null);
    try {
      await updateStatus(user.id, request.id, {
        status,
        ...(resolutionNote === undefined ? {} : { resolution_note: resolutionNote }),
      });
      setCompleting(false);
      setNote('');
      onChanged();
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (request.status === 'done') {
    return <span className="muted">—</span>;
  }

  if (request.status === 'new') {
    return (
      <button disabled={busy} onClick={() => move('in_progress')}>
        Start
      </button>
    );
  }

  if (!completing) {
    return <button onClick={() => setCompleting(true)}>Complete…</button>;
  }

  return (
    <div className="complete-form">
      <textarea
        rows={3}
        placeholder="Resolution note (required)"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="complete-actions">
        <button disabled={busy} onClick={() => move('done', note)}>
          Mark done
        </button>
        <button
          className="secondary"
          onClick={() => {
            setCompleting(false);
            setNote('');
            onError(null);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
