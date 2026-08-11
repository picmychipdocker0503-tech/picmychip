'use client'

import {
    BadgeCheck,
    Boxes,
    CircuitBoard,
    Cpu,
    Headphones,
    Heart,
    Scale,
    ShieldCheck,
    ShoppingCart,
    Truck,
    Zap,
} from 'lucide-react'
import * as React from 'react'

import { CategoryCard } from '@/components/pmc-ui/marketplace/CategoryCard'
import { CompareTable } from '@/components/pmc-ui/marketplace/CompareTable'
import { DatasheetViewer } from '@/components/pmc-ui/marketplace/DatasheetViewer'
import { FeatureGrid } from '@/components/pmc-ui/marketplace/FeatureGrid'
import { Footer } from '@/components/pmc-ui/marketplace/Footer'
import { HeroBanner } from '@/components/pmc-ui/marketplace/HeroBanner'
import { Navbar } from '@/components/pmc-ui/marketplace/Navbar'
import { ProductCard } from '@/components/pmc-ui/marketplace/ProductCard'
import { RFQButton } from '@/components/pmc-ui/marketplace/RFQButton'
import { SearchBar } from '@/components/pmc-ui/marketplace/SearchBar'
import { Accordion } from '@/components/pmc-ui/primitives/Accordion'
import { Badge } from '@/components/pmc-ui/primitives/Badge'
import { Breadcrumb } from '@/components/pmc-ui/primitives/Breadcrumb'
import { Button } from '@/components/pmc-ui/primitives/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/pmc-ui/primitives/Card'
import { Drawer } from '@/components/pmc-ui/primitives/Drawer'
import { Input } from '@/components/pmc-ui/primitives/Input'
import { Modal } from '@/components/pmc-ui/primitives/Modal'
import { Pagination } from '@/components/pmc-ui/primitives/Pagination'
import { Tabs } from '@/components/pmc-ui/primitives/Tabs'

const swatches = [
  { name: 'pmc-blue-600', className: 'bg-pmc-blue-600' },
  { name: 'pmc-blue-800', className: 'bg-pmc-blue-800' },
  { name: 'pmc-orange-500', className: 'bg-pmc-orange-500' },
  { name: 'pmc-orange-700', className: 'bg-pmc-orange-700' },
  { name: 'pmc-ink-900', className: 'bg-pmc-ink-900' },
  { name: 'pmc-slate-200', className: 'bg-pmc-slate-200' },
]

const sampleProducts = [
  {
    id: 'p1',
    title: 'STM32F103C8T6 ARM Cortex-M3 MCU',
    href: '#',
    imageUrl: undefined,
    brand: 'STMicroelectronics',
    partNumber: 'STM32F103C8T6',
    price: '$2.14',
    compareAtPrice: '$2.60',
    stockStatus: 'in-stock' as const,
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: 'p2',
    title: 'LM358 Dual Op-Amp, SOIC-8',
    href: '#',
    imageUrl: undefined,
    brand: 'Texas Instruments',
    partNumber: 'LM358DR',
    price: '$0.18',
    stockStatus: 'low-stock' as const,
    rating: 4,
    reviewCount: 54,
  },
  {
    id: 'p3',
    title: '10k Ohm 0603 Chip Resistor (Pack of 100)',
    href: '#',
    imageUrl: undefined,
    brand: 'Yageo',
    partNumber: 'RC0603FR-0710KL',
    price: '$1.05',
    stockStatus: 'out-of-stock' as const,
    rating: 5,
    reviewCount: 12,
  },
]

