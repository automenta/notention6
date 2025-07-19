// src/ui-rewrite/ContactsView.ts
import { useStore } from "../store";
import { createButton } from "./Button";
import "./ContactsView.css";
import { Contact } from "../../shared/types";

export function createContactsView(): HTMLElement {
  const { userProfile, addContact, removeContact, updateContactAlias } =
    useStore.getState();
  const contacts = userProfile?.contacts || [];

  const container = document.createElement("div");
  container.className = "contacts-view-container";

  // Header
  const header = document.createElement("header");
  header.className = "contacts-view-header";
  const title = document.createElement("h1");
  title.textContent = "Contacts";
  header.appendChild(title);
  container.appendChild(header);

  // Add Contact Form
  const addContactForm = document.createElement("form");
  addContactForm.className = "add-contact-form";
  addContactForm.onsubmit = (e) => {
    e.preventDefault();
    const pubkeyInput = (e.target as HTMLFormElement).elements.namedItem(
      "pubkey",
    ) as HTMLInputElement;
    const aliasInput = (e.target as HTMLFormElement).elements.namedItem(
      "alias",
    ) as HTMLInputElement;
    const newContact: Contact = {
      pubkey: pubkeyInput.value.trim(),
      alias: aliasInput.value.trim(),
    };
    if (newContact.pubkey) {
      addContact(newContact);
      pubkeyInput.value = "";
      aliasInput.value = "";
    }
  };

  const pubkeyInput = document.createElement("input");
  pubkeyInput.type = "text";
  pubkeyInput.name = "pubkey";
  pubkeyInput.placeholder = "Nostr public key (npub...)";
  addContactForm.appendChild(pubkeyInput);

  const aliasInput = document.createElement("input");
  aliasInput.type = "text";
  aliasInput.name = "alias";
  aliasInput.placeholder = "Alias (optional)";
  addContactForm.appendChild(aliasInput);

  const addContactButton = createButton({
    label: "Add Contact",
    onClick: () => addContactForm.requestSubmit(),
    variant: "primary",
  });
  addContactForm.appendChild(addContactButton);

  container.appendChild(addContactForm);

  // Contacts List
  const contactsList = document.createElement("ul");
  contactsList.className = "contacts-list";

  if (contacts.length > 0) {
    contacts.forEach((contact) => {
      const listItem = document.createElement("li");
      listItem.className = "contact-item";

      const alias = document.createElement("span");
      alias.textContent =
        contact.alias || contact.pubkey.substring(0, 12) + "...";
      listItem.appendChild(alias);

      const actions = document.createElement("div");
      actions.className = "contact-actions";

      const editButton = createButton({
        label: "Edit",
        onClick: () => {
          const newAlias = prompt("Enter new alias:", contact.alias);
          if (newAlias !== null) {
            updateContactAlias(contact.pubkey, newAlias);
          }
        },
        variant: "secondary",
      });
      actions.appendChild(editButton);

      const removeButton = createButton({
        label: "Remove",
        onClick: () => removeContact(contact.pubkey),
        variant: "danger",
      });
      actions.appendChild(removeButton);

      listItem.appendChild(actions);
      contactsList.appendChild(listItem);
    });
  } else {
    const noContactsMessage = document.createElement("p");
    noContactsMessage.textContent = "No contacts found.";
    contactsList.appendChild(noContactsMessage);
  }

  container.appendChild(contactsList);

  return container;
}
