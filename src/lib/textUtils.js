export function splitSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
  return sentences.map((s) => s.trim()).filter(Boolean);
}
