import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../extension/features/mentions-filter.js';
import browser, { webTarget } from '../extension/features/open-in-browser.js';
import focus from '../extension/features/focus-mode.js';
import { activeMode } from '../extension/settings.js';

test('メンションは全体、チーム、個人の順に分類する', () => {
  const person = { text: '@name', member: true };
  const group = { text: '@team', group: true };
  assert.equal(classify([]), null);
  assert.equal(classify([{ text: '@unknown' }]), null);
  assert.equal(classify([person]), 'personal');
  assert.equal(classify([group, person]), 'team');
  for (const text of ['@channel','@here','@everyone']) {
    assert.equal(classify([person, group, { text }]), 'broadcast');
  }
});

test('モード既定値、復元、機能無効化、再有効化', async () => {
  for (const f of [focus, browser]) {
    const values = {};
    const k = 'mode.' + f.id;
    const ctx = { toggle() { values[k] = !values[k]; } };
    assert.equal(activeMode(values, f.id), false);
    await f.onClick(ctx);
    assert.equal(activeMode({ ...values }, f.id), true);
    values['enabled.' + f.id] = false;
    assert.equal(activeMode(values, f.id), false);
    values['enabled.' + f.id] = true;
    assert.equal(activeMode(values, f.id), true);
    await f.onClick(ctx);
    assert.equal(activeMode(values, f.id), false);
  }
});

test('deep link の Web 遷移先を同一 Slack オリジンに限定', () => {
  const url = 'https://app.slack.com/client/T1/C2';
  assert.equal(webTarget('slack://open?url=' + encodeURIComponent(url)), url);
  for (const href of ['slack://open', 'bad', 'slack://open?url=https://app.slack.com.example.org',
    'slack://open?url=https://name@app.slack.com/', 'https://app.slack.com/?url=' + url]) {
    assert.equal(webTarget(href), null);
  }
});
