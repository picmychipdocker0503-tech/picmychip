import type { File as PayloadFile } from 'payload'

/** Downloads a remote image and shapes it as Payload's upload `file` param.
 * Same pattern already used in src/endpoints/seed/index.ts. */
export async function fetchFileByURL(url: string): Promise<PayloadFile> {
  const res = await fetch(url, { method: 'GET' })

  if (!res.ok) {
    throw new Error(`Failed to fetch image from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop()?.split('?')[0] || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: res.headers.get('content-type') || `image/${url.split('.').pop()?.split('?')[0] || 'jpeg'}`,
    size: data.byteLength,
  }
}
