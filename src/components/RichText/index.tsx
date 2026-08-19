import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  JSXConvertersFunction,
  RichText as RichTextWithoutBlocks,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/cn'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps>

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  // Lexical can serialize every ordered-list item with the same stale
  // `value` (typically 1) after certain edits/reorders/pastes — the default
  // converter passes that straight through to the `<li value>` attribute,
  // which overrides the browser's automatic numbering and renders every
  // item as "1." instead of "1. 2. 3.". Deriving the value from the item's
  // actual position in its parent list sidesteps the bad stored data
  // entirely, for every ordered list on the site, not just this content.
  listitem: ({ node, nodesToJSX, parent }) => {
    const hasSubLists = node.children.some((child) => child.type === 'list')
    const children = nodesToJSX({ nodes: node.children })
    const listParent = parent as { children?: unknown[]; listType?: string }

    if (listParent.listType === 'check') {
      const defaultListItem = defaultConverters.listitem as (args: {
        node: typeof node
        nodesToJSX: typeof nodesToJSX
        parent: typeof parent
      }) => React.ReactNode
      return defaultListItem({ node, nodesToJSX, parent })
    }

    const siblingIndex = Array.isArray(listParent.children) ? listParent.children.indexOf(node) : -1
    const value = siblingIndex >= 0 ? siblingIndex + 1 : node?.value

    return (
      <li className={hasSubLists ? 'nestedListItem' : ''} style={hasSubLists ? { listStyleType: 'none' } : undefined} value={value}>
        {children}
      </li>
    )
  },
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-3xl"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
  },
})

type Props = {
  data: SerializedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export const RichText: React.FC<Props> = (props) => {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <RichTextWithoutBlocks
      converters={jsxConverters}
      className={cn(
        {
          'container ': enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert ': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
