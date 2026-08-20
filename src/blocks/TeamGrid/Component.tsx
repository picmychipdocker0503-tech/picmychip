import type {
  Media as MediaType,
  TeamGridBlock as TeamGridBlockProps,
} from '@/payload-types'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { Media } from '@/components/Media'
import { RichText } from '@/components/RichText'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Users } from 'lucide-react'
import React from 'react'

type Member = {
  key: string | number
  name: string
  photo?: MediaType | null
  designation?: string | null
  department?: string | null
  yearsAtCompany?: number | null
  story?: SerializedEditorState | null
}

export const TeamGridBlock: React.FC<
  TeamGridBlockProps & {
    id?: string | number
  }
> = async ({ heading, intro, populateBy, members: manualMembers, limit }) => {
  let members: Member[] = []

  if (populateBy === 'manual') {
    members = (manualMembers ?? []).map((entry, index) => ({
      key: entry.id ?? index,
      name: entry.name,
      photo: typeof entry.photo === 'object' ? entry.photo : undefined,
      designation: entry.designation,
      department: entry.department,
      yearsAtCompany: entry.yearsAtCompany,
      story: entry.story,
    }))
  } else {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'team-testimonials',
      depth: 1,
      limit: limit || 12,
      sort: '-createdAt',
      where: {
        featured: { equals: true },
      },
    })

    members = docs.map((entry) => ({
      key: entry.id,
      name: entry.name,
      photo: typeof entry.photo === 'object' ? entry.photo : undefined,
      designation: entry.designation,
      department: entry.department,
      yearsAtCompany: entry.yearsAtCompany,
      story: entry.story,
    }))
  }

  if (members.length === 0) return null

  const headingText = heading || 'Meet the Team'

  return (
    <section className="container my-20">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <span className="text-primary bg-primary/10 border-primary/20 mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase">
          <Users className="size-3.5" />
          Team
        </span>
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
          <span className="text-foreground">{headingText}</span>
        </h2>
        {intro && <p className="text-muted-foreground mt-2 text-sm sm:text-base">{intro}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div
            className="border-border/80 bg-card/60 flex flex-col overflow-hidden rounded-3xl border p-7 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-lg"
            key={member.key}
          >
            <div className="mb-5 flex items-center gap-4">
              <div className="bg-primary/10 text-primary border-primary/20 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border text-lg font-bold">
                {member.photo?.url ? (
                  <Media className="rounded-full" imgClassName="rounded-full object-cover" resource={member.photo} />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="text-foreground text-base font-bold">{member.name}</div>
                {(member.designation || member.department) && (
                  <div className="text-muted-foreground text-xs">
                    {[member.designation, member.department].filter(Boolean).join(' · ')}
                  </div>
                )}
                {typeof member.yearsAtCompany === 'number' && (
                  <div className="text-muted-foreground text-xs">
                    {member.yearsAtCompany} {member.yearsAtCompany === 1 ? 'year' : 'years'} at Picmychip
                  </div>
                )}
              </div>
            </div>

            {member.story ? (
              <RichText
                className="max-w-none [&>p]:text-muted-foreground [&>p]:mt-2 [&>p]:text-sm [&>p]:leading-relaxed first:[&>p]:mt-0"
                data={member.story}
                enableGutter={false}
                enableProse={false}
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
