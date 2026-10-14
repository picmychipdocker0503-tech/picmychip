import type { LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'

import { TechnicianRequestForm } from '@/components/technician-request/TechnicianRequestForm'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  Clock,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import React from 'react'

export const metadata: Metadata = {
  alternates: {
    canonical: `${getServerSideURL()}/request-technician`,
  },
  description:
    'Request qualified electronics technicians for soldering, rework, assembly, testing and inspection — onsite or at the Picmychip facility in Bengaluru.',
  openGraph: mergeOpenGraph({
    title: 'Request a Technician',
    url: '/request-technician',
  }),
  title: 'Request a Technician — Picmychip',
}

type Step = {
  description: string
  icon: LucideIcon
  title: string
}

const FLOW: Step[] = [
  { icon: ClipboardList, title: 'Share your requirement', description: 'Skills needed, project scope, location and duration' },
  { icon: UserCheck, title: 'We match the right technician', description: 'Screened for soldering, rework, testing or assembly experience' },
  { icon: Building2, title: 'Onsite or at our facility', description: 'Deployed to your site, or working from our Bengaluru lab' },
  { icon: Users, title: 'Scale as you need', description: 'Add or release technicians as your project changes' },
]

const ASSURANCES: Step[] = [
  { icon: BadgeCheck, title: 'Qualified & experienced', description: 'Hands-on electronics technicians, not general labour.' },
  { icon: Clock, title: 'Fast response', description: 'A call back within one working day of your request.' },
  { icon: ShieldCheck, title: 'Flexible engagement', description: 'From a single day to long-term deployment.' },
]

export default function RequestTechnicianPage() {
  return (
    <div className="pt-12 pb-24">
      {/* Hero */}
      <section className="container">
        <div className="border-border bg-card grid grid-cols-1 overflow-hidden rounded-3xl border lg:grid-cols-2">
          <div className="relative aspect-[5/4] bg-neutral-100 lg:aspect-auto">
            <Image
              alt="Picmychip technician soldering a circuit board"
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="/line-card/illus-tech.webp"
              unoptimized
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <span className="eyebrow">Technician support</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              We provide qualified technicians as per your requirements
            </h1>
            <p className="text-muted-foreground mt-3">
              Skilled, experienced hands for your production line, lab or project, for a day, a batch or the long run.
              Tell us what you need and we&apos;ll match the right people.
            </p>

            <ol className="mt-8 flex flex-col">
              {FLOW.map(({ description, icon: Icon, title }, index) => (
                <li className="relative flex gap-4 pb-5 last:pb-0" key={title}>
                  {index < FLOW.length - 1 && (
                    <span aria-hidden className="bg-border absolute top-10 bottom-0 left-5 w-px" />
                  )}
                  <span className="border-primary/30 bg-primary/10 text-primary relative flex size-10 shrink-0 items-center justify-center rounded-full border">
                    <Icon className="size-4" />
                  </span>
                  <div className="pt-1">
                    <p className="text-foreground text-sm font-semibold">
                      <span className="text-primary mr-1.5">{String(index + 1).padStart(2, '0')}</span>
                      {title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="container mt-14 scroll-mt-24" id="technician-form">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="text-foreground text-2xl font-bold tracking-tight">Request technicians</h2>
            <p className="text-muted-foreground mt-2 mb-6 text-sm">
              Fill in what you know. Our team will call to confirm the technician profile, schedule and pricing.
            </p>
            <TechnicianRequestForm />
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            {ASSURANCES.map(({ description, icon: Icon, title }) => (
              <div className="border-border bg-card flex gap-3 rounded-2xl border p-5" key={title}>
                <div className="from-orange/25 to-orange/10 flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
                  <Icon className="text-orange size-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">{title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-neutral-950 p-5 text-white">
              <p className="text-xs font-semibold tracking-widest text-green-400 uppercase">Prefer to talk?</p>
              <a className="mt-3 flex items-center gap-2.5 text-sm hover:text-green-400" href="tel:+919087606060">
                <Phone className="size-4 text-green-400" />
                +91 90876 06060
              </a>
              <a
                className="mt-2 flex items-center gap-2.5 text-sm hover:text-green-400"
                href="mailto:sales@picmychip.com?subject=Technician%20request"
              >
                <Mail className="size-4 text-green-400" />
                sales@picmychip.com
              </a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
