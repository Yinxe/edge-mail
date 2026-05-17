import PostalMime from 'postal-mime';
import type { ForwardableEmailMessage } from '@cloudflare/workers-types';
import type { Env } from '../shared/types';
import { insertEmail } from './db';

/**
 * Strip HTML/CSS/JS from HTML content to produce rough plain text.
 * Used when an email has no text/plain MIME part.
 */
export function htmlToText(html: string): string {
  return html
    // Remove <script> and <style> blocks (and their content)
    .replace(/<script[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    // Block-level tags → newline (opening and closing)
    .replace(/<\/?(?:p|div|h[1-6]|li|blockquote|tr|th|td|section|article|nav|header|footer)[^>]*>/gi, '\n')
    // <br> → newline
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining HTML tags (including <img>, <a>, <span>, etc.)
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities (named + numeric)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&bull;/g, '•')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    // Strip leading/trailing whitespace from each line (HTML nesting indentation debris)
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    // Collapse 3+ blank lines into 1 (aggressive since deeply nested HTML creates many)
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace
    .trim();
}

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

  const messageId = message.headers.get('message-id') || crypto.randomUUID();
  const sender = message.from;
  const recipient = message.to;
  const subject = parsed.subject || '(no subject)';

  // If email has no text/plain part, extract text from HTML at ingestion time
  const textBody = parsed.text || (parsed.html ? htmlToText(parsed.html) : null);
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
