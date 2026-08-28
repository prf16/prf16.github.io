/**
 * Plume rc.136 trims every annotation line, flattening nested Markdown lists.
 * Replace only its definition rule; keep the theme's reference renderer/UI.
 */
export function preserveAnnotationIndent(md) {
  md.block.ruler.at('annotation', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const firstLine = state.src.slice(start, state.eMarks[startLine])
    const match = /^\[\+([^\] ]+)\]:/.exec(firstLine)
    if (!match)
      return false
    if (silent)
      return true

    let nextLine = startLine + 1
    let indent = Infinity
    while (nextLine < endLine) {
      if (!state.isEmpty(nextLine)) {
        if (state.sCount[nextLine] < state.blkIndent + 2)
          break
        indent = Math.min(indent, state.sCount[nextLine])
      }
      nextLine++
    }

    // Remove the common outer indent, preserving nested lists, code and breaks.
    const continuation = state.getLines(
      startLine + 1, nextLine, Number.isFinite(indent) ? indent : 0, false,
    )
    const source = firstLine.slice(match[0].length).trimStart()
      + (nextLine > startLine + 1 ? `\n${continuation}` : '')
    const annotations = state.env.annotations ??= {}
    const annotation = annotations[`:${match[1]}`] ??= { sources: [], rendered: [] }
    annotation.sources.push(source)
    state.line = nextLine
    return true
  }, { alt: ['paragraph', 'reference'] })
}
