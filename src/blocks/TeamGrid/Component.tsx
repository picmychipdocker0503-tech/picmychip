import type {
  Media as MediaType,
  TeamGridBlock as TeamGridBlockProps,
} from '@/payload-types'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { Media } from '@/components/Media'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Mail, Users } from 'lucide-react'
import React from 'react'

type Member = {
  key: string | number
  name: string
  photo?: MediaType | null
  email?: string | null
  designation?: string | null
  department?: string | null
  yearsAtCompany?: number | null
  story?: SerializedEditorState | null
}

type Group = {
  name: string
  members: Member[]
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

    // depth: 2 — one level to populate `linkedUser`, a second to populate
    // that user's own `avatar` relationship.
    const { docs } = await payload.find({
      collection: 'team-testimonials',
      depth: 2,
      limit: limit || 12,
      sort: '-createdAt',
      where: {
        featured: { equals: true },
      },
    })

    members = docs.map((entry) => {
      const linkedUser = typeof entry.linkedUser === 'object' ? entry.linkedUser : undefined

      return {
        key: entry.id,
        name: entry.name,
        // A linked account's own profile picture wins when present — the
        // curated `photo` field is only a fallback for people without one.
        photo:
          (typeof linkedUser?.avatar === 'object' ? linkedUser.avatar : undefined) ??
          (typeof entry.photo === 'object' ? entry.photo : undefined),
        email: linkedUser?.email,
        designation: entry.designation,
        department: entry.department,
        yearsAtCompany: entry.yearsAtCompany,
        story: entry.story,
      }
    })
  }

  if (members.length === 0) return null

  // Grouped by department, preserving each department's first-appearance
  // order — members with no department fall into a single trailing "Team"
  // bucket rather than being scattered or dropped.
  const groups = members.reduce<Group[]>((acc, member) => {
    const groupName = member.department?.trim() || 'Team'
    let group = acc.find((g) => g.name === groupName)
    if (!group) {
      group = { name: groupName, members: [] }
      acc.push(group)
    }
    group.members.push(member)
    return acc
  }, [])

  return (
    <section className="container my-20">
      {(heading || intro) && (
        <div className="mb-14 max-w-2xl">
          {heading && (
            <>
              <span className="text-primary bg-primary/10 border-primary/20 mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase">
                <Users className="size-3.5" />
                Team
              </span>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {heading}
              </h2>
            </>
          )}
          {intro && <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">{intro}</p>}
        </div>
      )}

      <div className="flex flex-col">
        {groups.map((group) => (
          <div
            className="border-border/80 grid grid-cols-1 gap-6 border-t py-10 first:border-t-0 first:pt-0 md:grid-cols-12 md:gap-8"
            key={group.name}
          >
            <div className="md:col-span-3">
              <h3 className="text-foreground text-lg font-bold sm:text-xl">{group.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:col-span-9">
              {group.members.map((member) => (
                <div className="group" key={member.key}>
                  <div className="bg-muted relative aspect-[3/4] overflow-hidden rounded-2xl">
                    {member.photo?.url ? (
                      <Media
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.03]"
                        resource={member.photo}
                      />
                    ) : (
                      <div className="text-primary bg-primary/10 flex h-full w-full items-center justify-center text-3xl font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="text-foreground text-sm font-bold sm:text-base">{member.name}</div>
                    {member.designation && (
                      <div className="text-muted-foreground mt-0.5 text-xs sm:text-sm">{member.designation}</div>
                    )}
                    {member.email && (
                      <a
                        className="text-muted-foreground hover:text-primary mt-1 flex items-center gap-1 text-xs transition-colors"
                        href={`mailto:${member.email}`}
                      >
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
