import { useAppStore } from "../store";
import { Contact } from "../../shared/types";
import "./Button";

export class ContactList extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private contacts: Contact[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe((state) => {
      this.contacts = state.userProfile?.contacts || [];
      this.render();
    });

    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }

        .contacts-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .contacts-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
        }

        .contacts-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .coming-soon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
          text-align: center;
          flex: 1;
        }

        .coming-soon-icon {
          width: 64px;
          height: 64px;
          margin-bottom: var(--space-4);
          color: var(--color-text-muted);
        }

        .coming-soon-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .coming-soon-description {
          color: var(--color-text-muted);
          max-width: 400px;
          line-height: var(--line-height-relaxed);
        }
      </style>

      <div class="contacts-container">
        <div class="contacts-header">
          <h1 class="contacts-title">Contacts</h1>
          <ui-button variant="primary" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14m-7-7h14"></path>
            </svg>
            Add Contact
          </ui-button>
        </div>

        <div class="coming-soon">
          <svg class="coming-soon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="m22 21-3-3m2-9a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
          </svg>
          <h3 class="coming-soon-title">Contact Management</h3>
          <p class="coming-soon-description">
            Manage your network of contacts and collaborators. Add friends, colleagues, 
            and other Nostr users to easily share notes and start conversations.
          </p>
        </div>
      </div>
    `;
  }
}

customElements.define("notention-contact-list", ContactList);
