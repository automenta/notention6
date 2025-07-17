// src/ui-rewrite/ChatPanel.ts
export function createChatPanel(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Chats</h1><p>Direct Messages will appear here.</p>';
  return el;
}
