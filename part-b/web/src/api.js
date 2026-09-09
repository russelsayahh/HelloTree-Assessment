/**
 * Thin wrapper around fetch.
 *
 * Every authenticated call takes the current demo user id explicitly and sends
 * it as X-Demo-User. The server looks the role up in the database, so nothing
 * here decides what the user is allowed to do.
 */

async function call(userId, path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'X-Demo-User': String(userId) } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // Surface the server's message: the business rules live there, and their
    // wording is what the user needs to see.
    throw new Error(body?.error?.message ?? `Request failed (${response.status}).`);
  }

  return body;
}

/** The demo identities. Public, because the switcher runs before we have one. */
export function getUsers() {
  return call(null, '/users');
}

export function getRequests(userId, filters = {}) {
  const query = new URLSearchParams();
  if (filters.status) query.set('status', filters.status);
  if (filters.clientId) query.set('client_id', filters.clientId);
  const suffix = query.toString() ? `?${query}` : '';
  return call(userId, `/requests${suffix}`);
}

export function createRequest(userId, data) {
  return call(userId, '/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateStatus(userId, requestId, data) {
  return call(userId, `/requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
