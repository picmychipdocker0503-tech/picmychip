/** Derives an alt text from a filename — "usb_cable_black.jpg" -> "Usb Cable
 * Black" — or undefined when the filename has nothing usable (e.g. a bare
 * hash with no letters). */
export function altFromFilename(filename: string): string | undefined {
  const cleaned = filename
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
  if (!cleaned) return undefined

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
