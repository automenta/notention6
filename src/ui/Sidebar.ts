import { useAppStore } from "../store";
import "./Button";

interface SidebarTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

export class Sidebar extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private currentView = "notes";
  private tabs: SidebarTab[] = [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "notes", label: "Notes", icon: "file-text" },
    { id: "ontology", label: "Ontology", icon: "network" },
    { id: "network", label: "Network", icon: "globe" },
    { id: "contacts", label: "Contacts", icon: "users" },
    { id: "chats", label: "Chats", icon: "message-circle" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  static get observedAttributes() {
    return ["current-view"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.currentView = this.getAttribute("current-view") || "notes";

    // Subscribe to store changes
    this.unsubscribe = useAppStore.subscribe((state) => {
      // Update badges based on store state
      this.updateBadges(state);

      if (state.sidebarTab !== this.currentView) {
        this.currentView = state.sidebarTab;
        this.render();
      }
    });

    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "current-view" && oldValue !== newValue) {
      this.currentView = newValue || "notes";
      this.render();
    }
  }

  private updateBadges(state: any) {
    // Update chat badge with unread message count
    const chatTab = this.tabs.find((tab) => tab.id === "chats");
    if (chatTab) {
      chatTab.badge = state.directMessages?.length || 0;
    }

    // Update network badge with match count
    const networkTab = this.tabs.find((tab) => tab.id === "network");
    if (networkTab) {
      networkTab.badge = state.matches?.length || 0;
    }
  }

  private handleTabClick(tabId: string) {
    if (tabId !== this.currentView) {
      this.currentView = tabId;
      useAppStore.getState().setSidebarTab(tabId as any);

      // Dispatch navigation event
      this.dispatchEvent(
        new CustomEvent("notention-navigate", {
          detail: { view: tabId },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private handleNewNote() {
    useAppStore
      .getState()
      .createNote()
      .then((noteId) => {
        // Navigate to notes view and set current note
        useAppStore.getState().setSidebarTab("notes");
        useAppStore.getState().setCurrentNote(noteId);

        this.dispatchEvent(
          new CustomEvent("notention-navigate", {
            detail: { view: "notes", noteId },
            bubbles: true,
            composed: true,
          }),
        );
      });
  }

  private getIcon(iconName: string): string {
    const icons: { [key: string]: string } = {
      home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
      "file-text":
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline>',
      network:
        '<circle cx="12" cy="12" r="2"></circle><path d="m16.24 7.76-1.42 1.42M8.18 8.18l-1.42-1.42M21 12h-2M5 12H3M16.24 16.24l-1.42-1.42M8.18 15.82l-1.42 1.42"></path>',
      globe:
        '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
      users:
        '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="m22 21-3-3m2-9a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>',
      "message-circle":
        '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>',
      settings:
        '<circle cx="12" cy="12" r="3"></circle><path d="m19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
      plus: '<path d="M12 5v14m-7-7h14"></path>',
      search:
        '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>',
    };
    return icons[iconName] || icons["file-text"];
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
        }

        .sidebar-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .sidebar-header {
          padding: var(--space-6) var(--space-4) var(--space-4) var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }

        .sidebar-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-4) 0;
        }

        .new-note-button {
          width: 100%;
          background: var(--color-accent);
          color: var(--color-text-inverse);
          border: none;
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: var(--transition-base);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }

        .new-note-button:hover {
          background: var(--color-accent-hover);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-4) 0;
          overflow-y: auto;
        }

        .nav-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-item {
          margin-bottom: var(--space-1);
        }

        .nav-button {
          width: 100%;
          background: none;
          border: none;
          padding: var(--space-3) var(--space-4);
          text-align: left;
          cursor: pointer;
          transition: var(--transition-base);
          border-radius: 0;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          position: relative;
        }

        .nav-button:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .nav-button.active {
          background: var(--color-accent-light);
          color: var(--color-accent);
          border-right: 2px solid var(--color-accent);
        }

        .nav-button.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--color-accent);
        }

        .nav-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
        }

        .nav-badge {
          background: var(--color-error-500);
          color: var(--color-text-inverse);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          padding: 2px 6px;
          border-radius: var(--radius-full);
          min-width: 18px;
          text-align: center;
          line-height: 1.2;
        }

        .sidebar-footer {
          padding: var(--space-4);
          border-top: 1px solid var(--color-border);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2);
          border-radius: var(--radius-md);
          transition: var(--transition-base);
        }

        .user-info:hover {
          background: var(--color-surface-hover);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-inverse);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-status {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin: 0;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .sidebar-header {
            padding: var(--space-4) var(--space-3);
          }

          .nav-button {
            padding: var(--space-3);
          }

          .sidebar-footer {
            padding: var(--space-3);
          }
        }
      </style>

      <div class="sidebar-content">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <h1 class="sidebar-title">Notention</h1>
          <button class="new-note-button" data-action="new-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${this.getIcon("plus")}
            </svg>
            New Note
          </button>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <ul class="nav-list">
            ${this.tabs
              .map(
                (tab) => `
              <li class="nav-item">
                <button 
                  class="nav-button ${tab.id === this.currentView ? "active" : ""}"
                  data-tab="${tab.id}"
                  data-action="handle-tab-click"
                >
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${this.getIcon(tab.icon)}
                  </svg>
                  <span class="nav-label">${tab.label}</span>
                  ${tab.badge && tab.badge > 0 ? `<span class="nav-badge">${tab.badge}</span>` : ""}
                </button>
              </li>
            `,
              )
              .join("")}
          </ul>
        </nav>

        <!-- User Info -->
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              U
            </div>
            <div class="user-details">
              <p class="user-name">User</p>
              <p class="user-status">Online</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for dynamic content
    this.addEventListeners();
  }

  private addEventListeners() {
    if (!this.shadowRoot) return;

    // New note button
    const newNoteButton = this.shadowRoot.querySelector('[data-action="new-note"]');
    if (newNoteButton) {
      newNoteButton.addEventListener("click", () => this.handleNewNote());
    }

    // Navigation buttons
    const navButtons = this.shadowRoot.querySelectorAll('[data-action="handle-tab-click"]');
    navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabId = (button as HTMLElement).dataset.tab;
        if (tabId) {
          this.handleTabClick(tabId);
        }
      });
    });
  }
}

customElements.define("notention-sidebar", Sidebar);
