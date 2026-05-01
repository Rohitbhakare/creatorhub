import { describe, it, expect } from 'vitest'
import { htmlToMarkdown, markdownToHtml } from './tiptap-markdown'

describe('tiptap-markdown', () => {
  describe('htmlToMarkdown', () => {
    it('converts headings + paragraphs', () => {
      const html = '<h2>Title</h2><p>Some <strong>bold</strong> text.</p>'
      expect(htmlToMarkdown(html)).toBe('## Title\n\nSome **bold** text.')
    })

    it('converts blockquote to a `> ` line', () => {
      const html = '<blockquote><p>Take ten days.</p></blockquote>'
      expect(htmlToMarkdown(html)).toBe('> Take ten days.')
    })

    it('preserves bullet + ordered lists', () => {
      const html = '<ul><li>One</li><li>Two</li></ul>'
      expect(htmlToMarkdown(html)).toContain('-   One')
      expect(htmlToMarkdown(html)).toContain('-   Two')
    })

    it('preserves links', () => {
      const html = '<p>See <a href="https://x.com">X</a>.</p>'
      expect(htmlToMarkdown(html)).toBe('See [X](https://x.com).')
    })

    it('rewrites YouTube iframe to a markdown link with ▶', () => {
      const html =
        '<p>Watch:</p><iframe src="https://www.youtube.com/embed/abc123" width="560" height="315"></iframe>'
      const md = htmlToMarkdown(html)
      expect(md).toContain('[YouTube ▶](https://www.youtube.com/embed/abc123)')
    })

    it('strips empty paragraphs and trims', () => {
      const html = '<p></p><p>Body.</p><p></p>'
      expect(htmlToMarkdown(html)).toBe('Body.')
    })
  })

  describe('markdownToHtml', () => {
    it('converts headings to <h1/2/3>', () => {
      expect(markdownToHtml('# A')).toBe('<h1>A</h1>')
      expect(markdownToHtml('## B')).toBe('<h2>B</h2>')
      expect(markdownToHtml('### C')).toBe('<h3>C</h3>')
    })

    it('wraps paragraphs in <p>', () => {
      expect(markdownToHtml('Hello world.')).toBe('<p>Hello world.</p>')
    })

    it('converts blockquote', () => {
      expect(markdownToHtml('> Note.')).toBe('<blockquote><p>Note.</p></blockquote>')
    })

    it('converts inline bold + italic', () => {
      const html = markdownToHtml('A **bold** and *italic* word.')
      expect(html).toBe('<p>A <strong>bold</strong> and <em>italic</em> word.</p>')
    })

    it('escapes HTML in input', () => {
      expect(markdownToHtml('<script>alert(1)</script>')).toBe(
        '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
      )
    })

    it('separates blocks by paragraph (\\n\\n)', () => {
      const out = markdownToHtml('First.\n\nSecond.')
      expect(out).toBe('<p>First.</p>\n<p>Second.</p>')
    })

    it('returns empty string for empty input', () => {
      expect(markdownToHtml('')).toBe('')
    })
  })
})
