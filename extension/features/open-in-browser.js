import { stub } from '../stub.js';

export function webTarget(href) {
  try {
    const link = new URL(href);
    if (link.protocol !== 'slack:') return null;
    for (const value of link.searchParams.values()) {
      if (!/^https:\/\//i.test(value)) continue;
      let url;
      try { url = new URL(value); } catch { continue; }
      if (url?.origin === 'https://app.slack.com' && !url.username && !url.password) return url.href;
    }
  } catch { /* Malformed deep links are still blocked. */ }
  return null;
}

let listening = false;
let showToast;
function intercept(event) {
  if (event.type === 'auxclick' && event.button !== 1) return;
  const anchor = event.composedPath().find(el => el.matches?.('a[href]'));
  if (!/^slack:\/\//i.test(anchor?.href || '')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const target = webTarget(anchor.href);
  if (target) location.assign(target);
  else showToast('アプリ起動をブロックしました');
}

export default {
  ...stub('open-in-browser', 'ブラウザで開く', 'header', 'M13 3h8v8m0-8L10 14M9 6H3v15h15v-6'),
  toggle: true,
  onClick: ctx => ctx.toggle(),
  refresh({ active, toast }) {
    if (active === listening) return;
    listening = active;
    showToast = toast;
    for (const type of ['click', 'auxclick']) {
      if (active) window.addEventListener(type, intercept, true);
      else window.removeEventListener(type, intercept, true);
    }
  }
};
