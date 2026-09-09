import { useCallback, useEffect, useState } from 'react';
import { getRequests } from '../api.js';
import NewRequestForm from './NewRequestForm.jsx';
import { PriorityBadge, StatusBadge, formatDate } from './StatusBadge.jsx';

export default function ClientView({ user }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  // The server scopes this to the caller, so there is no client filter to send.
  const load = useCallback(() => {
    getRequests(user.id)
      .then(setRequests)
      .catch((loadError) => setError(loadError.message));
  }, [user.id]);

  useEffect(load, [load]);

  return (
    <div className="two-column">
      <NewRequestForm user={user} onCreated={load} />

      <section className="card">
        <h2>My requests</h2>
        {error && <p className="error">{error}</p>}
        {requests.length === 0 && !error && (
          <p className="muted">No requests yet.</p>
        )}

        <ul className="request-list">
          {requests.map((request) => (
            <li key={request.id}>
              <div className="request-list-head">
                <strong>{request.title}</strong>
                <StatusBadge status={request.status} />
              </div>
              <p className="muted">{request.description}</p>
              <div className="request-list-meta">
                <PriorityBadge priority={request.priority} />
                <span className="muted">
                  Submitted {formatDate(request.created_at)}
                </span>
              </div>
              {request.resolution_note && (
                <p className="resolution">
                  <strong>Resolution:</strong> {request.resolution_note}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
