import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../src/db.js';

const here = dirname(fileURLToPath(import.meta.url));

const USERS = [
  { name: 'Acme Retail', role: 'client' },
  { name: 'Cedar Bank', role: 'client' },
  { name: 'Olive Media', role: 'client' },
  { name: 'Hellotree Admin', role: 'admin' },
];

const REQUESTS = [
  {
    client: 'Acme Retail',
    title: 'Checkout fails with a 500 on card payment',
    description:
      'Customers get an error page after entering card details. Started this morning, affects all card payments.',
    priority: 'urgent',
    status: 'new',
    ageHours: 74, // urgent + new + over 24h -> flagged
  },
  {
    client: 'Cedar Bank',
    title: 'Statement PDFs download empty',
    description:
      'Downloaded statements are 0 KB. Reproduced on Chrome and Edge for three different accounts.',
    priority: 'urgent',
    status: 'new',
    ageHours: 30, // urgent + new + over 24h -> flagged
  },
  {
    client: 'Olive Media',
    title: 'Homepage video does not autoplay on Safari',
    description:
      'The hero video shows a black frame on Safari 17. Works on Chrome and Firefox.',
    priority: 'urgent',
    status: 'new',
    ageHours: 2, // urgent + new but under 24h -> NOT flagged
  },
  {
    client: 'Acme Retail',
    title: 'Stock levels out of date in the product grid',
    description:
      'The grid shows yesterday evening figures. The nightly sync appears to run but the numbers do not move.',
    priority: 'urgent',
    status: 'in_progress',
    ageHours: 96, // urgent and old, but no longer new -> NOT flagged
  },
  {
    client: 'Acme Retail',
    title: 'Add a delivery note field to the order form',
    description:
      'Customers keep asking for a free-text field for delivery instructions at checkout.',
    priority: 'normal',
    status: 'new',
    ageHours: 50, // old and new, but not urgent -> NOT flagged
  },
  {
    client: 'Cedar Bank',
    title: 'Branch finder map pins are offset',
    description:
      'Pins on the branch finder sit roughly 200 metres from the actual address.',
    priority: 'normal',
    status: 'in_progress',
    ageHours: 40,
  },
  {
    client: 'Olive Media',
    title: 'Newsletter signup confirmation wording',
    description:
      'Please change the confirmation message to match the new brand tone of voice.',
    priority: 'low',
    status: 'new',
    ageHours: 8,
  },
  {
    client: 'Cedar Bank',
    title: 'Add Arabic to the language switcher',
    description:
      'Arabic translations are ready in the sheet we shared. Please wire them into the switcher.',
    priority: 'low',
    status: 'new',
    ageHours: 5,
  },
  {
    client: 'Olive Media',
    title: 'Article scheduling drops the timezone',
    description:
      'Articles scheduled for 09:00 publish at 07:00. Editors are in Beirut.',
    priority: 'normal',
    status: 'in_progress',
    ageHours: 60,
  },
  {
    client: 'Acme Retail',
    title: 'Footer copyright year is stale',
    description: 'The footer still shows last year.',
    priority: 'low',
    status: 'done',
    resolution_note:
      'Replaced the hardcoded year with a dynamic one. Verified on staging and production.',
    ageHours: 200,
  },
  {
    client: 'Cedar Bank',
    title: 'Login page unreachable from the mobile app',
    description:
      'The in-app browser could not open the login page for about an hour on Tuesday.',
    priority: 'urgent',
    status: 'done',
    resolution_note:
      'Expired TLS certificate on the auth subdomain. Renewed and added an expiry alert 30 days out.',
    ageHours: 300,
  },
  {
    client: 'Olive Media',
    title: 'Image uploads over 5 MB are rejected',
    description:
      'The photo desk cannot upload full-resolution images; the upload fails silently.',
    priority: 'normal',
    status: 'done',
    resolution_note:
      'Raised the upload limit to 25 MB and added a clear error message when the limit is exceeded.',
    ageHours: 120,
  },
];

async function seed() {
  const schema = await readFile(join(here, '..', 'schema.sql'), 'utf8');
  await pool.query(schema);

  const idsByName = new Map();
  for (const user of USERS) {
    const { rows } = await pool.query(
      'INSERT INTO users (name, role) VALUES ($1, $2) RETURNING id',
      [user.name, user.role]
    );
    idsByName.set(user.name, rows[0].id);
  }

  for (const request of REQUESTS) {
    await pool.query(
      `INSERT INTO requests
         (client_id, title, description, priority, status, resolution_note,
          created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6,
               now() - make_interval(hours => $7),
               now() - make_interval(hours => $7))`,
      [
        idsByName.get(request.client),
        request.title,
        request.description,
        request.priority,
        request.status,
        request.resolution_note ?? null,
        request.ageHours,
      ]
    );
  }

  return { users: USERS.length, requests: REQUESTS.length };
}

/** Used by the test suite to get a known database before each run. */
export async function resetAndSeed() {
  return seed();
}

// True when run as `node scripts/seed.js`, false when imported by the tests.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    const counts = await seed();
    console.log(
      `Database reset: ${counts.users} users, ${counts.requests} requests.`
    );
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
