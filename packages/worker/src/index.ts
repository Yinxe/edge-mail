import type { ExportedHandler } from '@cloudflare/workers-types';
import type { Env } from './types';
import { handleEmail } from './email-handler';
import { handleRequest } from './api/router';

export default {
  async email(message, env, _ctx): Promise<void> {
    await handleEmail(message, env as unknown as Env);
  },

  async fetch(request, env, _ctx): Promise<Response> {
    return handleRequest(request, env as unknown as Env);
  },
} satisfies ExportedHandler<Env>;
