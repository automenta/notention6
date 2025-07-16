import { useAppStore } from "../store";
import "./Sidebar";
import "./NoteEditor";
import "./NotesList";
import "./OntologyEditor";
import "./NetworkPanel";
import "./Settings";
import "./AccountWizard";
import "./ChatPanel";
import "./ContactsView";
import "./Dashboard";

export class NotentionApp extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private showWizard = false;
  private currentView = "dashboard";
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
    const views = {
      dashboard: "<notention-dashboard></notention-dashboard>",
      notes: "<notention-notes-list></notention-notes-list>",
      ontology: "<notention-ontology-editor></notention-ontology-editor>",
      network: "<notention-network-panel></notention-network-panel>",
      settings: "<notention-settings></notention-settings>",
      contacts: "<contacts-view></contacts-view>",
      chats: "<notention-chat-panel></notention-chat-panel>",
    };

    return Object.entries(views)
      .map(([view, content]) => {
        const isVisible = view === this.currentView;
        return `<div class="view-wrapper" data-view="${view}" ${
          isVisible ? "" : "hidden"
        }>${content}</div>`;
      })
      .join("");
  }

  render() {
    if (!this.shadowRoot) return;

    if (this.showWizard) {
      this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="src/ui/styles/variables.css">
        <link rel="stylesheet" href="src/ui/styles/base.css">
        <notention-account-wizard></notention-account-wizard>
      `;
      return;
    }

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="src/ui/styles/variables.css">
      <link rel="stylesheet" href="src/ui/styles/base.css">
      <link rel="stylesheet" href="src/ui/NotentionApp.css">

      <div class="app-container">
        <!-- Sidebar Overlay for Mobile -->
        <div class="sidebar-overlay ${!this.sidebarCollapsed ? "show" : ""}" 
             data-action="close-sidebar"></div>

        <!-- Sidebar -->
        <div class="sidebar-container ${this.sidebarCollapsed ? "collapsed" : ""} ${!this.sidebarCollapsed ? "show" : ""}">
          <notention-sidebar current-view="${this.currentView}"></notention-sidebar>
        </div>

        <!-- Main Content Area -->
        <div class="main-container ${this.sidebarCollapsed ? "sidebar-collapsed" : ""}">
          <!-- App Header -->
          <header class="app-header">
            <div class="header-left">
              <button class="toggle-sidebar-btn" data-action="toggle-sidebar">
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
    const toggleBtn = this.shadowRoot.querySelector('[data-action="toggle-sidebar"]');
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.render();
      });
    }

    // Sidebar overlay
    const overlay = this.shadowRoot.querySelector('[data-action="close-sidebar"]');
    if (overlay) {
      overlay.addEventListener("click", () => {
        this.sidebarCollapsed = true;
        this.render();
      });
    }
  }
}

customElements.define("notention-app", NotentionApp);
