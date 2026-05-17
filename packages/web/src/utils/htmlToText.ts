/**
 * Strip HTML/CSS/JS from HTML content to produce rough plain text.
 * Mirrors the same function in packages/worker/src/emails/handler.ts.
 * Used as client-side fallback when text_body is not available.
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
    .trim()
}
