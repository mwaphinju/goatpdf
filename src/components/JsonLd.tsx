/**
 * Embeds a JSON-LD structured-data block. The `<script type="application/ld+json">`
 * pattern requires dangerouslySetInnerHTML — there is no other way to put raw,
 * non-executable JSON text into a script tag from React — but every caller in
 * this app builds `data` entirely from static, developer-authored content in
 * lib/tools.ts and lib/structuredData.ts, never from user input. The `<`
 * escape below is a defensive measure against a `</script>` breakout, not a
 * response to any actual untrusted input here.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
