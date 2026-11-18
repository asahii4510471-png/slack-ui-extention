import { loadFeatures } from './registry.js';
import { key, watchSettings } from './settings.js';

const features = await loadFeatures();
const controls = new Map();
for (const f of features) {
  const row = document.createElement('label');
  const name = document.createElement('span');
  name.textContent = f.title;
  const location = document.createElement('small');
  location.textContent = f.location === 'header' ? 'ヘッダー' : 'メッセージ';
  name.append(location);
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.disabled = true;
  const k = key(f.id);
  controls.set(k, toggle);
  toggle.onchange = async () => {
    const checked = toggle.checked;
    try { await chrome.storage.local.set({ [k]: checked }); }
    catch {
      toggle.checked = !checked;
      document.querySelector('#status').textContent = '設定を保存できませんでした。';
    }
  };
  row.append(name, toggle);
  document.querySelector('#features').append(row);
}
await watchSettings(features, values => {
  for (const [k, toggle] of controls) {
    toggle.checked = values[k] !== false;
    toggle.disabled = false;
  }
});
