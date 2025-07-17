import { useAppStore } from "../store";
import { Match, NostrEvent, UserProfile } from "../../shared/types";
import { html, render } from "lit-html";
import { when } from "lit-html/directives/when.js";
import { repeat } from "lit-html/directives/repeat.js";
import { logger } from "../lib/utils";
import "./Button";
import "./Icon";

const log = logger("notention-network-panel");

type ActiveTab = "matches" | "public" | "relays";

export class NetworkPanel extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private matches: Match[] = [];
  private connected = false;
  private relays: string[] = [];
  private publicEvents: NostrEvent[] = [];
  private userProfile: UserProfile | null = null;
  private activeTab: ActiveTab = "matches";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        matches: state.matches,
        connected: state.nostrConnected,
        relays: state.nostrRelays,
        publicEvents: state.publicEvents,
        userProfile: state.userProfile,
      }),
      (state) => {
        this.matches = state.matches;
        this.connected = state.connected;
        this.relays = state.relays;
        this.publicEvents = state.publicEvents;
        this.userProfile = state.userProfile;
        this.render();
      },
      {
        equalityFn: (a, b) =>
          a.matches === b.matches &&
          a.connected === b.connected &&
          a.relays === b.relays &&
          a.publicEvents === b.publicEvents &&
          a.userProfile === b.userProfile,
      },
    );

    const initialState = useAppStore.getState();
    this.matches = initialState.matches;
    this.connected = initialState.nostrConnected;
    this.relays = initialState.nostrRelays;
    this.publicEvents = initialState.publicEvents;
    this.userProfile = initialState.userProfile;
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
  }

  private handleTabClick(tab: ActiveTab) {
    log(`Switching to tab: ${tab}`);
    this.activeTab = tab;
    this.render();
  }

  private async handleAddRelay() {
    const relayUrl = prompt("Enter relay URL (e.g., wss://relay.damus.io):");
    if (relayUrl && relayUrl.startsWith("wss://")) {
      log(`Adding relay: ${relayUrl}`);
      await useAppStore.getState().addNostrRelay(relayUrl);
    }
  }

  private async handleRemoveRelay(relay: string) {
    if (confirm(`Are you sure you want to remove the relay: ${relay}?`)) {
      log(`Removing relay: ${relay}`);
      await useAppStore.getState().removeNostrRelay(relay);
    }
  }

  private render() {
    if (!this.shadowRoot) return;
    log(`Rendering network panel, active tab: ${this.activeTab}`);

    const template = html`
      <link rel="stylesheet" href="src/ui/NetworkPanel.css" />
      <div class="network-container">
        <header class="network-header">
          <h1 class="network-title">Network</h1>
          <div
            class="connection-status ${this.connected
              ? "connected"
              : "disconnected"}"
          >
            <div class="status-dot"></div>
            <span>${this.connected ? "Connected" : "Disconnected"}</span>
          </div>
        </header>

        <div class="network-tabs">
          <button
            class="tab-button ${this.activeTab === "matches" ? "active" : ""}"
            @click=${() => this.handleTabClick("matches")}
          >
            Matches
          </button>
          <button
            class="tab-button ${this.activeTab === "public" ? "active" : ""}"
            @click=${() => this.handleTabClick("public")}
          >
            Public Feed
          </button>
          <button
            class="tab-button ${this.activeTab === "relays" ? "active" : ""}"
            @click=${() => this.handleTabClick("relays")}
          >
            Relays
          </button>
        </div>

        <div class="network-content">
          ${when(
            this.activeTab === "matches",
            () => this.renderMatches(),
            () =>
              when(
                this.activeTab === "public",
                () => this.renderPublicFeed(),
                () => this.renderRelays(),
              ),
          )}
        </div>
      </div>
    `;
    render(template, this.shadowRoot);
  }

  private renderMatches() {
    return html`
      ${when(
        this.matches.length > 0,
        () => html`
          <div class="matches-list">
            ${repeat(
              this.matches,
              (match) => match.id,
              (match) => html`<!-- TODO: Implement match item -->`,
            )}
          </div>
        `,
        () => html`
          <div class="empty-state">
            <ui-icon name="users" class="empty-icon"></ui-icon>
            <h3 class="empty-title">No Matches Found</h3>
            <p class="empty-description">
              Notes from other users that match your interests will appear here.
            </p>
          </div>
        `,
      )}
    `;
  }

  private renderPublicFeed() {
    return html`
      ${when(
        this.publicEvents.length > 0,
        () => html`
          <div class="public-feed-list">
            ${repeat(
              this.publicEvents,
              (event) => event.id,
              (event) => html`<!-- TODO: Implement public event item -->`,
            )}
          </div>
        `,
        () => html`
          <div class="empty-state">
            <ui-icon name="rss" class="empty-icon"></ui-icon>
            <h3 class="empty-title">Public Feed is Empty</h3>
            <p class="empty-description">
              Subscribe to relays to see public notes from the network.
            </p>
          </div>
        `,
      )}
    `;
  }

  private renderRelays() {
    return html`
      <div class="relays-container">
        <div class="relays-actions">
          <ui-button variant="primary" @click=${() => this.handleAddRelay()}>
            <ui-icon name="plus" slot="icon-left"></ui-icon>
            Add Relay
          </ui-button>
        </div>
        <ul class="relay-list">
          ${repeat(
            this.relays,
            (relay) => relay,
            (relay) => html`
              <li class="relay-item">
                <span class="relay-url">${relay}</span>
                <ui-button
                  variant="danger"
                  size="sm"
                  @click=${() => this.handleRemoveRelay(relay)}
                >
                  <ui-icon name="trash-2"></ui-icon>
                </ui-button>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }
}

customElements.define("notention-network-panel", NetworkPanel);
