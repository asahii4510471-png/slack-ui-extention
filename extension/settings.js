export const key = id => 'enabled.' + id;

export const modeKey = id => 'mode.' + id;
export const activeMode = (values, id) => values[key(id)] !== false && values[modeKey(id)] === true;

export async function watchSettings(features, update) {
  const keys = features.flatMap(f => f.toggle ? [key(f.id), modeKey(f.id)] : [key(f.id)]);
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
