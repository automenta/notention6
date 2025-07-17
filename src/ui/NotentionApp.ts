import { useAppStore } from "../store";
import { html, render } from "lit-html";
import { choose } from "lit-html/directives/choose.js";
import { when } from "lit-html/directives/when.js";
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
import { logger } from "../lib/utils";

const log = logger("notention-app");

export class NotentionApp extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private showWizard = false;
  private currentView = "dashboard";
  private sidebarCollapsed = false;
  private initialized = false;
  private theme = "system";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected to DOM");
    this.initializeApp();

    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        hasProfile: !!state.userProfile?.nostrPubkey,
        sidebarTab: state.sidebarTab,
        theme: state.userProfile?.preferences?.theme || "system",
      }),
      ({ hasProfile, sidebarTab, theme }) => {
        log(
          `State changed: hasProfile=${hasProfile}, sidebarTab=${sidebarTab}, theme=${theme}`,
        );
        const needsRender =
          this.showWizard !== !hasProfile ||
          this.currentView !== sidebarTab ||
          this.theme !== theme;

        this.showWizard = !hasProfile;
        this.currentView = sidebarTab;
        this.theme = theme;

        if (needsRender) {
          log("Triggering re-render due to state change");
          this.render();
        }
      },
      {
        equalityFn: (a, b) =>
          a.hasProfile === b.hasProfile &&
          a.sidebarTab === b.sidebarTab &&
          a.theme === b.theme,
      },
    );

    this.setupEventListeners();
    this.handleResize(); // Initial check
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected from DOM");
    this.unsubscribe();
    window.removeEventListener("resize", this.handleResize);
  }

  private async initializeApp() {
    log("Initializing application state...");
    try {
      await useAppStore.getState().initializeApp();
      this.initialized = true;
      log("Application initialized successfully");
    } catch (error) {
      log.error("Failed to initialize app:", error);
      // Optionally, render an error state
    } finally {
      this.render();
    }
  }

  private setupEventListeners() {
    log("Setting up event listeners");
    this.addEventListener("notention-navigate", this.handleNavigation);
    this.addEventListener("wizard-completed", this.handleWizardCompleted);
    this.addEventListener("toggle-sidebar", this.handleToggleSidebar);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
  }

  private handleNavigation = (event: CustomEvent) => {
    const { view } = event.detail;
    log(`Navigation event received for view: ${view}`);
    if (view && view !== this.currentView) {
      useAppStore.getState().setSidebarTab(view);
    }
  };

  private handleWizardCompleted = () => {
    log("Wizard completed event received");
    this.showWizard = false;
    this.render();
  };

  private handleToggleSidebar = () => {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    log(`Toggling sidebar. Collapsed: ${this.sidebarCollapsed}`);
    this.render();
  };

  private handleResize = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
      log("Resized to mobile view, collapsing sidebar");
      this.render();
    }
  };

  private renderMainContent() {
    log(`Rendering main content for view: ${this.currentView}`);
    return html`${choose(this.currentView, [
      ["dashboard", () => html`<notention-dashboard></notention-dashboard>`],
      ["notes", () => html`<notention-notes-list></notention-notes-list>`],
      [
        "ontology",
        () => html`<notention-ontology-editor></notention-ontology-editor>`,
      ],
      [
        "network",
        () => html`<notention-network-panel></notention-network-panel>`,
      ],
      ["settings", () => html`<notention-settings></notention-settings>`],
      ["contacts", () => html`<contacts-view></contacts-view>`],
      ["chats", () => html`<notention-chat-panel></notention-chat-panel>`],
    ])}`;
  }

  render() {
    if (!this.shadowRoot) return;
    log("Render method called");

    this.dataset.theme = this.theme;

    const template = html`
      <link rel="stylesheet" href="src/ui/styles/variables.css" />
      <link rel="stylesheet" href="src/ui/styles/base.css" />
      <link rel="stylesheet" href="src/ui/NotentionApp.css" />

      ${when(
        !this.initialized,
        () => html`<div class="loading-overlay"><h1>Loading...</h1></div>`,
        () => html`
          ${when(
            this.showWizard,
            () => html`<notention-account-wizard></notention-account-wizard>`,
            () => html`
              <div class="app-container">
                <div
                  class="sidebar-overlay ${!this.sidebarCollapsed
                    ? "show"
                    : ""}"
                  @click=${() => {
                    this.sidebarCollapsed = true;
                    this.render();
                  }}
                ></div>

                <aside
                  class="sidebar-container ${this.sidebarCollapsed
                    ? "collapsed"
                    : ""} ${!this.sidebarCollapsed ? "show" : ""}"
                >
                  <notention-sidebar
                    current-view="${this.currentView}"
                  ></notention-sidebar>
                </aside>

                <div
                  class="main-container ${this.sidebarCollapsed
                    ? "sidebar-collapsed"
                    : ""}"
                >
                  <header class="app-header">
                    <div class="header-left">
                      <button
                        class="toggle-sidebar-btn"
                        @click=${this.handleToggleSidebar}
                        aria-label="Toggle Sidebar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <line x1="3" y1="12" x2="21" y2="12"></line>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                      </button>
                      <h1 class="app-title">Notention</h1>
                    </div>
                    <div class="status-indicator">
                      <div class="status-dot connected"></div>
                      <span>Connected</span>
                    </div>
                  </header>

                  <main class="main-content">${this.renderMainContent()}</main>
                </div>
              </div>
            `,
          )}
        `,
      )}
    `;

    render(template, this.shadowRoot);
    log("Render complete");
  }
}

customElements.define("notention-app", NotentionApp);
