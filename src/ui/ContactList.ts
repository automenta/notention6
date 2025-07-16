import { html } from "lit";
import { useAppStore } from "../store";
import { Contact } from "../../shared/types";
import { contactService } from "../services/ContactService";
import "./Button";
import "./Contact";

export class ContactList extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private contacts: Contact[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe((state) => {
      this.contacts = state.contacts || [];
      this.render();
    });
    contactService.getContacts();
    this.render();
    this.addEventListener("remove-contact", this.handleRemoveContact);
  }

  disconnectedCallback() {
    this.unsubscribe();
    this.removeEventListener("remove-contact", this.handleRemoveContact);
  }

  private handleRemoveContact(e: Event) {
    const pubkey = (e as CustomEvent).detail.pubkey;
    contactService.removeContact(pubkey);
  }

  private handleAddContact() {
    const pubkey = prompt("Enter contact public key:");
    if (pubkey) {
      const alias = prompt("Enter contact alias (optional):");
      contactService.addContact({ pubkey, alias: alias || "" });
    }
  }

  render() {
    if (!this.shadowRoot) return;

    let contactListHtml = "";
    if (this.contacts) {
      contactListHtml = this.contacts
        .map(
          (contact) =>
            `<contact-item data-pubkey="${contact.pubkey}"></contact-item>`,
        )
        .join("");
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .contact-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }
        .add-contact-button {
          margin-bottom: 16px;
        }
      </style>
      <div class="contact-list-container">
        <ui-button class="add-contact-button">
          Add Contact
        </ui-button>
        <div class="contact-list">
          ${contactListHtml}
        </div>
      </div>
    `;

    const addButton = this.shadowRoot.querySelector(".add-contact-button");
    if (addButton) {
      addButton.addEventListener("click", () => this.handleAddContact());
    }

    const contactItems = this.shadowRoot.querySelectorAll("contact-item");
    contactItems.forEach((item) => {
      const pubkey = item.getAttribute("data-pubkey");
      const contact = this.contacts.find((c) => c.pubkey === pubkey);
      if (contact) {
        (item as any).contact = contact;
      }
    });
  }
}

customElements.define("notention-contact-list", ContactList);
