import StatusActions from './StatusActions.jsx';
import { PriorityBadge, StatusBadge, formatDate } from './StatusBadge.jsx';

export default function RequestsTable({ user, requests, onChanged, onError }) {
  if (requests.length === 0) {
    return <p className="muted">No requests match these filters.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Request</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            // is_stale is computed by the API, not here, so the 24-hour rule
            // has one definition.
            <tr key={request.id} className={request.is_stale ? 'stale' : undefined}>
              <td>{request.client_name}</td>
              <td>
                <strong>{request.title}</strong>
                {request.is_stale && (
                  <span className="flag" title="Urgent and in New for over 24 hours">
                    ⚠ Overdue
                  </span>
                )}
                <p className="muted">{request.description}</p>
                {request.resolution_note && (
                  <p className="resolution">
                    <strong>Resolution:</strong> {request.resolution_note}
                  </p>
                )}
              </td>
              <td>
                <PriorityBadge priority={request.priority} />
              </td>
              <td>
                <StatusBadge status={request.status} />
              </td>
              <td className="muted nowrap">{formatDate(request.created_at)}</td>
              <td>
                <StatusActions
                  user={user}
                  request={request}
                  onChanged={onChanged}
                  onError={onError}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
