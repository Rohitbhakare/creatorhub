import TurndownService from 'turndown'

/**
 * Convert TipTap HTML output to markdown matching the read-side
 * `<MarkdownBody>` token set (E5.5 T3).
 *
 * Why turndown: TipTap's `getHTML()` returns clean semantic HTML; turndown
 * (well-tested, ~10KB) maps it to markdown that reader can already parse.
 * For tokens the reader doesn't render (image, table), we keep the markdown
 * source intact so a future reader extension fills the gap.
 */
const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
})

// Preserve YouTube embed iframes as markdown links (reader treats as text).
turndown.addRule('youtube', {
  filter: (node) =>
    node.nodeName === 'IFRAME' &&
    typeof (node as HTMLIFrameElement).src === 'string' &&
    /youtu(\.be|be\.com)/.test((node as HTMLIFrameElement).src),
  replacement: (_content, node) => {
    const src = (node as HTMLIFrameElement).src
    return `\n\n[YouTube ▶](${src})\n\n`
  },
})

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim()
}

/**
 * Markdown → HTML for feeding into TipTap on edit-existing.
 * Tiny converter — only the tokens the read-side parses (paragraphs / H1-3
 * / `>` blockquote / **bold** / *italic*). TipTap will tolerate plain text
 * for anything else.
 */
export function markdownToHtml(md: string): string {
  if (!md) return ''
  return md
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trimStart()
      if (trimmed.startsWith('### ')) return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`
      if (trimmed.startsWith('## ')) return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`
      if (trimmed.startsWith('# ')) return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`
      if (trimmed.startsWith('> ')) return `<blockquote><p>${inline(trimmed.slice(2))}</p></blockquote>`
      return `<p>${inline(block)}</p>`
    })
    .join('\n')
}

function inline(text: string): string {
  // Replace **bold** and *italic* with real HTML; escape everything else.
  // Pass: bold first (greedier), then italic.
  let out = escapeHtml(text)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return out
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
