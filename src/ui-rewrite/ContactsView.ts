// src/ui-rewrite/ContactsView.ts
import { nostrService } from '../services/NostrService';
import { useAppStore } from '../store';
import { Contact } from '../../shared/types';

export async function createContactsView(): Promise<HTMLElement> {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Contacts</h1>';

  const contacts = await nostrService.fetchContacts();

  if (!contacts || contacts.length === 0) {
    el.innerHTML += '<p>No contacts found.</p>';
    return el;
  }

  const ul = document.createElement('ul');
  contacts.forEach(contact => {
    const li = document.createElement('li');
    li.textContent = contact.alias || contact.pubkey;
    li.style.cursor = 'pointer';
    li.onclick = () => {
      // In a real app, you'd pass the contact's pubkey to the chat panel
      useAppStore.getState().setSidebarTab('chats');
    };
    ul.appendChild(li);
  });

  el.appendChild(ul);

  return el;
}
