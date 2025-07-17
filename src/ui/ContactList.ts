import { useAppStore } from "../store";
import { Contact } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { contactService } from "../services/ContactService";
import "./Card";
import "./Button";
import "./Input";

export class ContactList extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private contacts: Contact[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe(
      (state) => state.userProfile?.contacts,
      (contacts) => {
        if (contacts) {
          this.contacts = contacts;
          this.render();
        }
      },
      { equalityFn: (a, b) => a === b },
    );
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private async addContact() {
    const pubkey = this.shadowRoot?.querySelector<HTMLInputElement>(
      "#new-contact-pubkey",
    )?.value;
    const name =
      this.shadowRoot?.querySelector<HTMLInputElement>(
        "#new-contact-name",
      )?.value;
    if (pubkey && name) {
      await contactService.addContact({ pubkey, alias: name });
    }
  }

  render() {
    if (!this.shadowRoot) return;

    const template = html`
      <link rel="stylesheet" href="src/ui/ContactList.css" />
      <div class="contact-list-container">
        <h1>Contacts</h1>
        <div class="add-contact-form">
          <ui-input id="new-contact-name" placeholder="Name"></ui-input>
          <ui-input id="new-contact-pubkey" placeholder="Public Key"></ui-input>
          <ui-button @click=${() => this.addContact()}>Add Contact</ui-button>
        </div>
        <div class="contact-list">
          ${repeat(
            this.contacts,
            (contact) => contact.pubkey,
            (contact) => html`
              <ui-card class="contact-card">
                <div class="contact-info">
                  <span class="contact-name">${contact.alias}</span>
                  <span class="contact-pubkey">${contact.pubkey}</span>
                </div>
                <ui-button
                  variant="ghost"
                  size="sm"
                  @click=${() => contactService.removeContact(contact.pubkey)}
                >
                  Remove
                </ui-button>
              </ui-card>
            `,
          )}
        </div>
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("contact-list", ContactList);
