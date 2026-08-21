import dynamic from 'next/dynamic'
import React from 'react'

// `prism-react-renderer` is only needed on pages whose rich text actually
// contains a code block — a plain static import here would pull it into
// every route that renders RichText (pages, guides, banners, ...) whether
// or not that content has a code node. `dynamic()` keeps SSR (content still
// renders in the initial HTML) while splitting the highlighter into its own
// chunk, fetched only when a CodeBlock is actually in the render tree.
const Code = dynamic(() => import('./Component.client').then((mod) => mod.Code), {
  loading: () => <div className="bg-black h-24 animate-pulse rounded border border-border" />,
})

export type CodeBlockProps = {
  code: string
  language?: string
  blockType: 'code'
}

export const CodeBlock: React.FC<
  CodeBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ className, code, language }) => {
  return (
    <div className={[className, 'not-prose'].filter(Boolean).join(' ')}>
      <Code code={code} language={language} />
    </div>
  )
}
