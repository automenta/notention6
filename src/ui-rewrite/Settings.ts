// src/ui-rewrite/Settings.ts
export function createSettings(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Settings</h1><p>Application settings will be configured here.</p>';
  return el;
}
