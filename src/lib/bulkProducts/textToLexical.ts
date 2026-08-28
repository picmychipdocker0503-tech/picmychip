/** Minimal single-paragraph Lexical editor state — the shape Payload's
 * lexicalEditor() richText fields expect. No rich formatting; just enough
 * to store a plain-text description entered via the bulk import sheet. */
export function textToLexical(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
