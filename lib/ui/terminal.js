function titleCase(value) {
  return String(value || '')
    .split(/(\s+|-)/)
    .map((part) => {
      if (/^\s+$|-$/.test(part) || part.length === 0) {
        return part;
      }

      return `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
    })
    .join('');
}

function progressBar(current, max, width = 12) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeCurrent = Math.max(0, Math.min(safeMax, Number(current) || 0));
  const filled = Math.round((safeCurrent / safeMax) * width);
  return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}] ${safeCurrent}/${safeMax}`;
}

function stackInventory(items = []) {
  const stacks = new Map();

  items.forEach((item) => {
    if (!item) {
      return;
    }

    const key = item.id || item.name;
    const existing = stacks.get(key) || {
      name: item.name || titleCase(key),
      quantity: 0,
    };
    existing.quantity += item.quantity || 1;
    stacks.set(key, existing);
  });

  return Array.from(stacks.values()).map((item) => `${item.name} x${item.quantity}`);
}

function box(title, lines = []) {
  const normalized = lines.map((line) => String(line));
  const titleLine = title ? ` ${title} ` : '';
  const contentWidth = Math.max(titleLine.length, ...normalized.map((line) => line.length), 24);
  const borderWidth = contentWidth + 2;
  const top =
    titleLine.length > 0
      ? `+${titleLine}${'-'.repeat(Math.max(0, borderWidth - titleLine.length))}+`
      : `+${'-'.repeat(borderWidth)}+`;
  const bottom = `+${'-'.repeat(borderWidth)}+`;
  const body = normalized.map((line) => `| ${line.padEnd(contentWidth)} |`);

  return [top, ...body, bottom];
}

function compactQuest(quests = []) {
  const active = quests.find((quest) => !quest.completed);
  const complete = quests.filter((quest) => quest.completed).length;

  if (!active) {
    return `Quests ${complete}/${quests.length} complete`;
  }

  return `Quests ${complete}/${quests.length} complete | Track: ${active.title} ${active.progress}/${active.target}`;
}

module.exports = {
  box,
  compactQuest,
  progressBar,
  stackInventory,
  titleCase,
};
