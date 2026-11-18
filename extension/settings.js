export const key = id => 'enabled.' + id;

export async function watchSettings(features, update) {
  const keys = features.map(f => key(f.id));
  const values = {};
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const k of keys) {
      if (k in changes) values[k] = changes[k].newValue;
    }
    update(values);
  });
  const initial = await chrome.storage.local.get(keys);
  update(Object.assign(values, { ...initial, ...values }));
}
