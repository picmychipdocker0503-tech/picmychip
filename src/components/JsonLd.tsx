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

export const JsonLd: React.FC<Props> = ({ data }) => (
  <script dangerouslySetInnerHTML={{ __html: toSafeJsonLd(data) }} type="application/ld+json" />
)
