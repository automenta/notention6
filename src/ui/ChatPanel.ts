import { useAppStore } from "../store";
import { DirectMessage, Contact } from "../../shared/types";
import "./Button";
import "./Input";
import "./Textarea";

export class ChatPanel extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private messages: DirectMessage[] = [];
  private connected = false;
  private userProfile: any = null;
  private selectedContact: Contact | null = null;
  private loading = false;
  private error = "";
  private newMessageContent = "";
  private dmSubscription: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe((state) => {
      this.messages = state.directMessages;
      this.connected = state.nostrConnected;
      this.userProfile = state.userProfile;
      this.loading = state.loading.network;
      this.error = state.errors.network || "";
      this.render();
    });

    this.setupEventListeners();
    this.render();
    this.autoSubscribeToDMs();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private setupEventListeners() {
    this.addEventListener("click", this.handleClick.bind(this));
    this.addEventListener("input", this.handleInput.bind(this));
    this.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  private async autoSubscribeToDMs() {
    if (
      this.connected &&
      this.userProfile?.nostrPubkey &&
      !this.dmSubscription
    ) {
      const store = useAppStore.getState();
      this.dmSubscription = store.subscribeToDirectMessages();
    }
  }

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;

    // Handle connect button
    if (target.classList.contains("connect-btn")) {
      this.handleConnectionToggle();
      return;
    }

    // Handle contact selection
    if (
      target.classList.contains("contact-item") ||
      target.closest(".contact-item")
    ) {
      const contactElement = target.classList.contains("contact-item")
        ? target
        : target.closest(".contact-item");
      const pubkey = contactElement?.getAttribute("data-pubkey");
      if (pubkey) {
        this.selectContact(pubkey);
      }
      return;
    }

    // Handle send message
    if (target.classList.contains("send-btn")) {
      this.handleSendMessage();
      return;
    }

    // Handle add contact
    if (target.classList.contains("add-contact-btn")) {
      this.handleAddContact();
      return;
    }
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;

    if (target.classList.contains("message-input")) {
      this.newMessageContent = target.value;
    }
  }

  private handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;

    if (
      target.classList.contains("message-input") &&
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      this.handleSendMessage();
    }
  }

  private async handleConnectionToggle() {
    const store = useAppStore.getState();

    if (this.connected) {
      await store.logoutFromNostr();
      this.dmSubscription = null;
    } else {
      await store.initializeNostr();
      if (!this.userProfile?.nostrPubkey) {
        await store.generateAndStoreNostrKeys();
      }
      this.dmSubscription = store.subscribeToDirectMessages();
    }
  }

  private selectContact(pubkey: string) {
    const contact = this.userProfile?.contacts?.find(
      (c: Contact) => c.pubkey === pubkey,
    );
    if (contact) {
      this.selectedContact = contact;
      this.render();
    }
  }

  private async handleSendMessage() {
    if (!this.selectedContact || !this.newMessageContent.trim()) {
      return;
    }

    try {
      const store = useAppStore.getState();
      await store.sendDirectMessage(
        this.selectedContact.pubkey,
        this.newMessageContent.trim(),
      );
      this.newMessageContent = "";
      this.render();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  private async handleAddContact() {
    const pubkey = prompt("Enter contact's public key (npub or hex):");
    if (!pubkey) return;

    // Simple validation - should start with npub or be 64 hex chars
    if (
      !pubkey.startsWith("npub") &&
      !(pubkey.length === 64 && /^[a-f0-9]+$/i.test(pubkey))
    ) {
      alert(
        "Please enter a valid public key (npub format or 64-character hex)",
      );
      return;
    }

    const alias = prompt("Enter an alias (optional):") || "";

    try {
      const store = useAppStore.getState();
      await store.addContact({
        pubkey,
        alias,
        lastContact: new Date(),
      });
    } catch (error) {
      console.error("Failed to add contact:", error);
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  private getMessagesForContact(pubkey: string): DirectMessage[] {
    if (!this.userProfile?.nostrPubkey) return [];

    return this.messages
      .filter(
        (msg) =>
          (msg.from === pubkey && msg.to === this.userProfile.nostrPubkey) ||
          (msg.from === this.userProfile.nostrPubkey && msg.to === pubkey),
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
  }

  private getContactsWithMessages() {
    const contacts = this.userProfile?.contacts || [];
    const messageContacts = new Set();

    // Add contacts who have messages
    this.messages.forEach((msg) => {
      if (msg.from !== this.userProfile?.nostrPubkey) {
        messageContacts.add(msg.from);
      }
      if (msg.to !== this.userProfile?.nostrPubkey) {
        messageContacts.add(msg.to);
      }
    });

    // Combine known contacts with message participants
    const allContacts = [...contacts];
    messageContacts.forEach((pubkey) => {
      if (!contacts.find((c) => c.pubkey === pubkey)) {
        allContacts.push({
          pubkey: pubkey as string,
          alias: "",
          lastContact: new Date(),
        });
      }
    });

    return allContacts;
  }

  render() {
    if (!this.shadowRoot) return;

    const contacts = this.getContactsWithMessages();
    const selectedMessages = this.selectedContact
      ? this.getMessagesForContact(this.selectedContact.pubkey)
      : [];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }

        .chat-container {
          display: flex;
          height: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .sidebar {
          width: 300px;
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-3);
        }

        .connection-status.connected {
          background: var(--color-success-50);
          color: var(--color-success-600);
        }

        .connection-status.disconnected {
          background: var(--color-error-50);
          color: var(--color-error-600);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: var(--radius-full);
          background: currentColor;
        }

        .contacts-list {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-2);
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition-base);
          margin-bottom: var(--space-1);
        }

        .contact-item:hover {
          background: var(--color-surface-hover);
        }

        .contact-item.selected {
          background: var(--color-accent-light);
          color: var(--color-accent);
        }

        .contact-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--color-accent-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
          color: var(--color-accent);
        }

        .contact-info {
          flex: 1;
          min-width: 0;
        }

        .contact-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }

        .contact-pubkey {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          font-family: var(--font-family-mono);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .message {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          max-width: 70%;
        }

        .message.own {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--color-accent-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
          color: var(--color-accent);
          flex-shrink: 0;
        }

        .message-content {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-3);
          position: relative;
        }

        .message.own .message-content {
          background: var(--color-accent-light);
          border-color: var(--color-accent-light);
        }

        .message-text {
          color: var(--color-text-primary);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-1);
          word-wrap: break-word;
        }

        .message-time {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .message-input-container {
          padding: var(--space-4);
          border-top: 1px solid var(--color-border);
          display: flex;
          gap: var(--space-3);
          align-items: flex-end;
        }

        .message-input {
          flex: 1;
          resize: none;
          min-height: 20px;
          max-height: 100px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
          text-align: center;
          flex: 1;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin-bottom: var(--space-4);
          color: var(--color-text-muted);
        }

        .empty-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .empty-description {
          color: var(--color-text-muted);
          max-width: 300px;
          line-height: var(--line-height-relaxed);
        }

        .error-message {
          background: var(--color-error-50);
          color: var(--color-error-700);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          margin: var(--space-3);
          font-size: var(--font-size-sm);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 10;
            background: var(--color-background);
          }
          
          .chat-main {
            display: ${this.selectedContact ? "flex" : "none"};
          }
        }
      </style>

      <div class="chat-container">
        <div class="sidebar">
          <div class="sidebar-header">
            <h2 class="sidebar-title">Chats</h2>
            <ui-button class="add-contact-btn" variant="ghost" size="sm">Add</ui-button>
          </div>
          
          <div class="connection-status ${this.connected ? "connected" : "disconnected"}">
            <div class="status-dot"></div>
            ${this.connected ? "Connected" : "Disconnected"}
            ${
              !this.connected
                ? `
              <ui-button class="connect-btn" variant="ghost" size="xs" style="margin-left: auto;">Connect</ui-button>
            `
                : ""
            }
          </div>
          
          ${this.error ? `<div class="error-message">${this.error}</div>` : ""}
          
          <div class="contacts-list">
            ${
              contacts.length === 0
                ? `
              <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3 class="empty-title">No Contacts</h3>
                <p class="empty-description">
                  Add contacts to start encrypted messaging.
                </p>
              </div>
            `
                : `
              ${contacts
                .map(
                  (contact) => `
                <div class="contact-item ${this.selectedContact?.pubkey === contact.pubkey ? "selected" : ""}" 
                     data-pubkey="${contact.pubkey}">
                  <div class="contact-avatar">
                    ${(contact.alias || contact.pubkey.substring(0, 2)).toUpperCase()}
                  </div>
                  <div class="contact-info">
                    <div class="contact-name">
                      ${contact.alias || `User ${contact.pubkey.substring(0, 8)}...`}
                    </div>
                    <div class="contact-pubkey">${contact.pubkey.substring(0, 16)}...</div>
                  </div>
                </div>
              `,
                )
                .join("")}
            `
            }
          </div>
        </div>

        <div class="chat-main">
          ${
            !this.selectedContact
              ? `
            <div class="empty-state">
              <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <h3 class="empty-title">Select a Contact</h3>
              <p class="empty-description">
                Choose a contact from the sidebar to start an encrypted conversation.
              </p>
            </div>
          `
              : `
            <div class="chat-header">
              <h2 class="chat-title">
                ${this.selectedContact.alias || `User ${this.selectedContact.pubkey.substring(0, 8)}...`}
              </h2>
            </div>
            
            <div class="messages-container">
              ${
                selectedMessages.length === 0
                  ? `
                <div class="empty-state">
                  <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  <h3 class="empty-title">Start the Conversation</h3>
                  <p class="empty-description">
                    Send the first encrypted message to begin chatting.
                  </p>
                </div>
              `
                  : `
                ${selectedMessages
                  .map((message) => {
                    const isOwn =
                      message.from === this.userProfile?.nostrPubkey;
                    const avatar = isOwn
                      ? (
                          this.userProfile?.nostrPubkey?.substring(0, 2) || "ME"
                        ).toUpperCase()
                      : (
                          this.selectedContact?.alias?.substring(0, 2) ||
                          this.selectedContact?.pubkey?.substring(0, 2) ||
                          "U"
                        ).toUpperCase();

                    return `
                    <div class="message ${isOwn ? "own" : ""}">
                      <div class="message-avatar">${avatar}</div>
                      <div class="message-content">
                        <div class="message-text">${message.content}</div>
                        <div class="message-time">${this.formatDate(new Date(message.timestamp))}</div>
                      </div>
                    </div>
                  `;
                  })
                  .join("")}
              `
              }
            </div>
            
            ${
              this.connected
                ? `
              <div class="message-input-container">
                <ui-textarea 
                  class="message-input" 
                  placeholder="Type your encrypted message..." 
                  value="${this.newMessageContent}"
                  rows="1"
                ></ui-textarea>
                <ui-button class="send-btn" variant="primary" size="sm" 
                           ${!this.newMessageContent.trim() ? "disabled" : ""}>
                  Send
                </ui-button>
              </div>
            `
                : `
              <div class="message-input-container">
                <div style="flex: 1; text-align: center; color: var(--color-text-muted); font-size: var(--font-size-sm);">
                  Connect to Nostr to send messages
                </div>
                <ui-button class="connect-btn" variant="primary" size="sm">Connect</ui-button>
              </div>
            `
            }
          `
          }
        </div>
      </div>
    `;
  }
}

customElements.define("notention-chat-panel", ChatPanel);
