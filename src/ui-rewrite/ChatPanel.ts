// src/ui-rewrite/ChatPanel.ts
import { useAppStore } from '../store';
import { createButton } from './Button';

export function createChatPanel(): HTMLElement {
  const { chats, contacts } = useAppStore.getState();
  const chatsArray = Object.values(chats);

  const container = document.createElement('div');
  container.className = 'chat-panel';

  // Header
  const header = document.createElement('header');
  header.className = 'chat-header';
  const title = document.createElement('h1');
  title.textContent = 'Chats';
  header.appendChild(title);
  container.appendChild(header);

  // Chat List and Message View
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';

  const chatList = document.createElement('div');
  chatList.className = 'chat-list';

  if (chatsArray.length > 0) {
    chatsArray.forEach(chat => {
      const contact = contacts[chat.contactId];
      const chatItem = document.createElement('div');
      chatItem.className = 'chat-list-item';
      chatItem.textContent = contact?.alias || chat.contactId.substring(0, 10) + '...';
      chatList.appendChild(chatItem);
    });
  } else {
    const noChatsMessage = document.createElement('p');
    noChatsMessage.textContent = 'No active chats.';
    chatList.appendChild(noChatsMessage);
  }

  const messageView = document.createElement('div');
  messageView.className = 'message-view';
  messageView.innerHTML = `
    <div class="message-view-header">
      <h2>Select a chat</h2>
    </div>
    <div class="message-list">
      <!-- Mock messages -->
    </div>
    <div class="message-input">
      <input type="text" placeholder="Type a message..." />
      <button>Send</button>
    </div>
  `;

  chatContainer.appendChild(chatList);
  chatContainer.appendChild(messageView);
  container.appendChild(chatContainer);

  return container;
}
