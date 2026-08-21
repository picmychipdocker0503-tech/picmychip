import Script from 'next/script'
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

export const JsonLd: React.FC<Props> = ({ data }) => {
  const json = toSafeJsonLd(data)

  return (
    <Script
      dangerouslySetInnerHTML={{ __html: json }}
      id={toScriptId(json)}
      strategy="afterInteractive"
      type="application/ld+json"
    />
  )
}
