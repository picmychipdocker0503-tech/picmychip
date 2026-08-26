'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Cable,
  Capacitor,
  Chip,
  CircuitBoard,
  Connector,
  Diode,
  Drone,
  FilamentSpool,
  Gear,
  Inductor,
  Microcontroller,
  Resistor,
  Toolbox,
} from '@/components/illustrations'
import type { Category, Media as MediaType } from '@/payload-types'

interface Props {
  image?: MediaType | number | string | null | false
  title?: string | null
  category?: string | number | Category | { slug?: string; title?: string } | null
  slug?: string | null
  className?: string
  imgClassName?: string
  priority?: boolean
  aspectRatio?: 'square' | 'video' | 'auto'
}

interface MatchResult {
  Icon: React.ComponentType<{ className?: string }>
  label: string
  accentColor: string
  bgGlow: string
}

export function getProductMatchDetails(title = '', slug = '', category = ''): MatchResult {
  const text = `${title} ${slug} ${category}`.toLowerCase()

  if (/\b(resistor|res|ohm|0805|0402|1206|potentiometer|trimmer|rheostat)\b/i.test(text)) {
    return {
      Icon: Resistor,
      label: 'Precision Resistor',
      accentColor: 'text-amber-500',
      bgGlow: 'from-amber-500/15 via-orange-500/5 to-transparent',
    }
  }

  if (/\b(capacitor|cap|electrolytic|tantalum|ceramic|x7r|x5r|supercap|uf|pf|nf)\b/i.test(text)) {
    return {
      Icon: Capacitor,
      label: 'Dielectric Capacitor',
      accentColor: 'text-cyan-500',
      bgGlow: 'from-cyan-500/15 via-blue-500/5 to-transparent',
    }
  }

  if (/\b(connector|header|terminal|jst|xt60|xt30|xt90|molex|sma|bnc|plug|jack|socket|pin header)\b/i.test(text)) {
    return {
      Icon: Connector,
      label: 'Hardware Connector',
      accentColor: 'text-orange-500',
      bgGlow: 'from-orange-500/15 via-amber-500/5 to-transparent',
    }
  }

  if (/\b(cable|wire|usb|type-c|usbc|harness|ribbon|ffc|jumper|lead|cord)\b/i.test(text)) {
    return {
      Icon: Cable,
      label: 'Interface Cable',
      accentColor: 'text-blue-500',
      bgGlow: 'from-blue-500/15 via-cyan-500/5 to-transparent',
    }
  }

  if (/\b(diode|led|schottky|zener|tvs|rectifier|rgb|photodiode|laser)\b/i.test(text)) {
    return {
      Icon: Diode,
      label: 'Semiconductor Diode',
      accentColor: 'text-emerald-500',
      bgGlow: 'from-emerald-500/15 via-teal-500/5 to-transparent',
    }
  }

  if (/\b(inductor|choke|coil|ferrite|toroid|transformer|bead)\b/i.test(text)) {
    return {
      Icon: Inductor,
      label: 'Magnetic Inductor',
      accentColor: 'text-purple',
      bgGlow: 'from-purple/15 via-purple-light/10 to-transparent',
    }
  }

  if (/\b(stm32|esp32|esp8266|mcu|microcontroller|cortex|atmega|pic|avr|rp2040)\b/i.test(text)) {
    return {
      Icon: Microcontroller,
      label: '32-Bit Microcontroller',
      accentColor: 'text-primary',
      bgGlow: 'from-primary/20 via-blue-500/5 to-transparent',
    }
  }

  if (/\b(ic|chip|processor|op-amp|dac|adc|logic|gate|timer|555|regulator|ldo|mosfet|transistor|igbt|gan)\b/i.test(text)) {
    return {
      Icon: Chip,
      label: 'Integrated Silicon',
      accentColor: 'text-primary',
      bgGlow: 'from-primary/15 via-amber-500/5 to-transparent',
    }
  }

  if (/\b(drone|motor|propeller|esc|brushless|flight|servo|gimbal|fpv|quadcopter)\b/i.test(text)) {
    return {
      Icon: Drone,
      label: 'Drone & Robotics',
      accentColor: 'text-red-500',
      bgGlow: 'from-red-500/15 via-orange-500/5 to-transparent',
    }
  }

  if (/\b(filament|pla|petg|abs|tpu|spool|3d print)\b/i.test(text)) {
    return {
      Icon: FilamentSpool,
      label: '3D Maker Material',
      accentColor: 'text-amber-500',
      bgGlow: 'from-amber-500/15 via-yellow-500/5 to-transparent',
    }
  }

  if (/\b(tool|solder|iron|multimeter|tweezer|pliers|cutter|crimp|screw|standoff)\b/i.test(text)) {
    return {
      Icon: Toolbox,
      label: 'Workbench Tool',
      accentColor: 'text-neutral-400',
      bgGlow: 'from-neutral-500/15 via-neutral-700/5 to-transparent',
    }
  }

  return {
    Icon: CircuitBoard,
    label: 'Hardware Module',
    accentColor: 'text-primary',
    bgGlow: 'from-primary/15 via-blue-500/5 to-transparent',
  }
}

export const ProductMatchingImage: React.FC<Props> = ({
  image,
  title = '',
  category = '',
  slug = '',
  className = '',
  imgClassName = '',
  priority = false,
  aspectRatio = 'square',
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const categoryStr =
    typeof category === 'object' && category
      ? category.title || category.slug || ''
      : typeof category === 'string'
        ? category
        : ''

  const match = getProductMatchDetails(title || '', slug || '', categoryStr)
  const { Icon, label, accentColor, bgGlow } = match

  const imageUrl =
    image && typeof image === 'object' && image.url
      ? // Cache-busts on the Media doc's own updatedAt — its filename isn't
        // content-hashed, so replacing the file reuses the same URL (see the
        // identical comment in components/Media/Image/index.tsx).
        `${image.url}${image.url.includes('?') ? '&' : '?'}v=${new Date(image.updatedAt).getTime()}`
      : typeof image === 'string'
        ? image
        : null

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square w-full'
      : aspectRatio === 'video'
        ? 'aspect-video w-full'
        : 'w-full h-full'

  return (
    <div
      className={`relative ${aspectClass} overflow-hidden rounded-2xl bg-muted/15 flex items-center justify-center p-3 sm:p-4 select-none ${className}`}
    >
      {/* Schematic grid background for technical depth */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px]" />

      {imageUrl && !imageError ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            alt={title || 'Product image'}
            className={`object-contain max-h-full max-w-full transition-transform duration-300 ease-out group-hover:scale-105 ${imageLoading ? 'animate-shimmer' : ''} ${imgClassName}`}
            fill
            onError={() => setImageError(true)}
            onLoad={() => setImageLoading(false)}
            priority={priority}
            fetchPriority={priority ? 'high' : undefined}
            quality={90}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            src={imageUrl}
          />
        </div>
      ) : (
        /* Semantic Hardware Illustration Matching Product Name */
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-center p-2">
          {/* Subtle Ambient Aura */}
          <div
            className={`pointer-events-none absolute inset-4 rounded-full bg-gradient-to-br ${bgGlow} blur-xl opacity-70`}
          />

          {/* Component Socket Graphic */}
          <div className="relative flex size-20 sm:size-24 items-center justify-center rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-inner transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/40">
            <Icon className={`size-10 sm:size-12 ${accentColor} drop-shadow-sm`} />
          </div>

          {/* Matching Component Tag */}
          <span className="relative z-10 mt-2.5 inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border/60">
            {label}
          </span>
        </div>
      )}
    </div>
  )
}
