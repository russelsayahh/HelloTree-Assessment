const STATUS_LABELS = {
  new: 'New',
  in_progress: 'In Progress',
  done: 'Done',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge status-${status}`}>{STATUS_LABELS[status]}</span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge priority-${priority}`}>{priority}</span>
  );
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
