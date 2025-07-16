import { useAppStore } from "../store";
import "./Sidebar";
import "./NoteEditor";
import "./NotesList";
import "./OntologyEditor";
import "./NetworkPanel";
import "./Settings";
import "./AccountWizard";
import "./ChatPanel";

export class NotentionApp extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private showWizard = false;
  private currentView = "notes";
  private sidebarCollapsed = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Initialize app
    this.initializeApp();

    // Subscribe to store changes
    this.unsubscribe = useAppStore.subscribe((state) => {
      const hasProfile = !!state.userProfile?.nostrPubkey;
      const newView = state.sidebarTab;

      if (this.showWizard !== !hasProfile || this.currentView !== newView) {
        this.showWizard = !hasProfile;
        this.currentView = newView;
        this.render();
      }
    });

    this.setupEventListeners();
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private async initializeApp() {
    try {
      await useAppStore.getState().initializeApp();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  }

  private setupEventListeners() {
    // Handle navigation events
    this.addEventListener(
      "notention-navigate",
      this.handleNavigation.bind(this),
    );
    this.addEventListener(
      "wizard-completed",
      this.handleWizardCompleted.bind(this),
    );
    this.addEventListener(
      "toggle-sidebar",
      this.handleToggleSidebar.bind(this),
    );

    // Handle responsive behavior
    this.handleResize();
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  private handleNavigation(event: CustomEvent) {
    const { view } = event.detail;
    if (view && view !== this.currentView) {
      useAppStore.getState().setSidebarTab(view);
    }
  }

  private handleWizardCompleted() {
    this.showWizard = false;
    this.render();
  }

  private handleToggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.render();
  }

  private handleResize() {
    const isMobile = window.innerWidth < 768;
    if (isMobile && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
      this.render();
    }
  }

  private getMainContent() {
    switch (this.currentView) {
      case "notes":
        return "<notention-notes-list></notention-notes-list>";
      case "ontology":
        return "<notention-ontology-editor></notention-ontology-editor>";
      case "network":
        return "<notention-network-panel></notention-network-panel>";
      case "settings":
        return "<notention-settings></notention-settings>";
      case "contacts":
        return "<notention-contact-list></notention-contact-list>";
      case "chats":
        return "<notention-chat-panel></notention-chat-panel>";
      default:
        return "<notention-notes-list></notention-notes-list>";
    }
  }

  render() {
    if (!this.shadowRoot) return;

    if (this.showWizard) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            min-height: 100vh;
            background: var(--color-background);
          }
        </style>
        <notention-account-wizard></notention-account-wizard>
      `;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: var(--color-background);
          font-family: var(--font-family-sans);
        }

        .app-container {
          display: flex;
          min-height: 100vh;
          position: relative;
        }

        .sidebar-container {
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          width: 280px;
          flex-shrink: 0;
          transition: transform var(--transition-base);
          position: relative;
          z-index: var(--z-fixed);
        }

        .sidebar-container.collapsed {
          transform: translateX(-100%);
          position: fixed;
          height: 100vh;
        }

        .main-container {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: var(--color-background);
          transition: margin-left var(--transition-base);
        }

        .main-container.sidebar-collapsed {
          margin-left: 0;
        }

        .app-header {
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding: var(--space-3) var(--space-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 60px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .toggle-sidebar-btn {
          display: none;
          background: none;
          border: none;
          padding: var(--space-2);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: var(--transition-base);
        }

        .toggle-sidebar-btn:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .app-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .main-content {
          flex: 1;
          padding: var(--space-6);
          overflow-y: auto;
          min-height: 0;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: var(--z-modal-backdrop);
        }

        .sidebar-overlay.show {
          display: block;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed;
            height: 100vh;
            z-index: var(--z-modal);
            transform: translateX(-100%);
          }

          .sidebar-container.show {
            transform: translateX(0);
          }

          .main-container {
            margin-left: 0 !important;
          }

          .toggle-sidebar-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .main-content {
            padding: var(--space-4);
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: var(--space-3);
          }
          
          .app-header {
            padding: var(--space-2) var(--space-3);
            min-height: 50px;
          }
        }

        /* Status Indicators */
        .status-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
          background: var(--color-error-500);
        }

        .status-dot.connected {
          background: var(--color-success-500);
        }

        .status-dot.syncing {
          background: var(--color-warning-500);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>

      <div class="app-container">
        <!-- Sidebar Overlay for Mobile -->
        <div class="sidebar-overlay ${!this.sidebarCollapsed ? "show" : ""}" 
             @click="${() => {
               this.sidebarCollapsed = true;
               this.render();
             }}"></div>

        <!-- Sidebar -->
        <div class="sidebar-container ${this.sidebarCollapsed ? "collapsed" : ""} ${!this.sidebarCollapsed ? "show" : ""}">
          <notention-sidebar current-view="${this.currentView}"></notention-sidebar>
        </div>

        <!-- Main Content Area -->
        <div class="main-container ${this.sidebarCollapsed ? "sidebar-collapsed" : ""}">
          <!-- App Header -->
          <header class="app-header">
            <div class="header-left">
              <button class="toggle-sidebar-btn" @click="${() => {
                this.sidebarCollapsed = !this.sidebarCollapsed;
                this.render();
              }}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12h18m-9-9v18"></path>
                </svg>
              </button>
              <h1 class="app-title">Notention</h1>
            </div>
            <div class="status-indicator">
              <div class="status-dot connected"></div>
              <span>Connected</span>
            </div>
          </header>

          <!-- Main Content -->
          <main class="main-content">
            ${this.getMainContent()}
          </main>
        </div>
      </div>
    `;

    // Add event listeners for dynamic content
    this.addEventListeners();
  }

  private addEventListeners() {
    if (!this.shadowRoot) return;

    // Toggle sidebar button
    const toggleBtn = this.shadowRoot.querySelector(".toggle-sidebar-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.render();
      });
    }

    // Sidebar overlay
    const overlay = this.shadowRoot.querySelector(".sidebar-overlay");
    if (overlay) {
      overlay.addEventListener("click", () => {
        this.sidebarCollapsed = true;
        this.render();
      });
    }
  }
}

customElements.define("notention-app", NotentionApp);
