import { cn } from '@/utilities/cn'
import React from 'react'
import { RichText } from '@/components/RichText'
import type { DefaultDocumentIDType } from 'payload'
import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { CMSLink } from '../../components/Link'

export const ContentBlock: React.FC<
  ContentBlockProps & {
    id?: DefaultDocumentIDType
    className?: string
  }
> = (props) => {
  const { columns } = props

  const colsSpanClasses: Record<string, string> = {
    full: 'lg:col-span-12',
    half: 'lg:col-span-6',
    oneThird: 'lg:col-span-4',
    twoThirds: 'lg:col-span-8',
  }

  return (
    <section className="container my-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { enableLink, link, richText, size = 'oneThird' } = col
            const spanClass = colsSpanClasses[size || 'oneThird'] || 'lg:col-span-4'

            return (
              <div
                className={cn(
                  `${spanClass} group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-8 shadow-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-md`,
                )}
                key={index}
              >
                {/* Subtle hover glow */}
                <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />

                {richText && (
                  <RichText
                    className="[&>h2]:text-2xl [&>h2]:font-black [&>h2]:tracking-tight [&>h2]:text-foreground [&>h3]:text-xl [&>h3]:font-black [&>h3]:tracking-tight [&>h3]:text-foreground [&>p]:mt-2.5 [&>p]:text-sm [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>ul]:mt-2.5 [&>ol]:mt-2.5 [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:leading-relaxed"
                    data={richText}
                    enableGutter={false}
                  />
                )}

                {enableLink && link && (
                  <div className="mt-6 pt-4 border-t border-border/60">
                    <CMSLink
                      {...link}
                      appearance="link"
                      className="text-sm font-bold text-primary hover:underline"
                    />
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </section>
  )
}
