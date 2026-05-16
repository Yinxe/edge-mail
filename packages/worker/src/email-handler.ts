import PostalMime from 'postal-mime';
import type { ForwardableEmailMessage } from '@cloudflare/workers-types';
import type { Env } from './types';
import { insertEmail } from './db';

const HEADER_KEYS = [
  'message-id', 'date', 'content-type', 'in-reply-to',
  'references', 'reply-to', 'cc', 'bcc', 'return-path',
];

export async function handleEmail(
  message: ForwardableEmailMessage,
  env: Env,
): Promise<void> {
  // Buffer raw (single-use stream); Workers runtime accepts ReadableStream as BodyInit
  const rawBuffer = await new Response(message.raw as BodyInit).arrayBuffer();
  const parsed = await PostalMime.parse(rawBuffer);

  const messageId = message.headers.get('message-id') || '';
  const sender = message.from;
  const recipient = message.to;
  const subject = parsed.subject || '(no subject)';
  const textBody = parsed.text || null;
  const htmlBody = parsed.html || null;

  // Extract key headers only
  const headers: Record<string, string> = {};
  for (const key of HEADER_KEYS) {
    const val = message.headers.get(key);
    if (val) headers[key] = val;
  }

  await insertEmail(env.DB, {
    message_id: messageId,
    sender,
    recipient,
    subject,
    raw_size: message.rawSize,
    text_body: textBody,
    html_body: htmlBody,
    headers: JSON.stringify(headers),
  });
}
