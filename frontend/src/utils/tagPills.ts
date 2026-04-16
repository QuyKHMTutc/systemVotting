const TAG_COLORS: Record<string, string> = {
  ai: 'tag-pill-ai',
  technology: 'tag-pill-tech',
  tech: 'tag-pill-tech',
  gaming: 'tag-pill-game',
  game: 'tag-pill-game',
};

export function getTagPillClass(tag: string): string {
  const key = tag.toLowerCase().replace(/\s+/g, '');
  return TAG_COLORS[key] ?? 'tag-pill-default';
}
