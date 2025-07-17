import { useAppStore } from "../store";
import { html, render } from "lit-html";
import "./ContactList";
import { logger } from "../lib/utils";

const log = logger("contacts-view");

export class ContactsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.render();
  }

  render() {
    if (!this.shadowRoot) return;
    log("Rendering contacts view");

    const template = html`
      <link rel="stylesheet" href="src/ui/ContactsView.css" />
      <div class="contacts-container">
        <header class="contacts-header">
          <h1 class="contacts-title">Contacts</h1>
        </header>
        <div class="contacts-content">
          <notention-contact-list></notention-contact-list>
        </div>
      </div>
    `;
    render(template, this.shadowRoot);
  }
}

customElements.define("contacts-view", ContactsView);
