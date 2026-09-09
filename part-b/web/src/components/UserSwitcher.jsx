/**
 * Stands in for logging in. Picking a name here only changes which id is sent
 * as X-Demo-User; the server decides what that identity can do.
 */
export default function UserSwitcher({ users, currentUserId, onChange }) {
  return (
    <label className="user-switcher">
      Viewing as
      <select
        value={currentUserId ?? ''}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
    </label>
  );
}
