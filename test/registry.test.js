import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeatures } from '../extension/registry.js';
import { watchSettings, key } from '../extension/settings.js';

test('初期ボタンの配置と残り2機能 の通知', async () => {
  const features = await loadFeatures();
  assert.deepEqual(features.filter(f => f.location === 'header').map(f => f.id),
    ['mentions-filter', 'channel-grouping', 'open-in-browser', 'focus-mode']);
  assert.deepEqual(features.filter(f => f.location === 'message').map(f => f.id), ['send-to-tasks']);
  for (const f of features.filter(f => ['send-to-tasks','channel-grouping'].includes(f.id))) {
    const shown = [];
    f.onClick({ toast: text => shown.push(text), text: null, permalink: null });
    assert.deepEqual(shown, ['未実装：' + f.title]);
  }
});

test('欠損・壊れた定義・重複があっても後続を登録', async () => {
  const [a, b] = await loadFeatures();
  const errors = [];
  const load = async id => {
    if (id === 'missing') throw Error('missing');
    return { default: [a,b].find(f => f.id === id) || {} };
  };
  assert.deepEqual(await loadFeatures([a.id,'missing','invalid',a.id,b.id], load,
    message => errors.push(message)), [a,b]);
  assert.equal(errors.length, 3);
});

test('初期読込中に受けた設定変更を維持し、削除で既定値に戻る', async () => {
  let listener, last;
  const k = key('focus-mode');
  globalThis.chrome = { storage: {
    onChanged: { addListener(fn) { listener = fn; } },
    local: { async get() {
      listener({ [k]: { newValue: false } }, 'local');
      return { [k]: true };
    } }
  } };
  try {
    await watchSettings([{ id: 'focus-mode' }], values => { last = values[k]; });
    assert.equal(last, false);
    listener({ [k]: { newValue: true } }, 'sync');
    assert.equal(last, false);
    listener({ [k]: { oldValue: false } }, 'local');
    assert.equal(last, undefined);
  } finally { delete globalThis.chrome; }
});
