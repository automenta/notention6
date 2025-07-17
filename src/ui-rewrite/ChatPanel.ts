// src/ui-rewrite/ChatPanel.ts

export function createChatPanel(contactPubkey?: string): HTMLElement {
  const el = document.createElement('div');
  
  if (contactPubkey) {
    el.innerHTML = `
      <h1>Chat with ${contactPubkey.substring(0, 10)}...</h1>
      <div class="message-list"></div>
      <div class="message-input">
        <input type="text" placeholder="Type a message...">
        <button class="btn btn-primary">Send</button>
      </div>
    `;
  } else {
    el.innerHTML = '<h1>Chats</h1><p>Select a contact to start chatting.</p>';
  }

  return el;
}
