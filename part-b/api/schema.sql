-- Hellotree maintenance request tracker (Part B)
-- Applied by `npm run db:reset`, which drops and recreates everything.

DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS users;

-- Demo identities. There is no real authentication (see README): every API call
-- carries `X-Demo-User: <user id>` and the server looks the role up here. The
-- frontend can say who it is, never what it is allowed to do.
CREATE TABLE users (
  id   serial PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('client', 'admin'))
);

CREATE TABLE requests (
  id              serial PRIMARY KEY,
  -- The owning client: always a users row with role 'client'. The API sets this
  -- from the authenticated actor and never reads it from the request body.
  client_id       integer NOT NULL REFERENCES users(id),
  title           text NOT NULL,
  description     text NOT NULL,
  priority        text NOT NULL CHECK (priority IN ('low', 'normal', 'urgent')),
  status          text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  resolution_note text,
  -- Statuses only ever move forward, so 'new' is only ever the initial state:
  -- a request sitting in 'new' has been there since it was created. That makes
  -- created_at the correct clock for the 24-hour urgent flag, and means no
  -- status_changed_at column is needed.
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Business rule, enforced in the database as well as in src/rules.js so that
  -- it holds even for SQL written by hand.
  CONSTRAINT done_requires_resolution_note CHECK (
    status <> 'done' OR (resolution_note IS NOT NULL AND btrim(resolution_note) <> '')
  )
);

CREATE INDEX requests_client_id_idx ON requests (client_id);
CREATE INDEX requests_status_idx ON requests (status);
