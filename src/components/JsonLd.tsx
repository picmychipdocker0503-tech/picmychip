import React from 'react'

type Props = {
  data: object
}

/**
 * `JSON.stringify` doesn't escape `<`, so any string value nested anywhere
 * in `data` — a product title, a review comment, CMS copy — that happens to
 * contain `</script>` would close this tag early and let the rest of the
 * string execute as HTML/JS. Escaping `<` to its unicode form breaks that
 * sequence for the HTML parser while staying valid, semantically identical
 * JSON for anything reading the script's content as structured data.
 */
const toSafeJsonLd = (data: object): string => JSON.stringify(data).replace(/</g, '\\u003c')

const toScriptId = (json: string): string => {
  let hash = 0
  for (let index = 0; index < json.length; index += 1) {
    hash = (hash * 31 + json.charCodeAt(index)) | 0
  }
  return `json-ld-${Math.abs(hash)}`
}

/**
 * A plain <script> tag, NOT next/script — next/script's default
 * "afterInteractive" strategy injects the tag client-side after hydration,
 * so it's absent from the raw SSR HTML entirely. Crawlers and SEO auditors
 * that read static HTML (rather than executing JS) would see zero
 * structured data even though this component was rendered on every page —
 * confirmed this was exactly why an SEO audit reported no Schema.org data
 * despite Organization/Product/FAQ/Article JSON-LD already existing in code.
 */
export const JsonLd: React.FC<Props> = ({ data }) => {
  const json = toSafeJsonLd(data)

  return (
    <script
      dangerouslySetInnerHTML={{ __html: json }}
      id={toScriptId(json)}
      type="application/ld+json"
    />
  )
}
