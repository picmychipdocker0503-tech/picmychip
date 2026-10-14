import type { LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { getServerSideURL } from '@/utilities/getURL'
import {
  Activity,
  ArrowRightIcon,
  BarChart3,
  Boxes,
  Bug,
  Building2,
  Cable,
  Check,
  ClipboardList,
  Code,
  Cpu,
  Database,
  Download,
  Drone,
  ExternalLink,
  Fan,
  FileText,
  Flame,
  Gauge,
  Globe,
  Hammer,
  Handshake,
  Laptop,
  Layers,
  Mail,
  MapPin,
  Microscope,
  Network,
  Nut,
  PackageCheck,
  PackageOpen,
  Phone,
  Pipette,
  Plug,
  PlugZap,
  Radio,
  ReceiptText,
  RefreshCw,
  Repeat,
  Scissors,
  Printer,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Tag,
  Truck,
  Usb,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = {
  alternates: {
    canonical: `${getServerSideURL()}/line-card`,
  },
  description:
    'Picmychip line card — electronic components, test & measurement, soldering, power supplies, cables, connectors, drone parts and engineering services from one sourcing partner in Bengaluru.',
  title: 'Line Card — Picmychip',
}

// Images in /public/line-card are pre-compressed WebP, cut from the 2026 line
// card PDF. They're served `unoptimized` so this page doesn't spend Vercel
// image-transformation quota (see the `images` notes in next.config.ts).
const ASSET = '/line-card'
const PDF_URL = `${ASSET}/picmychip-line-card-2026.pdf`

type Feature = {
  description: string
  icon: LucideIcon
  title: string
}

const CAPABILITIES: Feature[] = [
  { icon: Drone, title: 'Drone components', description: 'Reliable sourcing for UAV and agri-drone builds' },
  { icon: Globe, title: 'Import', description: 'Electronic components and equipment from global sources' },
  { icon: Truck, title: 'Domestic procurement', description: 'Fast local sourcing through trusted distributors' },
  { icon: Code, title: 'Embedded & software', description: 'Embedded systems and software development' },
  { icon: Handshake, title: 'Consultancy', description: 'Technical consultancy and customised solutions' },
  { icon: Laptop, title: 'Web applications', description: 'Web application development, like FollowOrders' },
]

const WHY: Feature[] = [
  { icon: Boxes, title: 'One PO, many categories', description: 'Components, instruments, tools and IT on a single order.' },
  { icon: Globe, title: 'Import + domestic', description: "If it isn't on the shelf here, we bring it in." },
  { icon: Wrench, title: 'Engineers in-house', description: 'PCB, firmware and rework expertise behind every quote.' },
  { icon: ClipboardList, title: 'Tracked end to end', description: 'Purchase and dispatch status on FollowOrders.' },
]

type ProductGroup = {
  brands?: string[]
  description: string
  icon: LucideIcon
  image: string
  items: string[]
  query: string
  title: string
}

type ProductSection = {
  groups: ProductGroup[]
  id: string
  subtitle: string
  title: string
}

// Grouped from the Picmychip line card. `query` feeds the shop search so every
// card lands on a live listing; `image` names a banner in /public/line-card.
const PRODUCT_SECTIONS: ProductSection[] = [
  {
    id: 'components',
    title: 'Components & Modules',
    subtitle: 'Passives to microcontrollers, dev boards and the connectors that tie them together.',
    groups: [
      {
        icon: Cpu,
        image: 'components',
        title: 'Electronic Components',
        description: 'Through-hole and SMD parts for prototypes and production runs.',
        items: [
          'Resistors',
          'Capacitors',
          'Inductors',
          'Diodes',
          'Transistors',
          'Voltage regulators',
          'ICs & MCUs',
          'Relays',
          'Switches',
          'LEDs',
          'Displays',
          'Sensors',
          'Potentiometers',
          'Buzzers',
          'Battery holders',
          'Heat sinks',
        ],
        query: 'electronic components',
      },
      {
        brands: ['Waveshare', 'Raspberry Pi'],
        icon: Layers,
        image: 'modules',
        title: 'Dev Boards & Modules',
        description: 'Ready-to-use boards that shorten bring-up.',
        items: [
          'USB hubs',
          'Relay boards 4/8/16 ch',
          'USB to TTL',
          'Raspberry Pi Pico',
          'GPS / BT / Wi-Fi modules',
          'Motor drivers',
          'Breadboards',
        ],
        query: 'module',
      },
      {
        brands: ['Amass'],
        icon: PlugZap,
        image: 'amass',
        title: 'Amass Connectors',
        description: 'High-current power connectors for batteries, ESCs and drones.',
        items: ['XT30 / XT60 / XT90', 'MT & MR series', 'AS anti-spark', 'EC3 / EC5', 'BT & A series', 'Bullet connectors', 'Dust caps'],
        query: 'amass',
      },
      {
        icon: Plug,
        image: 'headers',
        title: 'Headers, D-Sub & FFC',
        description: 'Board-to-board and board-to-wire interconnect.',
        items: ['Male & female headers', 'Single / double row', 'Right angle', 'D-Sub DB9 – DB78', 'D-Sub hoods', 'FFC cables', 'ZIF & non-ZIF'],
        query: 'connector',
      },
      {
        icon: Radio,
        image: 'rf',
        title: 'RF & Coaxial Connectors',
        description: 'Signal-grade connectors from bench to antenna.',
        items: ['BNC', 'TNC', 'SMA / RP-SMA', 'N type', 'MMCX / MCX', 'SMB / SMP', 'U.FL / IPEX', 'UHF · QMA · FME'],
        query: 'rf connector',
      },
    ],
  },
  {
    id: 'test-power',
    title: 'Test, Power & Lab',
    subtitle: 'Bench instruments and power conversion from the brands engineers already trust.',
    groups: [
      {
        brands: ['Keysight', 'Rigol', 'GW Instek', 'Korad'],
        icon: Activity,
        image: 'scopes',
        title: 'Oscilloscopes & Bench Supplies',
        description:
          'InfiniiVision scopes from 70 MHz to 500 MHz, plus programmable single and multi-output DC supplies.',
        items: [
          'DSOX1202G · 1204G · 1204A',
          'DSOX3012T · 3024T · 3054T',
          'Programmable DC supplies',
          'Multi-output supplies',
          'Test leads',
        ],
        query: 'oscilloscope',
      },
      {
        brands: ['Fluke', 'UNI-T'],
        icon: Gauge,
        image: 'meters',
        title: 'Multimeters & Clamp Meters',
        description: 'True-RMS handhelds for the field and the bench.',
        items: ['True-RMS multimeters', 'Clamp meters', 'Flexible current probes', 'Probes & cases'],
        query: 'multimeter',
      },
      {
        brands: ['Mean Well', 'Hi-Link'],
        icon: Zap,
        image: 'power',
        title: 'Power Supplies',
        description: 'AC-DC conversion from 2 W modules to DIN-rail units.',
        items: ['DIN-rail supplies', 'Enclosed SMPS', 'Slim LED drivers', 'PCB-mount AC-DC', 'Open-frame boards'],
        query: 'power supply',
      },
      {
        brands: ['Segger', 'ST', 'PEAK-System'],
        icon: Bug,
        image: 'debug',
        title: 'Programming & Debugging',
        description: 'Probes and adapters for flashing, debugging and CAN.',
        items: ['J-Link probes', 'ST-LINK', 'PCAN-USB adapters', 'JTAG / SWD cables'],
        query: 'programmer',
      },
      {
        brands: ['Rexnord', 'Sunon'],
        icon: Fan,
        image: 'fans',
        title: 'Cooling Fans',
        description: 'Thermal management for enclosures and panels.',
        items: ['AC & DC axial', 'EC & MagLev', 'Blower fans', 'IP68 waterproof', 'Guards & filters'],
        query: 'fan',
      },
    ],
  },
  {
    id: 'soldering-tools',
    title: 'Soldering & Tools',
    subtitle: 'Everything for the rework bench, the assembly line and the site visit.',
    groups: [
      {
        brands: ['Hakko', 'Weller', 'Quick', 'Yihua', 'AiXun', "Pro'sKit"],
        icon: Flame,
        image: 'stations',
        title: 'Soldering Stations',
        description: 'Temperature-controlled stations, hot-air rework and desoldering systems for every bench.',
        items: ['Soldering stations', 'Hot-air rework', 'T12 stations', 'Desoldering stations', 'Irons 25 – 60 W', 'Hot-air nozzles'],
        query: 'soldering station',
      },
      {
        icon: Pipette,
        image: 'solder',
        title: 'Soldering Accessories',
        description: 'Consumables that keep joints clean and tips alive.',
        items: ['Solder wire & paste', 'Flux & IPA', 'Wick & pumps', 'Tips & cleaners', 'Tweezers', 'Kapton tape', 'ESD straps'],
        query: 'solder',
      },
      {
        brands: ['Ingco'],
        icon: Wrench,
        image: 'glue',
        title: 'Glue Guns & Sticks',
        description: 'From 20 W mini guns to 200 W professional units.',
        items: ['Glue guns 20 – 200 W', 'Cordless guns', 'EVA · PO · PA · PUR', 'Coloured & glitter sticks'],
        query: 'glue gun',
      },
      {
        icon: Scissors,
        image: 'cutters',
        title: 'Cutters & Crimping Tools',
        description: 'Precise cuts and repeatable crimps.',
        items: ['Flush & micro-tip cutters', 'Wire strippers', 'Terminal & ferrule crimpers', 'RJ45 / RJ11', 'Ratchet crimpers'],
        query: 'crimping tool',
      },
      {
        brands: ['Bosch'],
        icon: Hammer,
        image: 'tools',
        title: 'Power & Hand Tools',
        description: 'Drills, heat guns and measuring tools for installs.',
        items: ['Drills & drivers', 'Rotary hammers', 'Heat guns', 'Laser measures', 'Tool sets', 'Bits & blades'],
        query: 'tool',
      },
    ],
  },
  {
    id: 'cables-hardware',
    title: 'Cables, Wiring & Hardware',
    subtitle: 'Cables, wire, fasteners and the finishing touches for a clean, serviceable build.',
    groups: [
      {
        icon: Cable,
        image: 'wires',
        title: 'Electrical Wires & Cables',
        description: 'Hook-up to power cable, including high-strand silicone wire for drones and RC.',
        items: ['Silicone wire', 'PVC & hook-up', 'Multicore & power', 'Coax & twisted pair', 'Jumper wires', 'Solar wire', 'Speaker & telephone'],
        query: 'wire',
      },
      {
        icon: Usb,
        image: 'usb',
        title: 'USB, HDMI & Data Cables',
        description: 'Gold-plated and generic data cables in standard lengths.',
        items: ['USB A / B / Micro / Mini', 'Arduino cables', 'USB extensions', 'HDMI cables', 'BNC cords'],
        query: 'cable',
      },
      {
        brands: ['UGREEN'],
        icon: Network,
        image: 'ugreen',
        title: 'UGREEN Accessories',
        description: 'Premium cables, chargers and hubs.',
        items: ['USB-C & Lightning', 'CAT6 / CAT7 / CAT8', 'Nexode GaN chargers', 'Hubs & docks', 'Audio cables'],
        query: 'ugreen',
      },
      {
        icon: Nut,
        image: 'fasteners',
        title: 'Fasteners & Spacers',
        description: 'Metric hardware from M2 to M10.',
        items: ['Screws & bolts', 'Nuts & washers', 'Nylon spacers', 'Brass · Al · SS standoffs'],
        query: 'spacer',
      },
      {
        icon: Tag,
        image: 'cablemgmt',
        title: 'Cable Management',
        description: 'Tie, mount, sleeve and label.',
        items: ['Tie bases', 'Nylon & SS ties', 'Heat-shrink tubing', 'Dual-wall adhesive'],
        query: 'heat shrink',
      },
    ],
  },
  {
    id: 'drones-it',
    title: 'Drones & IT',
    subtitle: 'Agriculture drone parts, and the IT kit to run your office and lab.',
    groups: [
      {
        icon: Drone,
        image: 'drone',
        title: 'Agriculture Drone Parts',
        description: 'Spray-drone subsystems and spares, from flight packs to fittings.',
        items: [
          'LiPo & Li-ion packs (6S 33600 mAh)',
          'Spray pumps',
          'Landing gear & spray booms',
          'Navigation lights',
          '3K carbon tubes 10 – 30 mm OD',
          'Smart chargers 200 – 2400 W',
          'Spray pipes & push fittings 4 – 10 mm',
        ],
        query: 'drone',
      },
      {
        brands: ['Dell', 'Samsung', 'SanDisk', 'HP', 'Kingston', 'Transcend'],
        icon: Laptop,
        image: 'it',
        title: 'Computers, Mobiles & IT',
        description: 'Business laptops, desktops and peripherals for teams.',
        items: ['Dell Latitude · Precision · Vostro', 'OptiPlex desktops', 'Monitors', 'Mobiles', 'Wi-Fi routers', 'Keyboards & mice', 'Pen drives'],
        query: 'laptop',
      },
    ],
  },
]

type PrinterItem = {
  description: string
  image: string
  query: string
  title: string
}

// Printer cut-outs live in /public/line-card/printer-*.webp.
const PRINTER_GROUPS: { printers: PrinterItem[]; title: string }[] = [
  {
    title: 'Garment & textile printing',
    printers: [
      { image: 'dtg', title: 'DTG Printer', query: 'dtg printer', description: 'Prints directly on garments with water-based inks. Best for detailed designs and small batches.' },
      { image: 'dtf', title: 'DTF Printer', query: 'dtf printer', description: 'Prints on PET film with DTF inks, then heat-pressed onto cotton, polyester and blends.' },
      { image: 'dtf-uv', title: 'DTF UV Printer', query: 'uv dtf printer', description: 'Prints UV-curable DTF films for vibrant, durable transfers.' },
      { image: 'sublimation', title: 'Sublimation Printer', query: 'sublimation printer', description: 'Sublimation inks on transfer paper for polyester garments, sportswear and all-over prints.' },
      { image: 'dye-sublimation', title: 'Dye-Sublimation Printer', query: 'dye sublimation printer', description: 'Dye-sublimation inks for polyester fabrics, sportswear and fashion garments.' },
      { image: 'heat-transfer', title: 'Heat Transfer Printer', query: 'heat transfer printer', description: 'Prints on heat-transfer vinyl or paper, applied with a heat press. Ideal for names, numbers and logos.' },
      { image: 'wide-format', title: 'Wide Format Printer', query: 'wide format printer', description: 'Large-size prints on fabric for garment production and fashion applications.' },
    ],
  },
  {
    title: 'Office & photo',
    printers: [
      { image: 'inkjet', title: 'Inkjet Printer', query: 'inkjet printer', description: 'Prints on paper, transfer paper or fabric for custom designs and small runs.' },
      { image: 'laser', title: 'Laser Printer', query: 'laser printer', description: 'Fast toner-based printing, also used on transfer paper for heat-transfer work.' },
      { image: 'photo', title: 'Photo Printer', query: 'photo printer', description: 'High-quality photo prints for samples and custom designs.' },
      { image: 'dot-matrix', title: 'Dot Matrix Printer', query: 'dot matrix printer', description: 'Impact printer for invoices, labels and production records.' },
    ],
  },
  {
    title: 'Labels & barcodes',
    printers: [
      { image: 'thermal', title: 'Thermal Printer', query: 'thermal printer', description: 'Prints labels, barcodes and tags for manufacturing and retail.' },
      { image: 'barcode', title: 'Barcode Printer', query: 'barcode printer', description: 'Barcode labels for tagging, inventory and tracking.' },
    ],
  },
]

const PRINTER_COUNT = PRINTER_GROUPS.reduce((count, group) => count + group.printers.length, 0)
const SECTION_TOTAL = String(6).padStart(2, '0')

const SHOWCASE = ['meters', 'stations', 'modules', 'scopes', 'amass', 'drone']

type Service = {
  icon: LucideIcon
  image: string
  points: string[]
  summary: string
  title: string
}

const ENGINEERING_SERVICES: Service[] = [
  {
    icon: Code,
    image: 'illus-embedded',
    title: 'Embedded Systems & Software',
    summary: 'End-to-end solutions tailored to your product needs.',
    points: [
      'Firmware development (C/C++)',
      'Microcontroller-based design',
      'IoT & connected systems',
      'System integration & debugging',
      'Custom application development',
    ],
  },
  {
    icon: Microscope,
    image: 'bga-machine',
    title: 'BGA Rework & X-Ray Inspection',
    summary: 'Precision rework, reballing and quality analysis.',
    points: ['BGA rework & reballing', 'X-ray inspection', 'Quality & failure analysis', 'Board-level repair'],
  },
]

const TECHNICIAN_FLOW: Feature[] = [
  { icon: ClipboardList, title: 'Share your requirement', description: 'Skills needed, project scope, location and duration' },
  { icon: UserCheck, title: 'We match the right technician', description: 'Screened for soldering, rework, testing or assembly experience' },
  { icon: Building2, title: 'Onsite or at our facility', description: 'Deployed to your site, or working from our Bengaluru lab' },
  { icon: Users, title: 'Scale as you need', description: 'Add or release technicians as your project changes' },
]

const TECHNICIAN_SKILLS = [
  'Soldering & rework',
  'SMD & through-hole assembly',
  'BGA rework',
  'Testing & debugging',
  'Cable & harness assembly',
  'Inspection & QC',
]

const FOLLOWORDERS_STEPS: { icon: LucideIcon; title: string }[] = [
  { icon: ShoppingCart, title: 'Order placed' },
  { icon: Wallet, title: 'Payment pending to vendor' },
  { icon: Truck, title: 'In transit' },
  { icon: Building2, title: 'Received at office' },
  { icon: ReceiptText, title: 'Invoiced' },
  { icon: PackageOpen, title: 'Dispatched' },
  { icon: PackageCheck, title: 'Delivered' },
]

const FOLLOWORDERS_FEATURES: Feature[] = [
  { icon: FileText, title: 'Quote to PO', description: 'Convert a quote into a purchase order in one step.' },
  { icon: Truck, title: 'Purchase & dispatch tracking', description: 'Separate workflows with real-time status updates.' },
  { icon: BarChart3, title: 'Live dashboard & reports', description: 'Status counts and profit / loss insights.' },
  { icon: Repeat, title: 'Multi-purchase / dispatch', description: 'Handles split and complex order scenarios.' },
  { icon: ShieldCheck, title: 'Secure multi-company access', description: 'Role-based login with data isolation.' },
]

const FOLLOWORDERS_BADGES: { icon: LucideIcon; title: string }[] = [
  { icon: ShieldCheck, title: 'Secure access' },
  { icon: RefreshCw, title: 'Real-time updates' },
  { icon: BarChart3, title: 'Profit / loss visibility' },
  { icon: Database, title: 'Data management' },
]

const CUSTOMERS = [
  'Visteon',
  'VVDN Technologies',
  'RFMW Innovations Lab',
  'DRDO',
  'NewSpace Research & Technologies',
  'Zulu Defence',
  'ProcMart',
  'Libre Wireless Technologies',
  'NavaNala Technologies',
  'General Aeronautics',
  'ABS India',
  'Sirena',
  'Dronacharya Tech-Hub',
]

const BRANDS = [
  ...new Set(PRODUCT_SECTIONS.flatMap((section) => section.groups.flatMap((group) => group.brands ?? []))),
]
const CATEGORY_COUNT =
  PRODUCT_SECTIONS.reduce((count, section) => count + section.groups.length, 0) + PRINTER_COUNT

const IconBadge: React.FC<{ className?: string; icon: LucideIcon; size?: 'md' | 'sm' }> = ({
  className = '',
  icon: Icon,
  size = 'md',
}) => (
  <div
    className={`from-orange/25 to-orange/10 flex shrink-0 items-center justify-center bg-gradient-to-br ${
      size === 'sm' ? 'size-9 rounded-lg' : 'size-11 rounded-xl'
    } ${className}`}
  >
    <Icon className={`text-orange ${size === 'sm' ? 'size-4' : 'size-5'}`} />
  </div>
)

const Chips: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="flex flex-wrap gap-1.5">
    {items.map((item) => (
      <li className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs" key={item}>
        {item}
      </li>
    ))}
  </ul>
)

const BrandLine: React.FC<{ brands?: string[] }> = ({ brands }) =>
  brands && brands.length > 0 ? (
    <p className="border-border text-muted-foreground border-t border-dashed pt-3 text-xs">
      <span className="text-primary mr-2 text-[10px] font-semibold tracking-wider uppercase">Brands</span>
      {brands.join(' · ')}
    </p>
  ) : null

const BrowseLink: React.FC = () => (
  <span className="text-primary mt-auto inline-flex items-center gap-1 text-sm font-semibold">
    Browse in shop
    <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
  </span>
)

// Product photos are on white, so their frames stay white in dark mode too.
const ProductPhoto: React.FC<{ alt: string; hero?: boolean; name: string; priority?: boolean }> = ({
  alt,
  hero = false,
  name,
  priority = false,
}) => (
  <Image
    alt={alt}
    className="h-full w-full object-contain"
    height={hero ? 758 : 391}
    priority={priority}
    src={`${ASSET}/${name}${hero ? '-hero' : ''}.webp`}
    unoptimized
    width={hero ? 1100 : 900}
  />
)

const FeaturedCard: React.FC<{ group: ProductGroup; priority?: boolean }> = ({ group, priority }) => (
  <Link
    className="card-hover border-border bg-card group grid overflow-hidden rounded-2xl border md:grid-cols-[1.15fr_1fr]"
    href={`/shop?q=${encodeURIComponent(group.query)}`}
  >
    <div className="border-border flex aspect-[1100/758] items-center justify-center border-b bg-white p-4 md:border-r md:border-b-0">
      <ProductPhoto alt={group.title} hero name={group.image} priority={priority} />
    </div>
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <IconBadge icon={group.icon} />
        <h3 className="text-foreground group-hover:text-primary text-xl font-semibold transition-colors">
          {group.title}
        </h3>
      </div>
      <p className="text-muted-foreground text-sm">{group.description}</p>
      <Chips items={group.items} />
      <BrandLine brands={group.brands} />
      <BrowseLink />
    </div>
  </Link>
)

const ProductCard: React.FC<{ group: ProductGroup }> = ({ group }) => (
  <Link
    className="card-hover border-border bg-card group flex flex-col overflow-hidden rounded-2xl border"
    href={`/shop?q=${encodeURIComponent(group.query)}`}
  >
    <div className="border-border flex aspect-[900/391] items-center justify-center border-b bg-white p-3">
      <ProductPhoto alt={group.title} name={group.image} />
    </div>
    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <IconBadge icon={group.icon} size="sm" />
        <h4 className="text-foreground group-hover:text-primary text-base font-semibold transition-colors">
          {group.title}
        </h4>
      </div>
      <p className="text-muted-foreground text-sm">{group.description}</p>
      <Chips items={group.items} />
      <BrandLine brands={group.brands} />
      <BrowseLink />
    </div>
  </Link>
)

export default function LineCardPage() {
  return (
    <div className="pb-24">
      {/* Hero — always dark, matching the printed cover */}
      <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
        <Image
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50"
          fill
          priority
          sizes="100vw"
          src={`${ASSET}/bg-dark.webp`}
          unoptimized
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-neutral-950/60 via-neutral-950/85 to-neutral-950" />

        <div className="container flex flex-col gap-10 pt-16 pb-14 lg:pt-20">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-[11px] font-semibold tracking-widest uppercase">
                Line Card · 2026
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold tracking-widest text-neutral-300 uppercase">
                <MapPin className="size-3" />
                Bengaluru, India
              </span>
            </div>
            <Image
              alt="Picmychip"
              className="h-14 w-auto self-start sm:h-16"
              height={215}
              priority
              src={`${ASSET}/logo.webp`}
              unoptimized
              width={640}
            />
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              One sourcing partner for all your{' '}
              <span className="text-green-400">electronic components, laptops and IT equipment</span>.
            </h1>
            <p className="max-w-2xl text-neutral-300">
              Electronic components, test equipment, tools, cables and drone parts, backed by an in-house engineering
              team. Imported or procured locally, then dispatched across India.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/rfq">Request a quote</Link>
              </Button>
              <Button
                asChild
                className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                size="lg"
                variant="outline"
              >
                <a download href={PDF_URL}>
                  <Download className="size-4" />
                  Download PDF
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {SHOWCASE.map((name) => (
              <a
                className="flex aspect-[1100/758] items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-lg shadow-black/40 transition-transform hover:-translate-y-0.5"
                href={`#${PRODUCT_SECTIONS.find((section) => section.groups.some((g) => g.image === name))?.id}`}
                key={name}
              >
                <ProductPhoto alt="" hero name={name} priority />
              </a>
            ))}
          </div>

          <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
            {[
              { label: 'Product categories', value: CATEGORY_COUNT },
              { label: 'Brands supplied', value: `${BRANDS.length}+` },
              { label: 'Engineering services', value: ENGINEERING_SERVICES.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <dd className="text-3xl font-semibold text-green-400">{value}</dd>
                <dt className="text-[11px] tracking-widest text-neutral-400 uppercase">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* About */}
      <section className="container mt-16">
        <div className="border-border relative overflow-hidden rounded-3xl border bg-white">
          <Image
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
            fill
            sizes="(min-width: 1024px) 1200px, 100vw"
            src={`${ASSET}/bg-light.webp`}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/20" />
          <div className="relative max-w-xl p-8 sm:p-12">
            <span className="eyebrow">About Picmychip</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Parts, instruments and engineering, from one desk in Bengaluru.
            </h2>
            <p className="mt-3 text-neutral-600">
              Picmychip sources electronic components and equipment for R&amp;D labs, manufacturers, defence and
              aerospace teams, and drone builders. We combine import and domestic procurement with hands-on PCB,
              firmware and rework expertise.
            </p>
          </div>
        </div>

        <h2 className="text-foreground mt-12 mb-5 text-sm font-semibold tracking-wide uppercase">
          What we specialise in
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ description, icon, title }) => (
            <div className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-5" key={title}>
              <IconBadge className="mb-1" icon={icon} />
              <p className="text-foreground font-semibold">{title}</p>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-neutral-950 p-6 text-white sm:p-8">
          <h2 className="text-xs font-semibold tracking-widest text-green-400 uppercase">Why teams choose us</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map(({ description, icon: Icon, title }) => (
              <div className="flex flex-col gap-2" key={title}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-green-400/15">
                  <Icon className="size-5 text-green-400" />
                </div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-neutral-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section jump links */}
      <nav
        aria-label="Line card sections"
        className="bg-background/90 border-border sticky top-0 z-20 mt-16 border-y backdrop-blur"
        id="products"
      >
        <div className="container flex gap-2 overflow-x-auto py-3">
          {PRODUCT_SECTIONS.map((section) => (
            <a
              className="border-border text-muted-foreground hover:text-foreground hover:border-primary shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
              href={`#${section.id}`}
              key={section.id}
            >
              {section.title}
            </a>
          ))}
          <a
            className="border-border text-muted-foreground hover:text-foreground hover:border-primary shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
            href="#printers"
          >
            Printers
          </a>
          <a
            className="border-border text-muted-foreground hover:text-foreground hover:border-primary shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
            href="#services"
          >
            Services
          </a>
          <a
            className="border-border text-muted-foreground hover:text-foreground hover:border-primary shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
            href="#followorders"
          >
            FollowOrders
          </a>
        </div>
      </nav>

      {/* Product line card */}
      <div className="container flex flex-col gap-20 pt-14">
        {PRODUCT_SECTIONS.map((section, index) => {
          const [featured, ...rest] = section.groups
          const isPair = section.groups.length === 2

          return (
            <section className="scroll-mt-20" id={section.id} key={section.id}>
              <div className="mb-8 flex flex-col gap-2">
                <span className="eyebrow">
                  Product line card · {String(index + 1).padStart(2, '0')} /{' '}
                  {SECTION_TOTAL}
                </span>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{section.title}</h2>
                <p className="text-muted-foreground max-w-2xl">{section.subtitle}</p>
              </div>

              <div className="flex flex-col gap-5">
                <FeaturedCard group={featured} priority={index === 0} />
                {isPair ? (
                  <FeaturedCard group={rest[0]} />
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {rest.map((group) => (
                      <ProductCard group={group} key={group.title} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        })}

        <section className="scroll-mt-20" id="printers">
          <div className="mb-8 flex flex-col gap-2">
            <span className="eyebrow">Product line card · {SECTION_TOTAL} / {SECTION_TOTAL}</span>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Printers</h2>
            <p className="text-muted-foreground max-w-2xl">
              Garment, textile, office, photo and label printers, for production lines, print shops and offices.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {PRINTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {group.printers.map((printer) => (
                    <Link
                      className="card-hover border-border bg-card group flex flex-col overflow-hidden rounded-2xl border"
                      href={`/shop?q=${encodeURIComponent(printer.query)}`}
                      key={printer.title}
                    >
                      <div className="border-border aspect-[10/7] border-b bg-white p-3">
                        <Image
                          alt={printer.title}
                          className="h-full w-full object-contain"
                          height={700}
                          src={`${ASSET}/printer-${printer.image}.webp`}
                          unoptimized
                          width={1000}
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <h4 className="text-foreground group-hover:text-primary flex items-center gap-2 text-base font-semibold transition-colors">
                          <Printer className="text-orange size-4" />
                          {printer.title}
                        </h4>
                        <p className="text-muted-foreground text-sm">{printer.description}</p>
                        <BrowseLink />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 rounded-3xl bg-neutral-950 p-6 text-white sm:p-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-green-400 uppercase">Can&apos;t find a part?</h2>
            <p className="mt-3 text-2xl font-semibold">Send us the part number or BOM.</p>
            <p className="mt-2 text-neutral-400">
              Not every part we source is listed here. Our team checks stock, local distributors and import options,
              then comes back with availability, price and lead time.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 md:border-l md:border-white/15 md:pl-8">
            <Button asChild size="lg">
              <Link href="/rfq">Request a quote</Link>
            </Button>
            <a className="hover:text-green-400 inline-flex items-center gap-2 text-sm" href="mailto:sales@picmychip.com">
              <Mail className="size-4 text-green-400" />
              sales@picmychip.com
            </a>
            <a className="hover:text-green-400 inline-flex items-center gap-2 text-sm" href="tel:+919087606060">
              <Phone className="size-4 text-green-400" />
              +91 90876 06060
            </a>
          </div>
        </div>
      </div>

      {/* Engineering services */}
      <section className="container mt-24 scroll-mt-20" id="services">
        <div className="mb-8 flex flex-col gap-2">
          <span className="eyebrow">Engineering services</span>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Engineers who can use the parts, too</h2>
          <p className="text-muted-foreground max-w-2xl">
            Delivered by experienced embedded and rework professionals.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {ENGINEERING_SERVICES.map(({ icon, image, points, summary, title }) => (
            <div className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border" key={title}>
              <div className="border-border flex aspect-[4/3] items-center justify-center border-b bg-white p-4">
                <Image
                  alt={title}
                  className="h-full w-full object-contain"
                  height={410}
                  src={`${ASSET}/${image}.webp`}
                  unoptimized
                  width={512}
                />
              </div>
              <div className="flex flex-col gap-3 p-6">
                <div className="flex items-center gap-3">
                  <IconBadge icon={icon} size="sm" />
                  <h3 className="text-foreground text-lg font-semibold">{title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{summary}</p>
                <ul className="flex flex-col gap-2">
                  {points.map((point) => (
                    <li className="text-foreground flex items-start gap-2 text-sm" key={point}>
                      <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="border-border bg-card mt-6 grid grid-cols-1 overflow-hidden rounded-3xl border md:grid-cols-2">
          <div className="relative aspect-[5/4] bg-neutral-100 md:aspect-auto">
            <Image
              alt="Picmychip technician at the rework bench"
              className="object-cover"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              src={`${ASSET}/illus-tech.webp`}
              unoptimized
            />
          </div>
          <div className="flex flex-col p-6 sm:p-10">
            <span className="eyebrow">Technician support</span>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              We provide qualified technicians as per your requirements
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Skilled, experienced hands for your production line, lab or project, for a day, a batch or the long run.
            </p>

            <ol className="mt-6 flex flex-col">
              {TECHNICIAN_FLOW.map(({ description, icon: Icon, title }, index) => (
                <li className="relative flex gap-4 pb-5 last:pb-0" key={title}>
                  {index < TECHNICIAN_FLOW.length - 1 && (
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

            <ul className="border-border mt-6 flex flex-wrap gap-1.5 border-t pt-5">
              {TECHNICIAN_SKILLS.map((skill) => (
                <li className="bg-muted text-foreground rounded-full px-2.5 py-1 text-xs font-medium" key={skill}>
                  {skill}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/request-technician">Request technicians</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/services">See all services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FollowOrders */}
      <section className="container mt-24 scroll-mt-20" id="followorders">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Image
                alt="FollowOrders"
                className="h-16 w-auto rounded-xl bg-white p-1"
                height={296}
                src={`${ASSET}/fo-logo.webp`}
                unoptimized
                width={240}
              />
              <div>
                <span className="eyebrow">Our software</span>
                <h2 className="text-3xl font-semibold tracking-tight">FollowOrders</h2>
              </div>
            </div>
            <p className="text-muted-foreground">
              A web-based <strong className="text-foreground">purchase order tracking system</strong> that manages the
              full lifecycle of purchase and dispatch operations. One place to track order progress, vendor
              interactions, shipment updates and delivery status, in real time.
            </p>
            <Button asChild className="w-fit">
              <a href="https://www.followorders.in" rel="noopener noreferrer" target="_blank">
                Visit followorders.in
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
          <div className="border-border overflow-hidden rounded-3xl border bg-white">
            <Image
              alt="FollowOrders order journey from purchase to delivery"
              className="h-auto w-full"
              height={1000}
              src={`${ASSET}/followorders-scene.webp`}
              unoptimized
              width={1000}
            />
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-neutral-950 p-6 text-white sm:p-8">
          <h3 className="text-xs font-semibold tracking-widest text-green-400 uppercase">Order journey</h3>
          <ol className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-7">
            {FOLLOWORDERS_STEPS.map(({ icon: Icon, title }, index) => (
              <li className="flex flex-col items-center gap-2 text-center" key={title}>
                <span className="flex size-12 items-center justify-center rounded-full border-2 border-green-400 bg-neutral-900 text-green-400">
                  <Icon className="size-5" />
                </span>
                <span className="text-xs font-semibold text-green-400">{index + 1}</span>
                <span className="text-sm text-neutral-200">{title}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FOLLOWORDERS_FEATURES.map(({ description, icon, title }) => (
            <div className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-5" key={title}>
              <IconBadge className="mb-1" icon={icon} />
              <p className="text-foreground font-semibold">{title}</p>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          ))}
          <ul className="bg-muted flex flex-col justify-center gap-3 rounded-2xl p-5">
            {FOLLOWORDERS_BADGES.map(({ icon: Icon, title }) => (
              <li className="text-foreground flex items-center gap-2.5 text-sm font-medium" key={title}>
                <Icon className="text-primary size-4" />
                {title}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Customers & brands */}
      <section className="container mt-24">
        <div className="mb-6 flex flex-col gap-2">
          <span className="eyebrow">Customers</span>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Trusted by teams in defence, aerospace &amp; electronics
          </h2>
        </div>
        <div className="overflow-hidden rounded-3xl bg-black">
          <Image
            alt={`Picmychip customers: ${CUSTOMERS.join(', ')}`}
            className="h-auto w-full"
            height={914}
            sizes="(min-width: 1280px) 1200px, 100vw"
            src={`${ASSET}/customers.webp`}
            unoptimized
            width={1600}
          />
        </div>

        <h3 className="text-foreground mt-12 mb-5 text-sm font-semibold tracking-wide uppercase">Brands we supply</h3>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex shrink-0 gap-3">
            <div className="border-border flex h-20 w-32 items-center justify-center rounded-xl border bg-white p-3">
              <Image
                alt="Mean Well"
                className="max-h-full w-auto object-contain"
                height={173}
                src={`${ASSET}/brand-meanwell.webp`}
                unoptimized
                width={292}
              />
            </div>
            <div className="border-border flex h-20 w-32 items-center justify-center rounded-xl border bg-white p-3">
              <Image
                alt="Hi-Link"
                className="max-h-full w-auto object-contain"
                height={36}
                src={`${ASSET}/brand-hilink.webp`}
                unoptimized
                width={137}
              />
            </div>
          </div>
          <ul className="flex flex-wrap gap-2">
            {BRANDS.filter((brand) => brand !== 'Mean Well' && brand !== 'Hi-Link').map((brand) => (
              <li className="bg-muted text-foreground rounded-md px-3 py-1.5 text-sm font-medium" key={brand}>
                {brand}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="container mt-24">
        <div className="grid grid-cols-1 gap-10 rounded-3xl bg-neutral-950 p-6 text-white sm:p-10 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Image
              alt="Picmychip"
              className="h-10 w-auto self-start"
              height={215}
              src={`${ASSET}/logo.webp`}
              unoptimized
              width={640}
            />
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Have a BOM or a part number?</h2>
            <p className="text-neutral-400">
              Send it over. We&apos;ll come back with availability, pricing and lead time, from stock, a local
              distributor or an import.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/rfq">Request a quote</Link>
              </Button>
              <Button
                asChild
                className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                size="lg"
                variant="outline"
              >
                <a download href={PDF_URL}>
                  <Download className="size-4" />
                  Download line card
                </a>
              </Button>
            </div>
            <div className="mt-2 hidden items-center gap-4 sm:flex">
              <Image
                alt="QR code linking to picmychip.com"
                className="size-24 rounded-lg bg-white p-1.5 [image-rendering:pixelated]"
                height={300}
                src={`${ASSET}/qr.webp`}
                unoptimized
                width={300}
              />
              <p className="text-sm text-neutral-400">
                Scan to share
                <br />
                <span className="font-semibold text-white">www.picmychip.com</span>
              </p>
            </div>
          </div>

          <address className="flex flex-col gap-4 not-italic md:border-l md:border-white/15 md:pl-10">
            <p className="font-semibold text-green-400">BKC Picmychip Tech Services Private Limited</p>
            <div className="flex items-start gap-3 text-sm text-neutral-200">
              <MapPin className="mt-0.5 size-4 shrink-0 text-green-400" />
              F-86, 3rd Floor, Vinyas Building, ITI Limited, Dooravani Nagar, Bengaluru Urban, Karnataka 560016, India
            </div>
            <a className="hover:text-green-400 flex items-center gap-3 text-sm" href="mailto:sales@picmychip.com">
              <Mail className="size-4 shrink-0 text-green-400" />
              sales@picmychip.com
            </a>
            <a className="hover:text-green-400 flex items-center gap-3 text-sm" href="tel:+918025611611">
              <Phone className="size-4 shrink-0 text-green-400" />
              080-2561 1611
            </a>
            <a className="hover:text-green-400 flex items-center gap-3 text-sm" href="tel:+919087606060">
              <Smartphone className="size-4 shrink-0 text-green-400" />
              +91 90876 06060
            </a>
            <a
              className="hover:text-green-400 flex items-center gap-3 text-sm"
              href="https://www.followorders.in"
              rel="noopener noreferrer"
              target="_blank"
            >
              <ClipboardList className="size-4 shrink-0 text-green-400" />
              www.followorders.in
            </a>
            <Image
              alt="#startupindia"
              className="mt-auto h-7 w-auto self-start"
              height={86}
              src={`${ASSET}/startupindia.webp`}
              unoptimized
              width={400}
            />
          </address>
        </div>
      </section>
    </div>
  )
}
