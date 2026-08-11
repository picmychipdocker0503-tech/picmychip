import { Grid } from '@/components/Grid'
import { Media } from '@/components/Media'
import { getBlogPostIcon } from '@/components/illustrations/blogIcons'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

export const metadata = {
  description: 'Stories, updates, and behind-the-scenes posts from the Picmychip team.',
  title: 'Blog',
}

export default async function BlogPage() {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'guides',
    depth: 1,
    draft: false,
    overrideAccess: false,
    sort: '-updatedAt',
    where: { authorName: { exists: true } },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      hero: true,
      coverImage: true,
      authorName: true,
      authorTitle: true,
    },
  })

  return (
    <div className="container py-16">
      <h1 className="mb-2 text-3xl font-bold">Blog</h1>
      <p className="text-muted-foreground mb-8">Stories, updates, and behind-the-scenes posts from the team.</p>

      {posts.docs.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.docs.map((post) => {
            const media = post.hero?.media || post.coverImage
            const Icon = getBlogPostIcon(post.slug)

            return (
              <Link
                className="group flex flex-col gap-4"
                href={`/blog/${post.slug}`}
                key={post.id}
              >
                {media && typeof media === 'object' ? (
                  <Media
                    className="relative aspect-video overflow-hidden rounded-2xl border border-border"
                    fill
                    imgClassName="object-cover"
                    resource={media}
                  />
                ) : (
                  <div className="card-hover from-orange/25 to-orange/10 border-orange/20 relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br">
                    <Icon className="text-orange size-14" />
                  </div>
                )}
                <div>
                  <div className="font-semibold group-hover:text-primary transition-colors">{post.title}</div>
                  {post.excerpt && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{post.excerpt}</p>
                  )}
                  {post.authorName && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="avatar avatar-placeholder">
                        <div className="bg-primary/10 text-primary w-7 rounded-full">
                          <span className="text-xs font-semibold">{post.authorName.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-foreground">{post.authorName}</div>
                        {post.authorTitle && <div className="text-muted-foreground">{post.authorTitle}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </Grid>
      ) : (
        <p className="text-muted-foreground">No posts published yet.</p>
      )}
    </div>
  )
}
