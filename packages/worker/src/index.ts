import type { Env } from './shared/types';
import { handleEmail } from './emails/handler';
import app from './api/router';

// Workers runtime types conflict with lib types at the entry boundary;
// use `any` for handler parameters and cast internally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default {
  async email(message: any, env: any, _ctx: any): Promise<void> {
    await handleEmail(message, env as unknown as Env);
  },

  async fetch(request: any, env: any, ctx: any): Promise<Response> {
    return app.fetch(request, env as unknown as Env, ctx);
  },
};
