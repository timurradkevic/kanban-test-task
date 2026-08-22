import express from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { router } from './routes/index.js';
import cors from 'cors';
import { env } from './config/env.js';
import { boardRouter } from './routes/board.route.js';
import { taskRouter } from './routes/task.route.js';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use('/health', router);
app.use('/boards', boardRouter);
app.use('/columns/:columnId/tasks', taskRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;
