import type { Env } from '../types';
import { handleAuth, verifyToken } from './auth';
import { handleListEmails, handleGetEmail, handleToggleRead } from './emails';

const ALLOWED_ORIGINS = '*'; // MVP uses catch-all; tighten in production

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function corsResponse(response: Response): Response {
  const headers = corsHeaders();
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, v);
  }
  return response;
}

async function authenticate(request: Request, env: Env): Promise<Response | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return corsResponse(Response.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const token = authHeader.slice(7);
  const valid = await verifyToken(token, env.AUTH_SECRET);
  if (!valid) {
    return corsResponse(Response.json({ error: 'Invalid or expired token' }, { status: 401 }));
  }

  return null; // authenticated
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    return corsResponse(new Response(null, { status: 204 }));
  }

  // POST /api/auth
  if (path === '/api/auth' && method === 'POST') {
    return corsResponse(await handleAuth(request, env));
  }

  // Auth required for all other API routes
  const authError = await authenticate(request, env);
  if (authError) return authError;

  // GET /api/emails
  if (path === '/api/emails' && method === 'GET') {
    return corsResponse(await handleListEmails(request, env));
  }

  // PUT /api/emails/:id/read  (must check BEFORE the id-only pattern)
  const readMatch = path.match(/^\/api\/emails\/(\d+)\/read$/);
  if (readMatch && method === 'PUT') {
    return corsResponse(await handleToggleRead(parseInt(readMatch[1]), request, env));
  }

  // GET /api/emails/:id
  const detailMatch = path.match(/^\/api\/emails\/(\d+)$/);
  if (detailMatch && method === 'GET') {
    return corsResponse(await handleGetEmail(parseInt(detailMatch[1]), env));
  }

  return corsResponse(Response.json({ error: 'Not found' }, { status: 404 }));
}
