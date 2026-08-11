import type { Service } from '@/payload-types'

import { getServiceIcon } from '@/lib/getServiceIcon'
import configPromise from '@payload-config'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

const DEFAULT_SERVICES = [
  { id: '1', title: '3D Printing', slug: '3d-printing', subtitle: 'Rapid SLA & FDM' },
  { id: '2', title: 'Custom Battery Packs', slug: 'custom-battery-packs', subtitle: 'BMS & spot welding' },
  { id: '3', title: 'Laser Cutting', slug: 'laser-cutting', subtitle: 'Acrylic & metal' },
  { id: '4', title: 'PCB Manufacturing', slug: 'pcb-manufacturing', subtitle: 'Fast turnaround' },
]

const SUBTITLE_MAP: Record<string, string> = {
  '3d-printing': 'Rapid SLA & FDM',
  'custom-battery-packs': 'BMS & spot welding',
  'laser-cutting': 'Acrylic & sheet metal',
  'pcb-manufacturing': 'Prototype to batch',
}

export const ServiceQuickLinks: React.FC<{ className?: string }> = async ({ className }) => {
  let services: Array<{ id: string | number; title: string; slug?: string | null; subtitle?: string }> = []

  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'services',
      limit: 4,
      sort: 'title',
    })
    if (docs.length > 0) {
      services = docs.map((s: Service) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        subtitle: SUBTITLE_MAP[s.slug ?? ''] || 'On-demand prototyping',
      }))
    }
  } catch {
    services = DEFAULT_SERVICES
  }

  if (services.length === 0) {
    services = DEFAULT_SERVICES
  }

  return (
    <div className={`pmc-services-hub ${className || ''}`}>
      <div className="pmc-services-hub-header">
        <span className="pmc-services-hub-pill">
          <Sparkles className="size-3" />
          Maker Studio
        </span>
        <span className="pmc-services-hub-title">On-Demand Services</span>
      </div>

      <div className="pmc-service-links-list">
        {services.map((service) => {
          const Icon = getServiceIcon(service.title)
          const href = service.slug ? `/services/${service.slug}` : '/services'

          return (
            <Link
              className="pmc-service-card group"
              href={href}
              key={service.id}
            >
              <div className="pmc-service-icon-box">
                <Icon className="size-4.5 text-primary group-hover:scale-110 transition-transform duration-200" />
              </div>

              <div className="pmc-service-info">
                <span className="pmc-service-title group-hover:text-primary transition-colors">
                  {service.title}
                </span>
                <span className="pmc-service-subtitle">
                  {service.subtitle || 'Custom build'}
                </span>
              </div>

              <div className="pmc-service-arrow">
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
