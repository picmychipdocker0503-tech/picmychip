import { Search } from '@/components/Search'
import { Button } from '@/components/ui/button'
import { HomeIcon, StoreIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span aria-hidden className="text-primary/15 text-7xl font-black tracking-tight select-none sm:text-8xl">
        404
      </span>
      <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Page Not Found</h1>
      <p className="text-muted-foreground mt-3 max-w-md">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. Try searching for what you need
        below.
      </p>

      <div className="mt-8 w-full max-w-md">
        <Suspense fallback={null}>
          <Search />
        </Suspense>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="default">
          <Link href="/shop">
            <StoreIcon />
            Browse Catalog
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <HomeIcon />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  )
}
