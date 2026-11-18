import { stub } from '../stub.js';

const labels = { all: 'すべて', personal: '自分宛', team: 'チーム', broadcast: '全体' };
export function classify(chips) {
  let result = null;
  for (const { text, member, group } of chips) {
    if (/^@(channel|here|everyone)$/i.test(text.trim())) return 'broadcast';
    if (group) result = 'team';
    else if (member && !result) result = 'personal';
  }
  return result;
}

const item = '[data-qa="activity-item-container"]';
const chip = '[data-stringify-type="mention"], [data-stringify-type="broadcast"], [data-stringify-type="usergroup"], [data-usergroup-id], a[data-member-id]';
let selected = 'all', bar;
function category(row) {
  const message = row.querySelector('[data-qa="activity-item-message"]');
  return classify(Array.from(message?.querySelectorAll(chip) || [], el => ({
    text: el.textContent,
    member: !!el.dataset.memberId,
    group: !!el.dataset.usergroupId || el.dataset.stringifyType === 'usergroup'
  })));
}

function refresh({ enabled }) {
  const heading = enabled && document.querySelector('[data-qa="activity-inbox-sidebar-header-title"]');
  const active = heading && document.querySelector('#activity-inbox[aria-selected="true"]');
  if (!active) {
    selected = 'all';
    bar?.remove();
    document.querySelectorAll('.sui-filter-hidden').forEach(el => el.classList.remove('sui-filter-hidden'));
    return;
  }
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'sui-filter';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'メンション分離');
  }
  if (bar.previousElementSibling !== heading) heading.after(bar);
  const rows = Array.from(document.querySelectorAll(item), row => [row, category(row)]);
  // Keep a selected filter available when virtual scrolling temporarily removes matches.
  const available = selected !== 'all' || rows.some(([, kind]) => kind);
  for (const [id, title] of Object.entries(labels)) {
    let button = bar.querySelector('[data-category="' + id + '"]');
    if (id !== 'all' && !available) { button?.remove(); continue; }
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.dataset.category = id;
      button.textContent = title;
      button.onclick = () => { selected = id; refresh({ enabled: true }); };
      bar.append(button);
    }
    button.setAttribute('aria-pressed', String(selected === id));
  }
  for (const [row, kind] of rows) {
    const hide = selected !== 'all' && selected !== kind;
    if (row.classList.contains('sui-filter-hidden') !== hide) row.classList.toggle('sui-filter-hidden', hide);
  }
}

export default {
  ...stub('mentions-filter', 'メンション分離', 'header', 'M3 5h18M6 12h12M9 19h6'),
  refresh,
  onClick({ toast }) {
    if (bar?.isConnected) bar.querySelector('button[aria-pressed="true"]')?.focus();
    else toast('アクティビティでメンションを絞り込めます');
  }
};
