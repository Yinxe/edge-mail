import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '../shared/types';
import { handleAuth, authMiddleware } from '../auth/api';
import { handleListEmails, handleGetEmail, handleToggleRead, handleDeleteEmail } from '../emails/api';
import { handleGetAllSettings, handleGetSettings, handleUpdateSettings } from '../settings/api';

type App = { Bindings: Env };

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
