import express from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { router } from './routes/index.js';

const app = express();

app.use(express.json());
app.use(router);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;
