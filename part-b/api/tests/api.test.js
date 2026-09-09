/**
 * API tests. These cover the three business rules and the authorization that
 * makes them meaningful -- not CRUD happy paths for their own sake.
 *
 * Requires DATABASE_URL_TEST in .env pointing at a database you are happy to
 * drop: the suite resets and reseeds it before every test.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db.js';
import { resetAndSeed } from '../scripts/seed.js';

const app = createApp();

let ACME;
let CEDAR;
let ADMIN;

const as = (user) => ({ 'X-Demo-User': String(user) });

/** Finds a seeded request by its title. */
async function findRequest(title) {
  const { rows } = await pool.query(
    'SELECT id, status, resolution_note FROM requests WHERE title = $1',
    [title]
  );
  return rows[0];
}

beforeAll(async () => {
  await resetAndSeed();
  const { rows } = await pool.query('SELECT id, name FROM users');
  const byName = Object.fromEntries(rows.map((r) => [r.name, r.id]));
  ACME = byName['Acme Retail'];
  CEDAR = byName['Cedar Bank'];
  ADMIN = byName['Hellotree Admin'];
});

beforeEach(async () => {
  await resetAndSeed();
});

afterAll(async () => {
  await pool.end();
});

describe('identity', () => {
  it('rejects a call with no X-Demo-User header', async () => {
    const res = await request(app).get('/api/requests');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NO_IDENTITY');
  });

  it('rejects an unknown user id', async () => {
    const res = await request(app).get('/api/requests').set(as(9999));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNKNOWN_USER');
  });
});

describe('business rule: statuses only move forward', () => {
  it('rejects new -> done', async () => {
    const target = await findRequest('Checkout fails with a 500 on card payment');
    const res = await request(app)
      .patch(`/api/requests/${target.id}/status`)
      .set(as(ADMIN))
      .send({ status: 'done', resolution_note: 'All sorted.' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ILLEGAL_TRANSITION');

    const after = await findRequest('Checkout fails with a 500 on card payment');
    expect(after.status).toBe('new');
  });

  it('rejects done -> in_progress', async () => {
    const target = await findRequest('Footer copyright year is stale');
    const res = await request(app)
      .patch(`/api/requests/${target.id}/status`)
      .set(as(ADMIN))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ILLEGAL_TRANSITION');
  });

  it('allows new -> in_progress -> done with a note', async () => {
    const target = await findRequest('Checkout fails with a 500 on card payment');

    const started = await request(app)
      .patch(`/api/requests/${target.id}/status`)
      .set(as(ADMIN))
      .send({ status: 'in_progress' });
    expect(started.status).toBe(200);
    expect(started.body.status).toBe('in_progress');

    const finished = await request(app)
      .patch(`/api/requests/${target.id}/status`)
      .set(as(ADMIN))
      .send({ status: 'done', resolution_note: 'Rolled back the payment SDK.' });
    expect(finished.status).toBe(200);
    expect(finished.body.status).toBe('done');
    expect(finished.body.resolution_note).toBe('Rolled back the payment SDK.');
  });
});

describe('business rule: done requires a resolution note', () => {
  it('rejects completing with no note and leaves the request untouched', async () => {
    const target = await findRequest('Branch finder map pins are offset');
    expect(target.status).toBe('in_progress');

    const res = await request(app)
      .patch(`/api/requests/${target.id}/status`)
      .set(as(ADMIN))
      .send({ status: 'done' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RESOLUTION_NOTE_REQUIRED');

    const after = await findRequest('Branch finder map pins are offset');
    expect(after.status).toBe('in_progress');
    expect(after.resolution_note).toBeNull();
  });

  it('rejects a whitespace-only note', async () => {
    const target = await findRequest('Branch finder map pins are offset');
    const res = await request(app)
      .patch(`/api/requests/${target.id}/status`)
      .set(as(ADMIN))
      .send({ status: 'done', resolution_note: '    ' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RESOLUTION_NOTE_REQUIRED');
  });
});

describe('business rule: urgent requests stuck in new are flagged', () => {
  it('flags urgent + new older than 24 hours, and nothing else', async () => {
    const res = await request(app).get('/api/requests').set(as(ADMIN));
    expect(res.status).toBe(200);

    const byTitle = Object.fromEntries(res.body.map((r) => [r.title, r]));

    // Urgent, still new, 74h and 30h old.
    expect(byTitle['Checkout fails with a 500 on card payment'].is_stale).toBe(true);
    expect(byTitle['Statement PDFs download empty'].is_stale).toBe(true);

    // Urgent and new, but only 2h old.
    expect(byTitle['Homepage video does not autoplay on Safari'].is_stale).toBe(false);
    // Urgent and 96h old, but no longer new.
    expect(byTitle['Stock levels out of date in the product grid'].is_stale).toBe(false);
    // 50h old and still new, but not urgent.
    expect(byTitle['Add a delivery note field to the order form'].is_stale).toBe(false);
  });
});

describe('authorization', () => {
  it('shows a client only their own requests', async () => {
    const res = await request(app).get('/api/requests').set(as(ACME));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((r) => r.client_id === ACME)).toBe(true);
  });

  it('ignores a client trying to filter their way to another client', async () => {
    const res = await request(app)
      .get(`/api/requests?client_id=${CEDAR}`)
      .set(as(ACME));
    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.client_id === ACME)).toBe(true);
  });

  it('refuses to let a client change a status', async () => {
    const target = await findRequest('Checkout fails with a 500 on card payment');
    const res = await request(app)
      .patch(`/api/requests/${target.id}/status`)
      .set(as(ACME))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ADMIN_ONLY');
  });

  it('refuses to let an admin submit a request as a client', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set(as(ADMIN))
      .send({ title: 'x', description: 'y', priority: 'low' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CLIENT_ONLY');
  });
});

describe('submitting a request', () => {
  it('creates the request against the caller, ignoring any client_id in the body', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set(as(ACME))
      .send({
        title: 'Search returns no results',
        description: 'The site search has been empty since this morning.',
        priority: 'urgent',
        client_id: CEDAR, // must be ignored
      });

    expect(res.status).toBe(201);
    expect(res.body.client_id).toBe(ACME);
    expect(res.body.status).toBe('new');
  });

  it('rejects a priority outside low, normal and urgent', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set(as(ACME))
      .send({ title: 'x', description: 'y', priority: 'critical' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_PRIORITY');
  });
});

describe('admin filtering', () => {
  it('filters by status', async () => {
    const res = await request(app).get('/api/requests?status=done').set(as(ADMIN));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((r) => r.status === 'done')).toBe(true);
  });

  it('filters by client', async () => {
    const res = await request(app)
      .get(`/api/requests?client_id=${CEDAR}`)
      .set(as(ADMIN));
    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.client_id === CEDAR)).toBe(true);
  });

  it('rejects a status filter it does not recognise', async () => {
    const res = await request(app)
      .get('/api/requests?status=archived')
      .set(as(ADMIN));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_FILTER');
  });
});
