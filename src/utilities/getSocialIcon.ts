import { Facebook, Instagram, Linkedin, XIcon, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const getSocialIcon = (url: string): LucideIcon | null => {
  if (/facebook\.com/.test(url)) return Facebook
  if (/(twitter\.com|x\.com)/.test(url)) return XIcon
  if (/instagram\.com/.test(url)) return Instagram
  if (/linkedin\.com/.test(url)) return Linkedin
  if (/youtube\.com/.test(url)) return Youtube
  return null
}
