// src/ui-rewrite/ChatPanel.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import { nostrService } from '../services/NostrService';
import { Chat, Message } from '../../shared/types';

export function createChatPanel(): HTMLElement {
  const { chats, contacts, currentChatId, setCurrentChat } = useAppStore.getState();
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

  // Chat UI
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';

  const chatList = document.createElement('div');
  chatList.className = 'chat-list';

  const messageView = document.createElement('div');
  messageView.className = 'message-view';

  const renderChatList = () => {
    chatList.innerHTML = '';
    if (chatsArray.length > 0) {
      chatsArray.forEach(chat => {
        const contact = contacts[chat.contactId];
        const chatItem = document.createElement('div');
        chatItem.className = `chat-list-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.textContent = contact?.alias || chat.contactId.substring(0, 10) + '...';
        chatItem.onclick = () => setCurrentChat(chat.id);
        chatList.appendChild(chatItem);
      });
    } else {
      chatList.innerHTML = '<p>No active chats.</p>';
    }
  };

  const renderMessageView = () => {
    messageView.innerHTML = '';
    if (!currentChatId) {
      messageView.innerHTML = '<p>Select a chat to view messages.</p>';
      return;
    }

    const chat = chats[currentChatId];
    const contact = contacts[chat.contactId];
    if (!chat) return;

    const messageViewHeader = document.createElement('div');
    messageViewHeader.className = 'message-view-header';
    messageViewHeader.innerHTML = `<h2>${contact?.alias || chat.contactId}</h2>`;

    const messageList = document.createElement('div');
    messageList.className = 'message-list';
    chat.messages.forEach((msg: Message) => {
      const messageEl = document.createElement('div');
      messageEl.className = `message ${msg.isSender ? 'sent' : 'received'}`;
      messageEl.textContent = msg.text;
      messageList.appendChild(messageEl);
    });

    const messageInputContainer = document.createElement('div');
    messageInputContainer.className = 'message-input';
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.placeholder = 'Type a message...';
    const sendButton = createButton({
      label: 'Send',
      onClick: async () => {
        const text = messageInput.value;
        if (text) {
          await nostrService.sendDirectMessage(chat.contactId, text);
          messageInput.value = '';
          // Optimistically update UI - real update comes from store subscription
        }
      },
      variant: 'primary'
    });
    messageInputContainer.appendChild(messageInput);
    messageInputContainer.appendChild(sendButton);

    messageView.appendChild(messageViewHeader);
    messageView.appendChild(messageList);
    messageView.appendChild(messageInputContainer);
  };

  useAppStore.subscribe(() => {
    renderChatList();
    renderMessageView();
  });

  renderChatList();
  renderMessageView();

  chatContainer.appendChild(chatList);
  chatContainer.appendChild(messageView);
  container.appendChild(chatContainer);

  return container;
}
