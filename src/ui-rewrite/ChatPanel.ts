// src/ui-rewrite/ChatPanel.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import './ChatPanel.css';
import { Contact, DirectMessage } from '../../shared/types';

export function createChatPanel(): HTMLElement {
  const { userProfile, directMessages, sendDirectMessage } = useAppStore.getState();
  const contacts = userProfile?.contacts || [];
  let selectedContact: Contact | null = null;

  const container = document.createElement('div');
  container.className = 'chat-panel-container';

  // Header
  const header = document.createElement('header');
  header.className = 'chat-panel-header';
  const title = document.createElement('h1');
  title.textContent = 'Chat';
  header.appendChild(title);
  container.appendChild(header);

  const chatLayout = document.createElement('div');
  chatLayout.className = 'chat-layout';

  // Contact List
  const contactListContainer = document.createElement('div');
  contactListContainer.className = 'contact-list-container';
  const contactList = document.createElement('ul');
  contactList.className = 'chat-contact-list';

  contacts.forEach(contact => {
      const listItem = document.createElement('li');
      listItem.textContent = contact.alias || contact.pubkey.substring(0, 12) + '...';
      listItem.onclick = () => {
          selectedContact = contact;
          renderMessageView();
      };
      contactList.appendChild(listItem);
  });

  contactListContainer.appendChild(contactList);
  chatLayout.appendChild(contactListContainer);

  // Message View
  const messageViewContainer = document.createElement('div');
  messageViewContainer.className = 'message-view-container';

  const renderMessageView = () => {
      messageViewContainer.innerHTML = '';
      if (!selectedContact) {
          messageViewContainer.textContent = 'Select a contact to start chatting.';
          return;
      }

      const messageViewHeader = document.createElement('div');
      messageViewHeader.className = 'message-view-header';
      messageViewHeader.textContent = selectedContact.alias || selectedContact.pubkey.substring(0, 12) + '...';
      messageViewContainer.appendChild(messageViewHeader);

      const messagesList = document.createElement('ul');
      messagesList.className = 'messages-list';

      const messagesWithContact = directMessages.filter(
          (dm) =>
          (dm.from === selectedContact?.pubkey && dm.to === userProfile?.nostrPubkey) ||
          (dm.to === selectedContact?.pubkey && dm.from === userProfile?.nostrPubkey)
          );

          messagesWithContact.forEach(dm => {
              const listItem = document.createElement('li');
              listItem.className = dm.from === userProfile?.nostrPubkey ? 'sent' : 'received';
              listItem.textContent = dm.content;
              messagesList.appendChild(listItem);
            });

        messageViewContainer.appendChild(messagesList);

        const messageForm = document.createElement('form');
        messageForm.className = 'message-form';
        messageForm.onsubmit = e => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).elements.namedItem('message') as HTMLInputElement;
            const content = input.value.trim();
            if (content && selectedContact) {
                sendDirectMessage(selectedContact.pubkey, content);
                input.value = '';
            }
        };

        const messageInput = document.createElement('input');
        messageInput.type = 'text';
        messageInput.name = 'message';
        messageInput.placeholder = 'Type a message...';
        messageForm.appendChild(messageInput);

        const sendButton = createButton({
            label: 'Send',
            onClick: () => messageForm.requestSubmit(),
            variant: 'primary'
        });
        messageForm.appendChild(sendButton);

        messageViewContainer.appendChild(messageForm);
    };

    chatLayout.appendChild(messageViewContainer);
    container.appendChild(chatLayout);

    useAppStore.subscribe(() => {
        if (selectedContact) {
            renderMessageView();
        }
    });

    renderMessageView();

  return container;
}
