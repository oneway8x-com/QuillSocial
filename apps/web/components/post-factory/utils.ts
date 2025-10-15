export function parseXThread(content: string): string[] {
  const numberedPattern = /\d+\/\s*/g;

  if (numberedPattern.test(content)) {
    const items = content.split(numberedPattern).filter((item) => item.trim());
    return items;
  }

  const byDoubleNewline = content.split(/\n\n+/).filter((item) => item.trim());
  if (byDoubleNewline.length > 1) {
    return byDoubleNewline;
  }

  return content.split(/\n/).filter((item) => item.trim());
}
