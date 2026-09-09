import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin, requireClient } from '../identity.js';
import {
  STALE_NEW_HOURS,
  STATUSES,
  checkTransition,
  validateNewRequest,
} from '../rules.js';

const router = Router();

// The 24-hour flag is computed here, in SQL, rather than in the browser: the
// rule then has exactly one definition and every caller of the API sees it.
const SELECT_COLUMNS = `
  r.id,
  r.client_id,
  u.name AS client_name,
  r.title,
  r.description,
  r.priority,
  r.status,
  r.resolution_note,
  r.created_at,
  r.updated_at,
  (r.priority = 'urgent'
   AND r.status = 'new'
   AND r.created_at < now() - make_interval(hours => $1)) AS is_stale
`;

/**
 * GET /api/requests
 * A client sees only their own requests. An admin sees all of them and may
 * filter by status and by client.
 */
router.get('/', async (req, res) => {
  const params = [STALE_NEW_HOURS];
  const where = [];

  if (req.actor.role === 'client') {
    // Scoped in the query, not filtered after the fact: a client's own id is
    // the only client_id the database is ever asked for.
    params.push(req.actor.id);
    where.push(`r.client_id = $${params.length}`);
  } else {
    const { status, client_id: clientId } = req.query;

    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_STATUS_FILTER',
            message: `Status filter must be one of: ${STATUSES.join(', ')}.`,
          },
        });
      }
      params.push(status);
      where.push(`r.status = $${params.length}`);
    }

    if (clientId !== undefined) {
      const id = Number(clientId);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CLIENT_FILTER',
            message: 'client_id filter must be a positive integer.',
          },
        });
      }
      params.push(id);
      where.push(`r.client_id = $${params.length}`);
    }
  }

  const { rows } = await pool.query(
    `SELECT ${SELECT_COLUMNS}
     FROM requests r
     JOIN users u ON u.id = r.client_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY r.created_at DESC`,
    params
  );

  res.json(rows);
});

/**
 * POST /api/requests
 * Clients only. The owner is taken from the identity, never from the body.
 */
router.post('/', requireClient, async (req, res) => {
  const check = validateNewRequest(req.body);
  if (!check.ok) {
    return res
      .status(422)
      .json({ error: { code: check.code, message: check.message } });
  }

  const { title, description, priority } = check.value;
  const { rows } = await pool.query(
    `INSERT INTO requests (client_id, title, description, priority)
     VALUES ($1, $2, $3, $4)
     RETURNING id, client_id, title, description, priority, status,
               resolution_note, created_at, updated_at`,
    [req.actor.id, title, description, priority]
  );

  res.status(201).json(rows[0]);
});

/**
 * PATCH /api/requests/:id/status
 * Admins only. Enforces the forward-only transitions and the resolution note.
 */
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'No such request.' } });
  }

  const { status: nextStatus, resolution_note: resolutionNote } = req.body ?? {};

  const existing = await pool.query('SELECT status FROM requests WHERE id = $1', [
    id,
  ]);
  if (existing.rows.length === 0) {
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'No such request.' } });
  }

  const check = checkTransition(
    existing.rows[0].status,
    nextStatus,
    resolutionNote
  );
  if (!check.ok) {
    // Nothing has been written: the request is left exactly as it was.
    return res
      .status(422)
      .json({ error: { code: check.code, message: check.message } });
  }

  // `AND status = $4` makes this safe against a concurrent update slipping in
  // between the read above and this write, without needing a transaction.
  const { rows } = await pool.query(
    `UPDATE requests
     SET status = $1,
         resolution_note = COALESCE($2, resolution_note),
         updated_at = now()
     WHERE id = $3 AND status = $4
     RETURNING id, client_id, title, description, priority, status,
               resolution_note, created_at, updated_at`,
    [nextStatus, resolutionNote ?? null, id, existing.rows[0].status]
  );

  if (rows.length === 0) {
    return res.status(409).json({
      error: {
        code: 'CONCURRENT_UPDATE',
        message: 'The request changed while you were updating it. Reload and try again.',
      },
    });
  }

  res.json(rows[0]);
});

export default router;
