import { useEffect, useState } from 'react';
import { getUsers } from './api.js';
import UserSwitcher from './components/UserSwitcher.jsx';
import ClientView from './components/ClientView.jsx';
import AdminView from './components/AdminView.jsx';

const STORAGE_KEY = 'hellotree.demoUserId';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsers()
      .then((loaded) => {
        setUsers(loaded);
        const remembered = Number(localStorage.getItem(STORAGE_KEY));
        const stillExists = loaded.some((user) => user.id === remembered);
        setCurrentUserId(stillExists ? remembered : (loaded[0]?.id ?? null));
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  function switchUser(id) {
    setCurrentUserId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }

  const currentUser = users.find((user) => user.id === currentUserId) ?? null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Maintenance Requests</h1>
        <UserSwitcher
          users={users}
          currentUserId={currentUserId}
          onChange={switchUser}
        />
      </header>

      <main>
        {error && <p className="error">{error}</p>}

        {!error && !currentUser && <p className="muted">Loading…</p>}

        {currentUser?.role === 'client' && <ClientView user={currentUser} />}
        {currentUser?.role === 'admin' && <AdminView user={currentUser} clients={users.filter((u) => u.role === 'client')} />}
      </main>
    </div>
  );
}
