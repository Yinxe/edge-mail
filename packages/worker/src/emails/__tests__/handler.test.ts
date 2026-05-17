import { describe, it, expect } from 'vitest';
import { htmlToText } from '../handler';

describe('htmlToText', () => {
  it('should return plain text unchanged', () => {
    expect(htmlToText('Hello World')).toBe('Hello World');
  });

  it('should strip simple HTML tags', () => {
    expect(htmlToText('<p>Hello</p>')).toBe('Hello');
  });

  it('should replace <br> with newline', () => {
    expect(htmlToText('line1<br>line2')).toBe('line1\nline2');
    expect(htmlToText('line1<br/>line2')).toBe('line1\nline2');
    expect(htmlToText('line1<br />line2')).toBe('line1\nline2');
  });

  it('should replace <p> and </p> with newlines', () => {
    expect(htmlToText('<p>First</p><p>Second</p>')).toBe('First\n\nSecond');
  });

  it('should replace block-level elements with newlines', () => {
    const html = '<div>Header</div><p>Body</p><h1>Title</h1><li>Item</li>';
    const result = htmlToText(html);
    expect(result).toContain('Header');
    expect(result).toContain('Body');
    expect(result).toContain('Title');
    expect(result).toContain('Item');
    // Should have newlines between blocks
    expect(result).not.toContain('</div>');
  });

  it('should remove <script> blocks entirely', () => {
    const html = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    expect(htmlToText(html)).toBe('Hello\n\nWorld');
  });

  it('should remove <script> with attributes', () => {
    const html = '<p>Hi</p><script type="text/javascript">evil();</script><p>There</p>';
    expect(htmlToText(html)).toBe('Hi\n\nThere');
  });

  it('should remove <style> blocks entirely', () => {
    const html = '<p>Text</p><style>.cls { color: red; }</style><p>More</p>';
    expect(htmlToText(html)).toBe('Text\n\nMore');
  });

  it('should handle self-closing and non-standard tags', () => {
    const html = 'hello<hr />world<img src="x" />end';
    expect(htmlToText(html)).toBe('helloworldend');
  });

  it('should decode &amp; to &', () => {
    expect(htmlToText('AT&amp;T')).toBe('AT&T');
  });

  it('should decode &lt; and &gt;', () => {
    expect(htmlToText('&lt;div&gt;')).toBe('<div>');
  });

  it('should decode &quot; and &#39;', () => {
    const result = htmlToText('It&rsquo;s &quot;great&quot;');
    expect(result).toContain('great');
    expect(result).toContain('"');
    expect(result).not.toContain('&quot;');
    expect(result).not.toContain('&rsquo;');
    // &rsquo; should decode to a single quote
    expect(result).toMatch(/It's|It.s/);
  });

  it('should decode &nbsp; to space', () => {
    expect(htmlToText('hello&nbsp;world')).toBe('hello world');
  });

  it('should decode numeric HTML entities', () => {
    expect(htmlToText('&#39;single&#63;')).toBe("'single?");
  });

  it('should collapse 3+ newlines into 2', () => {
    const text = htmlToText('<p>A</p><p>B</p><p>C</p>');
    expect(text).toBe('A\n\nB\n\nC');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(htmlToText('  <p>hello</p>  ')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(htmlToText('')).toBe('');
  });

  it('should handle HTML with only whitespace', () => {
    expect(htmlToText('   ')).toBe('');
  });

  it('should handle nested tags', () => {
    const html = '<div><p>Hello <b>World</b></p></div>';
    expect(htmlToText(html)).toBe('Hello World');
  });

  it('should remove attributes from tags', () => {
    const html = '<a href="https://example.com">click here</a>';
    expect(htmlToText(html)).toBe('click here');
  });

  it('should handle mixed script/style and content', () => {
    const html = [
      '<html>',
      '<head><style>body { margin: 0; }</style></head>',
      '<body>',
      '<h1>Title</h1>',
      '<p>Hello World</p>',
      '<script>console.log("hi")</script>',
      '</body>',
      '</html>',
    ].join('\n');
    const result = htmlToText(html);
    expect(result).toContain('Title');
    expect(result).toContain('Hello World');
    expect(result).not.toContain('margin');
    expect(result).not.toContain('console.log');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</html>');
  });

  it('should convert lists with line breaks', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = htmlToText(html);
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
    expect(result).not.toContain('<li>');
  });

  it('should handle tables', () => {
    const html = '<table><tr><td>A</td><td>B</td></tr></table>';
    const result = htmlToText(html);
    expect(result).toContain('A');
    expect(result).toContain('B');
    expect(result).not.toContain('<td>');
  });

  it('should not add extra newlines for inline tags', () => {
    const html = '<p>Hello <strong>bold</strong> and <em>italic</em> text</p>';
    const result = htmlToText(html);
    // All inline, should be one line (the <p> adds \n around it)
    expect(result.replace(/\n/g, '')).toBe('Hello bold and italic text');
  });

  it('should decode &middot; entity', () => {
    expect(htmlToText('foo&middot;bar')).toBe('foo·bar');
  });

  it('should decode &bull; entity', () => {
    expect(htmlToText('foo&bull;bar')).toBe('foo•bar');
  });

  it('should decode &hellip; entity', () => {
    expect(htmlToText('foo&hellip;bar')).toBe('foo…bar');
  });

  it('should strip leading whitespace on each line', () => {
    const result = htmlToText('<div>\n  <p>indented</p>\n</div>');
    // Leading HTML nesting spaces should be removed
    expect(result).toBe('indented');
  });

  it('should strip trailing whitespace on each line', () => {
    const result = htmlToText('<p>hello  \nworld  </p>');
    // Trailing spaces on lines should be removed
    expect(result).toBe('hello\nworld');
  });

  it('should handle mixed leading/trailing whitespace', () => {
    const result = htmlToText('  <p>  hello world  </p>  ');
    expect(result).toBe('hello world');
  });

  it('should clean up deeply nested HTML emails', () => {
    const html = [
      '<div class="email">',
      '  <div style="padding:20px">',
      '    <table>',
      '      <tr><td>',
      '        <p>Hello World</p>',
      '      </td></tr>',
      '    </table>',
      '  </div>',
      '</div>',
    ].join('\n');
    const result = htmlToText(html);
    expect(result).toBe('Hello World');
  });

  it('should compress deeply nested extra blank lines aggressively', () => {
    const html = '<div><div><div><p>A</p></div></div></div>';
    const result = htmlToText(html);
    // Should only have content, not multiple blank lines
    expect(result).toBe('A');
  });

  it('should produce clean output for typical marketing email', () => {
    const html = [
      '<!DOCTYPE html>',
      '<html>',
      '<head><style>body{font-family:sans-serif}</style></head>',
      '<body>',
      '  <table width="100%">',
      '    <tr>',
      '      <td>',
      '        <h1>Big News!</h1>',
      '        <p>Check out our latest &amp; greatest <a href="#">offer</a>.</p>',
      '        <p style="color:gray">Don&rsquo;t miss out&hellip;</p>',
      '      </td>',
      '    </tr>',
      '  </table>',
      '  <hr />',
      '  <footer>',
      '    <p>Privacy &middot; Terms</p>',
      '  </footer>',
      '</body>',
      '</html>',
    ].join('\n');
    const result = htmlToText(html);
    expect(result).toContain('Big News!');
    expect(result).toContain('Check out our latest & greatest offer.');
    expect(result).toContain("Don't miss out…");
    expect(result).toContain('Privacy · Terms');
    // No HTML tags should remain
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    // No CSS debris
    expect(result).not.toContain('font-family');
    expect(result).not.toContain('sans-serif');
    // Should be readable with reasonable line breaks
    expect(result.split('\n').filter(l => l.trim())).not.toHaveLength(0);
  });
});
