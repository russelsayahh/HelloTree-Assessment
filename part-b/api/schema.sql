
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id   serial PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('client', 'admin'))
);

CREATE TABLE requests (
  id              serial PRIMARY KEY,
  
  client_id       integer NOT NULL REFERENCES users(id),
  title           text NOT NULL,
  description     text NOT NULL,
  priority        text NOT NULL CHECK (priority IN ('low', 'normal', 'urgent')),
  status          text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  resolution_note text,
  
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  
  CONSTRAINT done_requires_resolution_note CHECK (
    status <> 'done' OR (resolution_note IS NOT NULL AND btrim(resolution_note) <> '')
  )
);

CREATE INDEX requests_client_id_idx ON requests (client_id);
CREATE INDEX requests_status_idx ON requests (status);
