import { pool } from './db.js';

/**
 * Demo stand-in for authentication.
 *
 * Every call carries `X-Demo-User: <user id>`. We look that id up in the
 * database and take the role from the row we find. The frontend therefore says
 * only *who* it is; what that identity may do is decided here, from the
 * database. In a real system this middleware is the only piece that would be
 * replaced (with session or token verification) -- the routes stay as they are.
 */
export async function identify(req, res, next) {
  const header = req.get('X-Demo-User');

  if (!header) {
    return res.status(401).json({
      error: { code: 'NO_IDENTITY', message: 'Missing X-Demo-User header.' },
    });
  }

  const id = Number(header);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: {
        code: 'BAD_IDENTITY',
        message: 'X-Demo-User must be a positive integer user id.',
      },
    });
  }

  const { rows } = await pool.query(
    'SELECT id, name, role FROM users WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    return res.status(401).json({
      error: { code: 'UNKNOWN_USER', message: `No user with id ${id}.` },
    });
  }

  req.actor = rows[0];
  next();
}

export function requireAdmin(req, res, next) {
  if (req.actor.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'ADMIN_ONLY',
        message: 'Only an admin can perform this action.',
      },
    });
  }
  next();
}

export function requireClient(req, res, next) {
  if (req.actor.role !== 'client') {
    return res.status(403).json({
      error: {
        code: 'CLIENT_ONLY',
        message: 'Only a client can submit a request.',
      },
    });
  }
  next();
}
