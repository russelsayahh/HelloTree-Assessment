import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Powers the demo user switcher in the UI, so the frontend does not need a
// hardcoded list of ids. Deliberately public: it exposes nothing but the demo
// identities themselves, and it is what you would replace with a login screen.
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, role FROM users ORDER BY role DESC, id'
  );
  res.json(rows);
});

export default router;
