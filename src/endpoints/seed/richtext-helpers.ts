const textNode = (text: string) => ({ type: 'text', text, version: 1 })

export const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})

export const heading = (text: string, tag: 'h1' | 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})

export const listItem = (text: string) => ({
  type: 'listitem',
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
  value: 1,
})

export const bulletList = (items: string[]) => ({
  type: 'list',
  listType: 'bullet' as const,
  tag: 'ul' as const,
  start: 1,
  children: items.map((item) => listItem(item)),
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})

type RichTextNode = { type: string; version: number; [key: string]: unknown }

export const richText = (nodes: RichTextNode[]) => ({
  root: {
    type: 'root',
    children: nodes,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})
