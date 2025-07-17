// src/ui-rewrite/ContactsView.ts
export function createContactsView(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Contacts</h1><p>Your buddy list will appear here.</p>';
  return el;
}
