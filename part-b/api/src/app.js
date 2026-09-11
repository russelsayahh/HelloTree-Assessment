import express from 'express';
import cors from 'cors';
import { identify } from './identity.js';
import requestsRouter from './routes/requests.js';
import usersRouter from './routes/users.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/users', usersRouter);

  app.use('/api/requests', identify, requestsRouter);

  app.use((_req, res) => {
    res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'No such endpoint.' } });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
    });
  });

  return app;
}
