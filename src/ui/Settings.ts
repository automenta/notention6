import { useAppStore } from "../store";
import { UserProfile } from "../../shared/types";
import { html, render } from "lit-html";
import { when } from "lit-html/directives/when.js";
import { logger } from "../lib/utils";
import "./Button";
import "./Input";
import "./Icon";

const log = logger("notention-settings");

export class Settings extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private userProfile: UserProfile | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        userProfile: state.userProfile,
      }),
      ({ userProfile }) => {
        this.userProfile = userProfile;
        this.render();
      },
      {
        equalityFn: (a, b) => a.userProfile === b.userProfile,
      },
    );

    this.userProfile = useAppStore.getState().userProfile;
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
  }

  private handleThemeChange(e: Event) {
    const theme = (e.target as HTMLSelectElement).value as
      | "light"
      | "dark"
      | "system";
    log(`Theme changed to: ${theme}`);
    useAppStore.getState().setTheme(theme);
  }

  private handleToggle(key: keyof UserProfile["preferences"]) {
    log(`Toggling setting: ${key}`);
    const currentValue = this.userProfile?.preferences?.[key];
    useAppStore.getState().updateUserProfile({
      ...this.userProfile,
      preferences: {
        ...this.userProfile?.preferences,
        [key]: !currentValue,
      },
    });
  }

  render() {
    if (!this.shadowRoot) return;
    log("Rendering settings");

    const template = html`
      <link rel="stylesheet" href="src/ui/Settings.css" />
      <div class="settings-container">
        <header class="settings-header">
          <h1 class="settings-title">Settings</h1>
        </header>

        <div class="settings-content">
          ${this.renderAccountSection()} ${this.renderAppearanceSection()}
          ${this.renderAISection()} ${this.renderPrivacySection()}
          ${this.renderDataSection()}
        </div>
      </div>
    `;
    render(template, this.shadowRoot);
  }

  private renderAccountSection() {
    return html`
      <div class="settings-section">
        <h2 class="section-title">Account</h2>
        <p class="section-description">
          Manage your Nostr identity and profile information.
        </p>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Public Key</div>
            <div class="setting-description">
              ${this.userProfile?.nostrPubkey || "Not set"}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderAppearanceSection() {
    const theme = this.userProfile?.preferences?.theme || "system";
    return html`
      <div class="settings-section">
        <h2 class="section-title">Appearance</h2>
        <p class="section-description">
          Customize the look and feel of the application.
        </p>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Theme</div>
          </div>
          <div class="setting-control">
            <select
              class="theme-select"
              .value=${theme}
              @change=${this.handleThemeChange}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private renderAISection() {
    const aiEnabled = this.userProfile?.preferences?.aiEnabled || false;
    return html`
      <div class="settings-section">
        <h2 class="section-title">AI Features</h2>
        <p class="section-description">
          Configure optional AI enhancements for note-taking and organization.
        </p>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Enable AI Features</div>
          </div>
          <div class="setting-control">
            <ui-button
              variant=${aiEnabled ? "primary" : "secondary"}
              @click=${() => this.handleToggle("aiEnabled")}
            >
              ${aiEnabled ? "Enabled" : "Disabled"}
            </ui-button>
          </div>
        </div>
      </div>
    `;
  }

  private renderPrivacySection() {
    // Add privacy settings when available in the store
    return html``;
  }

  private renderDataSection() {
    return html`
      <div class="settings-section">
        <h2 class="section-title">Data</h2>
        <p class="section-description">
          Import, export, and manage your application data.
        </p>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Export Data</div>
            <div class="setting-description">
              Download all notes and settings as a JSON file.
            </div>
          </div>
          <div class="setting-control">
            <ui-button variant="secondary">Export</ui-button>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Import Data</div>
            <div class="setting-description">
              Import data from a previously exported file.
            </div>
          </div>
          <div class="setting-control">
            <ui-button variant="secondary">Import</ui-button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("notention-settings", Settings);
