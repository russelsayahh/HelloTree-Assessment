import 'dotenv/config';
import pg from 'pg';

// Vitest sets NODE_ENV=test, so the suite talks to its own database and can
// drop and reseed freely without touching the one used by `npm run dev`.
const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'No database connection string. Copy .env.example to .env and set DATABASE_URL (and DATABASE_URL_TEST to run the tests).'
  );
}

export const pool = new pg.Pool({ connectionString });
