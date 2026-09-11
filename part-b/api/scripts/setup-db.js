import 'dotenv/config';
import pg from 'pg';

function adminConnectionString(connectionString) {
  const url = new URL(connectionString);
  url.pathname = '/postgres';
  return url.toString();
}

async function ensureDatabase(adminClient, dbName) {
  const { rowCount } = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );
  if (rowCount > 0) {
    console.log(`Database "${dbName}" already exists.`);
    return;
  }
  
  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  console.log(`Created database "${dbName}".`);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'No database connection string. Copy .env.example to .env and set DATABASE_URL first.'
  );
}

const targetDbNames = [
  ...new Set(
    [process.env.DATABASE_URL, process.env.DATABASE_URL_TEST]
      .filter(Boolean)
      .map((connectionString) => new URL(connectionString).pathname.slice(1))
  ),
];

const adminClient = new pg.Client({
  connectionString: adminConnectionString(process.env.DATABASE_URL),
});

await adminClient.connect();
try {
  for (const dbName of targetDbNames) {
    await ensureDatabase(adminClient, dbName);
  }
} finally {
  await adminClient.end();
}
