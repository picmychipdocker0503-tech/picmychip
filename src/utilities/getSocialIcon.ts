import { Facebook, Instagram, Linkedin, MapPin, XIcon, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const getSocialIcon = (url: string): LucideIcon | null => {
  if (/facebook\.com/.test(url)) return Facebook
  if (/(twitter\.com|x\.com)/.test(url)) return XIcon
  if (/instagram\.com/.test(url)) return Instagram
  if (/linkedin\.com/.test(url)) return Linkedin
  if (/youtube\.com/.test(url)) return Youtube
  if (/(google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/.test(url)) return MapPin
  return null
}
