import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { contactService } from "../services/ContactService";
import { store } from "../store";
import "./ContactList";

@customElement("contacts-view")
export class ContactsView extends LitElement {
  constructor() {
    super();
    contactService.getContacts();
  }

  render() {
    return html`
      <div class="contacts-view">
        <notention-contact-list></notention-contact-list>
      </div>
    `;
  }

  static styles = css`
    .contacts-view {
      padding: 16px;
    }
  `;
}
