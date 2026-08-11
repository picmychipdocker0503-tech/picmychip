type LexicalNode = {
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

const extractText = (node: LexicalNode | null | undefined): string => {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.children)) {
    return node.children.map(extractText).filter(Boolean).join(' ')
  }
  return ''
}

/**
 * Flattens a Lexical richText JSON value into plain text, for schema.org
 * fields (e.g. FAQPage `acceptedAnswer.text`) that require plain text, not
 * HTML. Not a general-purpose renderer — just enough for structured data.
 */
export const richTextToPlainText = (data: unknown): string => {
  const root = (data as { root?: LexicalNode })?.root
  if (!root) return ''
  return extractText(root).replace(/\s+/g, ' ').trim()
}