export default function PmcUiPreviewPage() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [page, setPage] = React.useState(3)

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="mx-auto max-w-[86rem] px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-pmc-ink-900">PMC UI — component preview</h1>
        <p className="mt-1 text-sm text-pmc-ink-500">
          Internal reference for the PMC UI design system. Not linked from the live site nav.
        </p>

        {/* Tokens */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-pmc-ink-900">Tokens</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {swatches.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-2">
                <div className={`size-14 rounded-md border border-pmc-slate-200 ${s.className}`} />
                <span className="text-xs text-pmc-ink-500">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">Button</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary">Add to cart</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link button</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg" leftIcon={<ShoppingCart className="size-4" />}>
              With icon
            </Button>
          </div>
        </section>

        {/* Input */}
        <section className="mt-12 max-w-sm">
          <h2 className="text-lg font-semibold text-pmc-ink-900">Input</h2>
          <div className="mt-4 flex flex-col gap-4">
            <Input label="Email address" placeholder="you@company.com" />
            <Input label="Part number" error="This field is required" />
          </div>
        </section>

        {/* Badge */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">Badge</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="in-stock">In stock</Badge>
            <Badge variant="low-stock">Low stock</Badge>
            <Badge variant="out-of-stock">Out of stock</Badge>
            <Badge variant="new">New</Badge>
            <Badge variant="discount">-20%</Badge>
            <Badge variant="neutral">RoHS</Badge>
          </div>
        </section>

        {/* Card */}
        <section className="mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Card hoverable>
            <CardHeader>
              <CardTitle>Bulk pricing</CardTitle>
              <CardDescription>Volume discounts on 1,000+ units.</CardDescription>
            </CardHeader>
            <CardContent>
              <RFQButton buttonSize="sm" productTitle="Sample product" partNumber="ABC-123" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Static card</CardTitle>
              <CardDescription>No hover motion.</CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Modal / Drawer */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">Modal &amp; Drawer</h2>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Open drawer
            </Button>
          </div>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm order" description="Review before submitting.">
            <p className="text-sm text-pmc-ink-600">This is placeholder modal content.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Confirm</Button>
            </div>
          </Modal>
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters" side="right">
            <p className="text-sm text-pmc-ink-600">Placeholder filter controls.</p>
          </Drawer>
        </section>

        {/* Tabs */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">Tabs</h2>
          <div className="mt-4">
            <Tabs
              tabs={[
                { id: 'overview', label: 'Overview', content: <p className="text-sm text-pmc-ink-600">Overview content.</p> },
                { id: 'specs', label: 'Specifications', content: <p className="text-sm text-pmc-ink-600">Spec table goes here.</p> },
                { id: 'reviews', label: 'Reviews', content: <p className="text-sm text-pmc-ink-600">Customer reviews.</p> },
              ]}
            />
          </div>
        </section>

        {/* Accordion */}
        <section className="mt-12 max-w-2xl">
          <h2 className="text-lg font-semibold text-pmc-ink-900">Accordion</h2>
          <div className="mt-4">
            <Accordion
              items={[
                { id: 'a1', title: 'What is the lead time?', content: 'Typically 2-3 business days for in-stock items.' },
                { id: 'a2', title: 'Do you support bulk RFQs?', content: 'Yes, use the Request a quote button on any product.' },
              ]}
            />
          </div>
        </section>

        {/* Breadcrumb / Pagination */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">Breadcrumb &amp; Pagination</h2>
          <div className="mt-4 flex flex-col gap-6">
            <Breadcrumb
              items={[
                { label: 'Home', href: '#' },
                { label: 'Semiconductors', href: '#' },
                { label: 'Microcontrollers', href: '#' },
                { label: 'STM32F103C8T6' },
              ]}
            />
            <Pagination page={page} totalPages={12} onPageChange={setPage} />
          </div>
        </section>

        {/* SearchBar */}
        <section className="mt-12 max-w-lg">
          <h2 className="text-lg font-semibold text-pmc-ink-900">SearchBar</h2>
          <div className="mt-4">
            <SearchBar
              suggestions={[
                { id: 's1', label: 'STM32F103C8T6', description: 'Microcontroller · STMicroelectronics', href: '#' },
                { id: 's2', label: 'STM32F407VGT6', description: 'Microcontroller · STMicroelectronics', href: '#' },
              ]}
            />
          </div>
        </section>

        {/* HeroBanner */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">HeroBanner</h2>
          <div className="mt-4">
            <HeroBanner
              eyebrow="New arrivals"
              heading="Genuine components, shipped same day"
              copy="Source from 500+ authorized brands with real-time stock and instant datasheets."
              ctas={[
                { label: 'Shop now', href: '#' },
                { label: 'Request a quote', href: '#', variant: 'secondary' },
              ]}
              media={<div className="flex aspect-video items-center justify-center text-pmc-ink-300"><Cpu className="size-16" /></div>}
            />
          </div>
        </section>

        {/* FeatureGrid */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">FeatureGrid</h2>
          <div className="mt-4">
            <FeatureGrid
              items={[
                { icon: <Truck className="size-5" />, title: 'Same-day shipping', description: 'Orders before 3pm ship same day.' },
                { icon: <ShieldCheck className="size-5" />, title: 'Genuine parts', description: 'Traceable to authorized distributors.' },
                { icon: <BadgeCheck className="size-5" />, title: 'RFQ support', description: 'Bulk pricing on request.' },
                { icon: <Headphones className="size-5" />, title: '24/7 support', description: 'Engineers on call.' },
              ]}
            />
          </div>
        </section>

        {/* BrandCarousel */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">BrandCarousel</h2>
          <div className="mt-4 flex items-center gap-12 rounded-lg border border-pmc-slate-200 p-6 text-pmc-ink-400">
            <Zap className="size-8" /> <CircuitBoard className="size-8" /> <Boxes className="size-8" />
            <Cpu className="size-8" /> <Zap className="size-8" /> <CircuitBoard className="size-8" />
          </div>
          <p className="mt-2 text-xs text-pmc-ink-400">
            (Preview uses icon placeholders — pass real brand logo URLs via <code>logoUrl</code> in production.)
          </p>
        </section>

        {/* ProductCard */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">ProductCard</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sampleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* CategoryCard */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">CategoryCard</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CategoryCard title="Microcontrollers" href="#" count={2140} icon={<Cpu />} />
            <CategoryCard title="Passives" href="#" count={8420} icon={<Boxes />} />
            <CategoryCard title="Connectors" href="#" count={1310} icon={<CircuitBoard />} />
            <CategoryCard title="Power" href="#" count={960} icon={<Zap />} />
          </div>
        </section>

        {/* CompareTable */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">CompareTable</h2>
          <div className="mt-4">
            <CompareTable
              products={[
                { id: 'p1', title: 'STM32F103C8T6' },
                { id: 'p2', title: 'STM32F407VGT6' },
              ]}
              specs={[
                { label: 'Core', values: { p1: 'Cortex-M3', p2: 'Cortex-M4' } },
                { label: 'Flash', values: { p1: '64 KB', p2: '1 MB' } },
                { label: 'Package', values: { p1: 'LQFP48', p2: 'LQFP100' } },
              ]}
            />
          </div>
        </section>

        {/* DatasheetViewer */}
        <section className="mt-12 max-w-xl">
          <h2 className="text-lg font-semibold text-pmc-ink-900">DatasheetViewer</h2>
          <div className="mt-4">
            <DatasheetViewer
              datasheets={[
                { title: 'STM32F103C8T6 Datasheet.pdf', fileUrl: '#', fileSize: '1.8 MB' },
                { title: 'Application Note AN2606.pdf', fileUrl: '#', fileSize: '640 KB' },
              ]}
            />
          </div>
        </section>

        {/* RFQButton (standalone) */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-pmc-ink-900">RFQButton</h2>
          <div className="mt-4">
            <RFQButton productTitle="STM32F103C8T6 ARM Cortex-M3 MCU" partNumber="STM32F103C8T6" />
          </div>
        </section>
      </div>

      {/* Navbar */}
      <section className="mt-12">
        <h2 className="mx-auto max-w-[86rem] px-4 text-lg font-semibold text-pmc-ink-900 sm:px-6">Navbar</h2>
        <div className="mt-4 border-y border-pmc-slate-200">
          <Navbar
            logo={<span className="text-lg font-bold text-pmc-blue-800">Picmychip</span>}
            navItems={[
              {
                label: 'Semiconductors',
                href: '#',
                megaMenu: {
                  columns: [
                    { heading: 'Microcontrollers', links: [{ label: 'ARM Cortex-M', href: '#' }, { label: '8-bit MCUs', href: '#' }] },
                    { heading: 'Analog', links: [{ label: 'Op-amps', href: '#' }, { label: 'Comparators', href: '#' }] },
                  ],
                  promo: { title: 'New: RISC-V dev boards', href: '#' },
                },
              },
              { label: 'Passives', href: '#' },
              { label: 'Connectors', href: '#' },
              { label: 'Tools & Supplies', href: '#' },
            ]}
            actions={
              <>
                <button aria-label="Wishlist" className="inline-flex size-10 items-center justify-center rounded-md text-pmc-ink-700 hover:bg-pmc-slate-100">
                  <Heart className="size-5" />
                </button>
                <button aria-label="Compare" className="inline-flex size-10 items-center justify-center rounded-md text-pmc-ink-700 hover:bg-pmc-slate-100">
                  <Scale className="size-5" />
                </button>
                <button aria-label="Cart" className="inline-flex size-10 items-center justify-center rounded-md text-pmc-ink-700 hover:bg-pmc-slate-100">
                  <ShoppingCart className="size-5" />
                </button>
              </>
            }
            searchSuggestions={[]}
          />
        </div>
      </section>

      {/* Footer */}
      <section className="mt-12">
        <h2 className="mx-auto max-w-[86rem] px-4 text-lg font-semibold text-pmc-ink-900 sm:px-6">Footer</h2>
        <div className="mt-4 border-y border-pmc-slate-200">
          <Footer
            columns={[
              { title: 'Shop', links: [{ label: 'All products', href: '#' }, { label: 'Brands', href: '#' }] },
              { title: 'Support', links: [{ label: 'Contact', href: '#' }, { label: 'Returns', href: '#' }] },
              { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Careers', href: '#' }] },
            ]}
          />
        </div>
      </section>
    </div>
  )
}
