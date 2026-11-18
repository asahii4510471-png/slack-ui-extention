const ids = [
  'mentions-filter',
  'send-to-tasks',
  'channel-grouping',
  'open-in-browser',
  'focus-mode',
];

export async function loadFeatures(entries = ids, load = id => import('./features/' + id + '.js'), report = console.warn) {
  const features = [];
  for (const id of entries) {
    try {
      if (!/^[a-z0-9-]+$/.test(id) || features.some(f => f.id === id)) throw Error('ID が無効または重複');
      const { default: f } = await load(id);
      if (f.id !== id || !['header', 'message'].includes(f.location) ||
          typeof f.title !== 'string' || !f.title || typeof f.icon !== 'string' ||
          typeof f.onClick !== 'function') throw Error('機能定義が無効');
      features.push(f);
    } catch (error) { report('Slack UI: ' + id, error); }
  }
  return features;
}
