/** Word wrapping shared by measurement and paint. Long words are split, never clipped. */
const graphemeSegmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
export function wrapCardText(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  if (!(maxWidth > 0)) throw new Error('Card text width must be positive');
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (measure(next) <= maxWidth) { line = next; continue; }
      if (line) { lines.push(line); line = ''; }
      // Keep combining marks, Indic syllables and joined emoji with their base glyph.
      const characters = graphemeSegmenter ? Array.from(graphemeSegmenter.segment(word), part => part.segment) : Array.from(word);
      for (const character of characters) {
        if (line && measure(line + character) > maxWidth) { lines.push(line); line = ''; }
        line += character;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}
