export function injectClipContext(userMessage, clips) {
  const referenced = [];
  const pattern = /#(\d+)/g;
  let match;

  while ((match = pattern.exec(userMessage)) !== null) {
    const num = parseInt(match[1]);
    const clip = clips.find((c) => c.number === num);
    if (clip) referenced.push(clip);
  }

  if (referenced.length === 0) return { text: userMessage, referenced: [] };

  const context = referenced.map((c) => `Clip #${c.number}: "${c.text}"`).join('\n');

  return {
    text: `[Reference context]\n${context}\n\n[User's question]\n${userMessage}`,
    referenced,
  };
}
