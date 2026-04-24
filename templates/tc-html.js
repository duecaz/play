import { esc } from '../core/html.js'

/* Build the innerHTML for the correction text area.
   Blank zones (commas/punctuation) attach to the preceding word in a
   white-space:nowrap span so they can't orphan at the start of a line. */
export function buildHTML(orig, correct) {
  const parts = []   // { type: 'text'|'span'|'nowrap', html }

  for (let i = 0; i < orig.length; i++) {
    if (orig[i] !== correct[i]) {
      const blank = orig[i] === '_'
      const cls   = blank ? 'acc-zone acc-zone--blank' : 'acc-zone'
      const span  = `<span class="${cls}" data-correct="${esc(correct[i])}" data-index="${i}">${blank ? esc(correct[i]) : esc(orig[i])}</span>`

      if (blank && parts.length > 0 && parts[parts.length - 1].type === 'text') {
        const prev      = parts.pop()
        const lastSpace = prev.html.lastIndexOf(' ')
        if (lastSpace >= 0) {
          if (lastSpace + 1 > 0) parts.push({ type: 'text', html: prev.html.slice(0, lastSpace + 1) })
          parts.push({ type: 'nowrap', html: prev.html.slice(lastSpace + 1) + span })
        } else {
          parts.push({ type: 'nowrap', html: prev.html + span })
        }
      } else {
        parts.push({ type: 'span', html: span })
      }
      // Skip space after comma: comma has natural width so the following space
      // would create a double-width gap that hints the comma position.
      if (blank && i + 1 < orig.length && /[ \n]/.test(orig[i + 1]) && /[ \n]/.test(correct[i + 1])) i++
    } else {
      const ch   = esc(orig[i])
      const last = parts[parts.length - 1]
      if (last?.type === 'text') last.html += ch
      else parts.push({ type: 'text', html: ch })
    }
  }

  return parts.map(p =>
    p.type === 'nowrap' ? `<span class="tc-nb">${p.html}</span>` : p.html
  ).join('')
}

/* Return the full word (no whitespace) containing the character at idx. */
export function wordAt(text, idx) {
  let start = idx
  let end   = idx
  while (start > 0 && /\S/.test(text[start - 1])) start--
  while (end < text.length - 1 && /\S/.test(text[end + 1])) end++
  return text.slice(start, end + 1)
}
