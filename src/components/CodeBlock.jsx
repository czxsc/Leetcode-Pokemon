import { highlight } from '../lib/highlight'

export function CodeBlock({ code, language }) {
  return (
    <pre
      dangerouslySetInnerHTML={{
        __html: highlight(code, language || 'python'),
      }}
    />
  )
}
