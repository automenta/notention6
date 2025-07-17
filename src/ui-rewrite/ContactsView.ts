// src/ui-rewrite/ContactsView.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import { Contact } from '../../shared/types';

export function createContactsView(): HTMLElement {
  const { contacts, addContact } = useAppStore.getState();
  const contactsArray = Object.values(contacts);

  const container = document.createElement('div');
  container.className = 'contacts-view';

  // Header
  const header = document.createElement('header');
  header.className = 'contacts-header';
  const title = document.createElement('h1');
  title.textContent = 'Contacts';
  header.appendChild(title);
  container.appendChild(header);

  // Add Contact Form
  const addContactForm = document.createElement('div');
  addContactForm.className = 'add-contact-form';

  const pubkeyInput = document.createElement('input');
  pubkeyInput.type = 'text';
  pubkeyInput.placeholder = 'Enter Nostr public key (npub)...';
  addContactForm.appendChild(pubkeyInput);

  const aliasInput = document.createElement('input');
  aliasInput.type = 'text';
  aliasInput.placeholder = 'Enter alias (optional)';
  addContactForm.appendChild(aliasInput);

  const addButton = createButton({
    label: 'Add Contact',
    onClick: () => {
      const pubkey = pubkeyInput.value;
      const alias = aliasInput.value;
      if (pubkey) {
        addContact({ pubkey, alias });
        pubkeyInput.value = '';
        aliasInput.value = '';
      }
    },
    variant: 'primary'
  });
  addContactForm.appendChild(addButton);
  container.appendChild(addContactForm);

  // Contact List
  const list = document.createElement('ul');
  list.className = 'contacts-list';

  if (contactsArray.length > 0) {
    contactsArray.forEach(contact => {
      const listItem = document.createElement('li');
      listItem.className = 'contact-item';

      const alias = document.createElement('span');
      alias.className = 'contact-alias';
      alias.textContent = contact.alias || 'No alias';

      const pubkey = document.createElement('span');
      pubkey.className = 'contact-pubkey';
      pubkey.textContent = contact.pubkey;

      listItem.appendChild(alias);
      listItem.appendChild(pubkey);

      listItem.onclick = () => {
        // Navigate to chat with this contact
        useAppStore.getState().setSidebarTab('chats');
        // In a real implementation, we would also set the current chat partner
      };

      list.appendChild(listItem);
    });
  } else {
    const noContactsMessage = document.createElement('p');
    noContactsMessage.textContent = 'No contacts yet. Add one above!';
    list.appendChild(noContactsMessage);
  }

  container.appendChild(list);

  return container;
}
