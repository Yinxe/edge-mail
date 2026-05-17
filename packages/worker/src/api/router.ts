import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';
import type { Env } from '../types';
import { handleAuth, verifyToken } from './auth';
import { handleListEmails, handleGetEmail, handleToggleRead, handleDeleteEmail } from './emails';
import { handleGetAllSettings, handleGetSettings, handleUpdateSettings } from '../settings/api';

type App = { Bindings: Env };

const authMiddleware = createMiddleware<App>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const valid = await verifyToken(authHeader.slice(7), c.env.AUTH_SECRET);
  if (!valid) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  await next();
});

const app = new Hono<App>();

// CORS — applies to all /api/* paths including preflight
app.use('/api/*', cors({
  origin: (origin, c) => (c as unknown as { env: Env }).env.ALLOWED_ORIGINS || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Public routes
app.post('/api/auth', handleAuth);

// Protected routes
app.get('/api/emails', authMiddleware, handleListEmails);
app.get('/api/emails/:id', authMiddleware, handleGetEmail);
app.put('/api/emails/:id/read', authMiddleware, handleToggleRead);
app.delete('/api/emails/:id', authMiddleware, handleDeleteEmail);

// Settings routes (protected)
app.get('/api/settings', authMiddleware, handleGetAllSettings);
app.get('/api/settings/:group', authMiddleware, handleGetSettings);
app.put('/api/settings/:group', authMiddleware, handleUpdateSettings);

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

export { app };
export default app;
