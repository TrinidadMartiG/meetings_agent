// Minimal markdown renderer — no external dependencies
// Supports: **bold**, *italic*, bullet lists (- / *), numbered lists (1.)

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

export function SimpleMarkdown({ children }: { children: string }) {
  const lines = children.split("\n")
  const output: React.ReactNode[] = []
  let ulItems: string[] = []
  let olItems: string[] = []

  const flushUl = () => {
    if (ulItems.length) {
      output.push(
        <ul key={output.length} className="list-disc pl-4 my-1 space-y-0.5">
          {ulItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ul>
      )
      ulItems = []
    }
  }
  const flushOl = () => {
    if (olItems.length) {
      output.push(
        <ol key={output.length} className="list-decimal pl-4 my-1 space-y-0.5">
          {olItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ol>
      )
      olItems = []
    }
  }

  for (const line of lines) {
    const ulMatch = line.match(/^[-*]\s+(.+)/)
    const olMatch = line.match(/^\d+\.\s+(.+)/)
    if (ulMatch) {
      flushOl(); ulItems.push(ulMatch[1])
    } else if (olMatch) {
      flushUl(); olItems.push(olMatch[1])
    } else {
      flushUl(); flushOl()
      if (line.trim() === "") {
        output.push(<br key={output.length} />)
      } else {
        output.push(<p key={output.length} className="my-0">{renderInline(line)}</p>)
      }
    }
  }
  flushUl(); flushOl()
  return <div className="text-sm text-gray-700 leading-relaxed">{output}</div>
}
