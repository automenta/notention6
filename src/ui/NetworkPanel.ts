import { useAppStore } from "../store";
import { Match, NostrEvent } from "../../shared/types";
import "./Button";

export class NetworkPanel extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private matches: Match[] = [];
  private connected = false;
  private loading = false;
  private error = "";
  private relays: string[] = [];
  private activeTab = "matches"; // 'matches' | 'public' | 'relays'
  private publicFeedSubscription: string | null = null;
  private dmSubscription: string | null = null;
  private publicEvents: NostrEvent[] = [];
  private userProfile: any = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe((state) => {
      this.matches = state.matches;
      this.connected = state.nostrConnected; // Fixed: use nostrConnected instead of connected
      this.loading = state.loading.network;
      this.error = state.errors.network || state.errors.sync || "";
      this.relays = state.nostrRelays;
      this.userProfile = state.userProfile;
      this.render();
    });

    this.setupEventListeners();
    this.render();
  }

  private setupEventListeners() {
    this.addEventListener("click", this.handleClick.bind(this));
  }

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;

    // Handle tab switching
    if (target.classList.contains("tab-button")) {
      const tabs = this.shadowRoot?.querySelectorAll(".tab-button");
      tabs?.forEach((tab) => tab.classList.remove("active"));
      target.classList.add("active");

      this.activeTab = target.dataset.tab || "matches";
      this.render();
      return;
    }

    // Handle connect/disconnect button
    if (target.classList.contains("connect-btn")) {
      this.handleConnectionToggle();
      return;
    }

    // Handle subscribe to public feed
    if (target.classList.contains("subscribe-public-btn")) {
      this.handlePublicFeedSubscription();
      return;
    }

    // Handle subscribe to DMs
    if (target.classList.contains("subscribe-dm-btn")) {
      this.handleDMSubscription();
      return;
    }

    // Handle add relay
    if (target.classList.contains("add-relay-btn")) {
      this.handleAddRelay();
      return;
    }

    // Handle remove relay
    if (target.hasAttribute("data-relay-index")) {
      const index = parseInt(target.getAttribute("data-relay-index") || "0");
      this.handleRemoveRelay(index);
      return;
    }
  }

  private async handleConnectionToggle() {
    const store = useAppStore.getState();

    if (this.connected) {
      // Disconnect
      await store.logoutFromNostr();
    } else {
      // Try to connect with existing keys or generate new ones
      await store.initializeNostr();
      if (!this.userProfile?.nostrPubkey) {
        await store.generateAndStoreNostrKeys();
      }
    }
  }

  private handlePublicFeedSubscription() {
    const store = useAppStore.getState();

    if (this.publicFeedSubscription) {
      // Unsubscribe
      store.unsubscribeFromNostr(this.publicFeedSubscription);
      this.publicFeedSubscription = null;
    } else {
      // Subscribe
      this.publicFeedSubscription = store.subscribeToPublicNotes();
    }
    this.render();
  }

  private handleDMSubscription() {
    const store = useAppStore.getState();

    if (this.dmSubscription) {
      // Unsubscribe
      store.unsubscribeFromNostr(this.dmSubscription);
      this.dmSubscription = null;
    } else {
      // Subscribe
      this.dmSubscription = store.subscribeToDirectMessages();
    }
    this.render();
  }

  private async handleAddRelay() {
    const relayUrl = prompt("Enter relay URL (e.g., wss://relay.damus.io):");
    if (relayUrl && relayUrl.startsWith("wss://")) {
      const store = useAppStore.getState();
      await store.addNostrRelay(relayUrl);
    }
  }

  private async handleRemoveRelay(index: number) {
    if (this.relays[index] && confirm(`Remove relay ${this.relays[index]}?`)) {
      const store = useAppStore.getState();
      await store.removeNostrRelay(this.relays[index]);
    }
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  private renderActiveTab(): string {
    switch (this.activeTab) {
      case "matches":
        return this.renderMatchesTab();
      case "public":
        return this.renderPublicFeedTab();
      case "relays":
        return this.renderRelaysTab();
      default:
        return this.renderMatchesTab();
    }
  }

  private renderMatchesTab(): string {
    if (this.loading) {
      return `
        <div class="loading-spinner">
          <div>Loading matches...</div>
        </div>
      `;
    }

    if (this.error) {
      return `
        <div class="error-message">
          Error: ${this.error}
        </div>
        ${this.renderMatchesList()}
      `;
    }

    return this.renderMatchesList();
  }

  private renderMatchesList(): string {
    if (this.matches.length === 0) {
      return `
        <div class="connection-controls">
          <div class="connection-info">
            ${
              this.connected
                ? "Connected to Nostr network. Matches will appear here as they are discovered."
                : "Connect to Nostr to discover related notes and collaborate with other users."
            }
          </div>
          <ui-button class="connect-btn" variant="${this.connected ? "secondary" : "primary"}" size="sm">
            ${this.connected ? "Disconnect" : "Connect to Nostr"}
          </ui-button>
        </div>
        
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <h3 class="empty-title">No Matches Yet</h3>
          <p class="empty-description">
            Once connected, Notention will automatically discover notes from other users 
            that share similar topics and interests with your notes.
          </p>
        </div>
      `;
    }

    return `
      <div class="connection-controls">
        <div class="connection-info">
          Found ${this.matches.length} matching note${this.matches.length === 1 ? "" : "s"} from the network.
        </div>
        <ui-button class="connect-btn" variant="secondary" size="sm">
          ${this.connected ? "Disconnect" : "Connect"}
        </ui-button>
      </div>
      
      <div class="matches-list">
        ${this.matches
          .map(
            (match) => `
          <div class="match-item">
            <div class="match-header">
              <div class="match-info">
                <div class="match-author">User ${match.targetAuthor.substring(0, 8)}...</div>
                <div class="match-meta">${this.formatDate(new Date(match.timestamp))}</div>
              </div>
              <div class="match-similarity">${Math.round(match.similarity * 100)}% match</div>
            </div>
            
            ${
              match.sharedTags.length > 0
                ? `
              <div class="match-tags">
                ${match.sharedTags
                  .map(
                    (tag) => `
                  <span class="match-tag">${tag}</span>
                `,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
            
            <div class="match-actions">
              <ui-button variant="secondary" size="sm">View Note</ui-button>
              <ui-button variant="ghost" size="sm">Contact Author</ui-button>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  private renderPublicFeedTab(): string {
    if (!this.connected) {
      return `
        <div class="connection-controls">
          <div class="connection-info">
            Connect to Nostr to browse the public feed.
          </div>
          <ui-button class="connect-btn" variant="primary" size="sm">
            Connect to Nostr
          </ui-button>
        </div>
        
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rss x="4" y="11" width="7" height="7"></rss>
            <path d="M9 12a3 3 0 0 1 3 3"></path>
            <path d="M5 12a7 7 0 0 1 7 7"></path>
          </svg>
          <h3 class="empty-title">Public Feed</h3>
          <p class="empty-description">
            View recent public notes from the Nostr network. Connect to see the latest activity.
          </p>
        </div>
      `;
    }

    return `
      <div class="connection-controls">
        <div class="connection-info">
          ${
            this.publicFeedSubscription
              ? "Subscribed to public feed. Recent notes will appear here."
              : "Subscribe to see recent public notes from the network."
          }
        </div>
        <ui-button class="subscribe-public-btn" variant="${this.publicFeedSubscription ? "secondary" : "primary"}" size="sm">
          ${this.publicFeedSubscription ? "Unsubscribe" : "Subscribe to Public Feed"}
        </ui-button>
        <ui-button class="subscribe-dm-btn" variant="${this.dmSubscription ? "secondary" : "outline"}" size="sm">
          ${this.dmSubscription ? "Stop DM Sync" : "Sync Direct Messages"}
        </ui-button>
      </div>
      
      <div class="public-feed">
        ${
          this.publicEvents.length === 0
            ? `
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6"></path>
              <path d="M1 12h6m6 0h6"></path>
            </svg>
            <h3 class="empty-title">No Recent Activity</h3>
            <p class="empty-description">
              Subscribe to the public feed to see recent notes from the network.
            </p>
          </div>
        `
            : `
          ${this.publicEvents
            .map(
              (event) => `
            <div class="public-event">
              <div class="event-header">
                <div class="event-author">${event.pubkey.substring(0, 16)}...</div>
                <div class="event-time">${this.formatDate(new Date(event.created_at * 1000))}</div>
              </div>
              <div class="event-content">${this.truncateText(event.content, 200)}</div>
              ${
                event.tags && event.tags.length > 0
                  ? `
                <div class="event-tags">
                  ${event.tags
                    .filter((tag) => tag[0] === "t")
                    .map(
                      (tag) => `
                    <span class="event-tag">#${tag[1]}</span>
                  `,
                    )
                    .join("")}
                </div>
              `
                  : ""
              }
            </div>
          `,
            )
            .join("")}
        `
        }
      </div>
    `;
  }

  private renderRelaysTab(): string {
    return `
      <div class="connection-controls">
        <div class="connection-info">
          ${this.relays.length} relay${this.relays.length === 1 ? "" : "s"} configured.
        </div>
        <ui-button class="add-relay-btn" variant="primary" size="sm">
          Add Relay
        </ui-button>
      </div>
      
      <div class="relay-list">
        ${this.relays
          .map(
            (relay, index) => `
          <div class="relay-item">
            <div class="relay-url">${relay}</div>
            <ui-button variant="ghost" size="sm" data-relay-index="${index}">
              Remove
            </ui-button>
          </div>
        `,
          )
          .join("")}
      </div>
      
      ${
        this.relays.length === 0
          ? `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"></path>
          </svg>
          <h3 class="empty-title">No Relays Configured</h3>
          <p class="empty-description">
            Add Nostr relays to connect with the decentralized network. Relays help you 
            discover and sync your notes with other users.
          </p>
        </div>
      `
          : ""
      }
    `;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }

        .network-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }

        .network-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
        }

        .network-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
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
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
          background: currentColor;
        }

        .network-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-6);
        }

        .tab-button {
          background: none;
          border: none;
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: var(--transition-base);
        }

        .tab-button:hover {
          color: var(--color-text-primary);
        }

        .tab-button.active {
          color: var(--color-accent);
          border-bottom-color: var(--color-accent);
        }

        .network-content {
          flex: 1;
          overflow-y: auto;
        }

        .matches-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .match-item {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: var(--transition-base);
        }

        .match-item:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-border-strong);
        }

        .match-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }

        .match-info {
          flex: 1;
        }

        .match-author {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .match-meta {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .match-similarity {
          background: var(--color-accent-light);
          color: var(--color-accent);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
        }

        .match-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .match-tag {
          background: var(--color-background-secondary);
          color: var(--color-text-secondary);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }

        .match-actions {
          display: flex;
          gap: var(--space-2);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
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
          max-width: 400px;
          line-height: var(--line-height-relaxed);
        }

        .coming-soon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
          text-align: center;
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

        .connection-controls {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
          align-items: center;
        }

        .connection-info {
          flex: 1;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .relay-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .relay-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .relay-url {
          font-family: var(--font-family-mono);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        .public-feed {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .public-event {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }

        .event-author {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          font-family: var(--font-family-mono);
        }

        .event-time {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .event-content {
          color: var(--color-text-primary);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-3);
        }

        .event-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-1);
        }

        .event-tag {
          background: var(--color-background-secondary);
          color: var(--color-text-secondary);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
        }

        .error-message {
          background: var(--color-error-50);
          color: var(--color-error-700);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
          font-size: var(--font-size-sm);
        }
      </style>

      <div class="network-container">
        <div class="network-header">
          <h1 class="network-title">Network</h1>
          <div class="connection-status ${this.connected ? "connected" : "disconnected"}">
            <div class="status-dot"></div>
            ${this.connected ? "Connected" : "Disconnected"}
            ${this.userProfile?.nostrPubkey ? `<br><small>${this.userProfile.nostrPubkey.substring(0, 16)}...</small>` : ""}
          </div>
        </div>

        <div class="network-tabs">
          <button class="tab-button ${this.activeTab === "matches" ? "active" : ""}" data-tab="matches">Matches</button>
          <button class="tab-button ${this.activeTab === "public" ? "active" : ""}" data-tab="public">Public Feed</button>
          <button class="tab-button ${this.activeTab === "relays" ? "active" : ""}" data-tab="relays">Relays</button>
        </div>

        <div class="network-content">
          ${this.renderActiveTab()}
        </div>
      </div>
    `;
  }
}

customElements.define("notention-network-panel", NetworkPanel);
