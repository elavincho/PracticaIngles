import express from 'express';
import { checkDbConnection } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import vocabRoutes from './routes/vocabRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

app.use(express.json());

// Set X-DB-Connected header on all responses
app.use((req, res, next) => {
  const connected = checkDbConnection();
  res.setHeader('X-DB-Connected', connected ? 'true' : 'false');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  const connected = checkDbConnection();
  res.json({
    status: connected ? 'ok' : 'db_disconnected',
    dbConnected: connected,
    message: connected
      ? 'Base de datos conectada correctamente (MongoDB).'
      : 'Base de datos no conectada.',
    service: 'English A1 Vocab Master API'
  });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    message: err.message || 'Error interno del servidor',
    success: false
  });
});

export default app;
