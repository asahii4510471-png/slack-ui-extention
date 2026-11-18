import { loadFeatures } from './registry.js';
import { key, modeKey, activeMode, watchSettings } from './settings.js';

const headers = ['[data-qa="view_header"]', '[data-qa="channel_header"]', '[data-qa="activity-inbox-sidebar-header-title"]', '[role="banner"]', 'main header'];
const actions = ['[data-qa="message_actions"]', '[data-qa="message_action_bar"]', '[data-qa="message-actions"]', '[role="toolbar"][aria-label*="message" i]', '[role="toolbar"][aria-label*="メッセージ"]'];
const rows = '[id^="message-list_"], [data-item-key], [data-qa="message_container"], [role="listitem"]';
const first = (root, selectors) => selectors.map(s => root?.querySelector(s)).find(Boolean);
const features = await loadFeatures();
let settings, frame, toastTimer, toastNode;

function toast(text) {
  clearTimeout(toastTimer);
  if (!toastNode?.isConnected) {
    toastNode = document.createElement('div');
    toastNode.className = 'sui-toast';
    toastNode.setAttribute('role', 'status');
    document.body.append(toastNode);
  }
  toastNode.textContent = text;
  toastTimer = setTimeout(() => toastNode.remove(), 2400);
}

function context(host) {
  const row = host.closest('[id^="message-list_"]') || host.closest(rows);
  const body = first(row, ['[data-qa="message-text"]', '[data-qa="message_text"]', '[data-message-text]', '[data-qa$="-message_text"]']);
  const links = row?.querySelectorAll('a[href*="/archives/"]') || [];
  const timestamp = Array.from(links).find(a => {
    const url = new URL(a.href);
    return url.protocol === 'https:' && url.hostname.endsWith('.slack.com') &&
      /^\/archives\/[A-Z0-9]+\/p\d+\/?$/.test(url.pathname) &&
      (a.closest('time') || a.matches('[data-qa*="timestamp"]') || (row.id.startsWith('message-list_') && url.pathname.endsWith('/p' + row.id.slice(13).replace('.', '')))) &&
      !a.closest('[data-qa="message-text"], [data-qa="message_text"]');
  });
  return { text: body?.innerText.trim() || null, permalink: timestamp?.href || null, toast };
}

function button(feature, host) {
  const el = document.createElement('button');
  el.type = 'button';
  el.title = feature.title;
  el.setAttribute('aria-label', feature.title);
  el.dataset.feature = feature.id;
  el.innerHTML = feature.icon;
  el.addEventListener('click', async event => {
    event.stopPropagation();
    try {
      await feature.onClick(feature.location === 'message' ? context(host) : {
        toast,
        async toggle() {
          const k = modeKey(feature.id);
          const values = await chrome.storage.local.get(k);
          await chrome.storage.local.set({ [k]: values[k] !== true });
        }
      });
    } catch { toast('実行できませんでした：' + feature.title); }
  });
  return el;
}

function sync(host, location) {
  const enabled = features.filter(f => f.location === location && settings[key(f.id)] !== false);
  let group = host.querySelector(':scope > .sui-buttons');
  if (!enabled.length) { group?.remove(); return; }
  if (!group) {
    group = document.createElement('span');
    group.className = 'sui-buttons';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Slack UI 拡張');
    host.append(group);
  }
  if (group.children.length === enabled.length &&
      enabled.every((f, i) => group.children[i].dataset.feature === f.id)) return;
  group.replaceChildren(...enabled.map(f => button(f, host)));
}

function refresh() {
  frame = 0;
  for (const feature of features) {
    feature.refresh?.({ enabled: settings[key(feature.id)] !== false,
      active: activeMode(settings, feature.id), toast });
  }
  const header = first(document, headers);
  const hosts = new Set();
  if (header) { sync(header, 'header'); hosts.add(header); }
  for (const f of features.filter(f => f.toggle)) {
    header?.querySelector('[data-feature="' + f.id + '"]')?.setAttribute('aria-pressed', String(activeMode(settings, f.id)));
  }
  for (const host of document.querySelectorAll(actions.join(','))) {
    if (!host.closest(rows) || host.parentElement?.closest(actions.join(','))) continue;
    sync(host, 'message');
    hosts.add(host);
  }
  for (const group of document.querySelectorAll('.sui-buttons')) {
    if (!hosts.has(group.parentElement)) group.remove();
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(refresh);
}
await watchSettings(features, values => { settings = values; schedule(); });
new MutationObserver(schedule).observe(document.body, {
  childList: true, subtree: true, attributes: true, attributeFilter: ['role', 'data-qa', 'aria-label']
});
new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
