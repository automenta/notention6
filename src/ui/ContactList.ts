import { useAppStore } from "../store";
import { Contact } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { logger } from "../lib/utils";
import "./Button";

const log = logger("contact-list");

export class ContactList extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private contacts: Contact[] = [];
  private currentContactPubkey: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        contacts: state.userProfile?.contacts || [],
        currentContactPubkey: state.currentContactPubkey,
      }),
      ({ contacts, currentContactPubkey }) => {
        this.contacts = contacts;
        this.currentContactPubkey = currentContactPubkey;
        this.render();
      },
      {
        equalityFn: (a, b) =>
          a.contacts === b.contacts &&
          a.currentContactPubkey === b.currentContactPubkey,
      },
    );

    const initialState = useAppStore.getState();
    this.contacts = initialState.userProfile?.contacts || [];
    this.currentContactPubkey = initialState.currentContactPubkey;
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
  }

  private handleContactClick(pubkey: string) {
    log(`Contact clicked: ${pubkey}`);
    useAppStore.getState().setCurrentContactPubkey(pubkey);
  }

  private async handleAddContact() {
    const pubkey = prompt("Enter contact's public key:");
    if (pubkey) {
      await useAppStore.getState().addContact({ pubkey });
    }
  }

  render() {
    if (!this.shadowRoot) return;
    log("Rendering contact list");

    const template = html`
      <link rel="stylesheet" href="src/ui/ContactList.css" />
      <div class="contact-list-container">
        <div class="contact-list-actions">
          <ui-button @click=${() => this.handleAddContact()}>Add Contact</ui-button>
        </div>
        <ul class="contact-list">
          ${repeat(
            this.contacts,
            (contact) => contact.pubkey,
            (contact) => html`
              <li
                class="contact-item ${this.currentContactPubkey === contact.pubkey ? "active" : ""}"
                @click=${() => this.handleContactClick(contact.pubkey)}
              >
                <span class="contact-alias">${contact.alias || `${contact.pubkey.substring(0, 8)}...`}</span>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
    render(template, this.shadowRoot);
  }
}

customElements.define("notention-contact-list", ContactList);
