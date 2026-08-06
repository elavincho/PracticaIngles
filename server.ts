import dotenv from 'dotenv';

dotenv.config({ override: true });

import express from 'express';
import app from './backend/app.js';
import connectDB from './backend/config/db.js';

const PORT = 3000;

// Production static or Vite integration
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req: express.Request, res: express.Response) => {
    res.sendFile('dist/index.html', { root: '.' });
  });
} else {
  // Dynamic Vite dev server middleware setup
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

// Connect to DB (with memory fallback) and start server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express Backend] Server running on port ${PORT}`);
  });
});

