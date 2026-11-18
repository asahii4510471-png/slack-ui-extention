export function stub(id, title, location, path) {
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="' + path + '"/></svg>';
  return { id, title, location, icon, onClick(ctx) { ctx.toast('未実装：' + title); } };
}
