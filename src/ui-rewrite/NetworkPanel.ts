// src/ui-rewrite/NetworkPanel.ts
export function createNetworkPanel(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Network Matches</h1><p>Notes from the network that match your interests will appear here.</p>';
  return el;
}
