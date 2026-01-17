// src/index.ts

import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.routes';
import auditLogRoutes from './routes/auditLog.routes';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      'https://bug-free-winner-65x6q44gqv6hxxqw-3000.app.github.dev',
      'http://localhost:3000',
    ],
  }),
);

app.use(express.json());

app.use('/tasks', taskRoutes);
app.use(auditLogRoutes);

app.get('/health', (_, res) => res.send('OK'));

app.listen(3001, () => {
	console.log('Server running on http://localhost:3001');
});
