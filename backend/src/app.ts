import express from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { router } from './routes/index.js';
import cors from 'cors';
import { env } from './config/env.js';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(router);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;
