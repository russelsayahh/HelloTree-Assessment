import { useCallback, useEffect, useState } from 'react';
import { getRequests } from '../api.js';
import RequestsTable from './RequestsTable.jsx';

export default function AdminView({ user, clients }) {
  const [filters, setFilters] = useState({ status: '', clientId: '' });
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  // Filtering happens in the API query, not in the browser.
  const load = useCallback(() => {
    getRequests(user.id, filters)
      .then(setRequests)
      .catch((loadError) => setError(loadError.message));
  }, [user.id, filters]);

  useEffect(load, [load]);

  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  const flagged = requests.filter((request) => request.is_stale).length;

  return (
    <section className="card">
      <div className="admin-header">
        <h2>All requests</h2>
        {flagged > 0 && (
          <p className="flag-summary">
            {flagged} urgent {flagged === 1 ? 'request has' : 'requests have'} been
            waiting in New for over 24 hours
          </p>
        )}
      </div>

      <div className="filters">
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => update('status', event.target.value)}
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>

        <label>
          Client
          <select
            value={filters.clientId}
            onChange={(event) => update('clientId', event.target.value)}
          >
            <option value="">All</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <RequestsTable
        user={user}
        requests={requests}
        onChanged={load}
        onError={setError}
      />
    </section>
  );
}
