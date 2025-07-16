import { useAppStore } from "../store";
import { UserProfile } from "../../shared/types";
import "./Button";
import "./Input";

export class Settings extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private userProfile: UserProfile | undefined = undefined;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe((state) => {
      this.userProfile = state.userProfile;
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

        .settings-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-header {
          margin-bottom: var(--space-6);
        }

        .settings-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
        }

        .settings-section {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .section-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-4) 0;
        }

        .section-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-4);
          line-height: var(--line-height-relaxed);
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3) 0;
          border-bottom: 1px solid var(--color-border);
        }

        .setting-row:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
        }

        .setting-label {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .setting-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .setting-control {
          flex-shrink: 0;
          margin-left: var(--space-4);
        }

        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: var(--color-border);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: var(--transition-base);
        }

        .toggle-switch.checked {
          background: var(--color-accent);
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: var(--radius-full);
          transition: var(--transition-base);
        }

        .toggle-switch.checked::after {
          transform: translateX(20px);
        }

        .coming-soon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
          text-align: center;
          opacity: 0.6;
        }

        .coming-soon-icon {
          width: 48px;
          height: 48px;
          margin-bottom: var(--space-3);
          color: var(--color-text-muted);
        }

        .coming-soon-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          font-style: italic;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .setting-row {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-3);
          }

          .setting-control {
            margin-left: 0;
            align-self: flex-end;
          }
        }
      </style>

      <div class="settings-container">
        <div class="settings-header">
          <h1 class="settings-title">Settings</h1>
        </div>

        <div class="settings-content">
          <!-- Account Settings -->
          <div class="settings-section">
            <h2 class="section-title">Account</h2>
            <p class="section-description">
              Manage your Nostr identity and profile information.
            </p>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Public Key</div>
                <div class="setting-description">
                  ${this.userProfile?.nostrPubkey || "Not connected"}
                </div>
              </div>
            </div>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Connection Status</div>
                <div class="setting-description">
                  ${this.userProfile?.nostrPubkey ? "Connected to Nostr" : "Not connected"}
                </div>
              </div>
              <div class="setting-control">
                <ui-button variant="secondary" size="sm">
                  ${this.userProfile?.nostrPubkey ? "Manage Keys" : "Connect"}
                </ui-button>
              </div>
            </div>
          </div>

          <!-- Appearance -->
          <div class="settings-section">
            <h2 class="section-title">Appearance</h2>
            <p class="section-description">
              Customize the look and feel of the application.
            </p>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Theme</div>
                <div class="setting-description">
                  Choose between light, dark, or system theme
                </div>
              </div>
              <div class="setting-control">
                <select style="padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                  <option value="system" ${this.userProfile?.preferences?.theme === "system" ? "selected" : ""}>System</option>
                  <option value="light" ${this.userProfile?.preferences?.theme === "light" ? "selected" : ""}>Light</option>
                  <option value="dark" ${this.userProfile?.preferences?.theme === "dark" ? "selected" : ""}>Dark</option>
                </select>
              </div>
            </div>
          </div>

          <!-- AI Features -->
          <div class="settings-section">
            <h2 class="section-title">AI Features</h2>
            <p class="section-description">
              Configure optional AI enhancements for note-taking and organization.
            </p>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Enable AI Features</div>
                <div class="setting-description">
                  Turn on AI-powered auto-tagging, summarization, and suggestions
                </div>
              </div>
              <div class="setting-control">
                <div class="toggle-switch ${this.userProfile?.preferences?.aiEnabled ? "checked" : ""}"></div>
              </div>
            </div>

            ${
              this.userProfile?.preferences?.aiEnabled
                ? `
              <div class="coming-soon">
                <svg class="coming-soon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="m19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <div class="coming-soon-text">AI configuration panel coming soon</div>
              </div>
            `
                : ""
            }
          </div>

          <!-- Privacy -->
          <div class="settings-section">
            <h2 class="section-title">Privacy</h2>
            <p class="section-description">
              Control what information you share on the Nostr network.
            </p>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Share Notes Publicly</div>
                <div class="setting-description">
                  Allow your published notes to be discoverable by others
                </div>
              </div>
              <div class="setting-control">
                <div class="toggle-switch ${this.userProfile?.privacySettings?.sharePublicNotesGlobally ? "checked" : ""}"></div>
              </div>
            </div>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Share Tags</div>
                <div class="setting-description">
                  Include tags when sharing notes publicly
                </div>
              </div>
              <div class="setting-control">
                <div class="toggle-switch ${this.userProfile?.privacySettings?.shareTagsWithPublicNotes ? "checked" : ""}"></div>
              </div>
            </div>
          </div>

          <!-- Data -->
          <div class="settings-section">
            <h2 class="section-title">Data</h2>
            <p class="section-description">
              Import, export, and manage your data.
            </p>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Export Data</div>
                <div class="setting-description">
                  Download all your notes and settings as JSON
                </div>
              </div>
              <div class="setting-control">
                <ui-button variant="secondary" size="sm">Export</ui-button>
              </div>
            </div>
            
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Import Data</div>
                <div class="setting-description">
                  Restore from a previous export or migrate from another app
                </div>
              </div>
              <div class="setting-control">
                <ui-button variant="secondary" size="sm">Import</ui-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("notention-settings", Settings);
