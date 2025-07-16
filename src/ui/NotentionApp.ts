import { useAppStore } from "../store";
import { html, render } from "lit-html";
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
    this.initializeApp();
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        hasProfile: !!state.userProfile?.nostrPubkey,
        sidebarTab: state.sidebarTab,
      }),
      ({ hasProfile, sidebarTab }) => {
        const needsRender =
          this.showWizard !== !hasProfile || this.currentView !== sidebarTab;

        this.showWizard = !hasProfile;
        this.currentView = sidebarTab;

        if (needsRender) {
          this.render();
        }
      },
      { equalityFn: (a, b) => a.hasProfile === b.hasProfile && a.sidebarTab === b.sidebarTab }
    );

    this.setupEventListeners();
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
    window.removeEventListener("resize", this.handleResize);
  }

  private async initializeApp() {
    try {
      await useAppStore.getState().initializeApp();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  }

  private setupEventListeners() {
    this.addEventListener("notention-navigate", this.handleNavigation);
    this.addEventListener("wizard-completed", this.handleWizardCompleted);
    this.addEventListener("toggle-sidebar", this.handleToggleSidebar);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
  }

  private handleNavigation = (event: CustomEvent) => {
    const { view } = event.detail;
    if (view && view !== this.currentView) {
      useAppStore.getState().setSidebarTab(view);
    }
  };

  private handleWizardCompleted = () => {
    this.showWizard = false;
    this.render();
  };

  private handleToggleSidebar = () => {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.render();
  };

  private handleResize = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
      this.render();
    }
  };

  private getMainContent() {
    const views: { [key: string]: () => any } = {
      dashboard: () => html`<notention-dashboard></notention-dashboard>`,
      notes: () => html`<notention-notes-list></notention-notes-list>`,
      ontology: () => html`<notention-ontology-editor></notention-ontology-editor>`,
      network: () => html`<notention-network-panel></notention-network-panel>`,
      settings: () => html`<notention-settings></notention-settings>`,
      contacts: () => html`<contacts-view></contacts-view>`,
      chats: () => html`<notention-chat-panel></notention-chat-panel>`,
    };

    return html`
      ${Object.entries(views).map(
        ([view, template]) => html`
          <div
            class="view-wrapper"
            data-view="${view}"
            ?hidden="${view !== this.currentView}"
          >
            ${template()}
          </div>
        `,
      )}
    `;
  }

  render() {
    if (!this.shadowRoot) return;

    const template = html`
      <link rel="stylesheet" href="src/ui/styles/variables.css" />
      <link rel="stylesheet" href="src/ui/styles/base.css" />
      <link rel="stylesheet" href="src/ui/NotentionApp.css" />

      ${this.showWizard
        ? html`<notention-account-wizard></notention-account-wizard>`
        : html`
            <div class="app-container">
              <div
                class="sidebar-overlay ${!this.sidebarCollapsed ? "show" : ""}"
                @click="${() => {
                  this.sidebarCollapsed = true;
                  this.render();
                }}"
              ></div>

              <div
                class="sidebar-container ${this.sidebarCollapsed
                  ? "collapsed"
                  : ""} ${!this.sidebarCollapsed ? "show" : ""}"
              >
                <notention-sidebar
                  current-view="${this.currentView}"
                ></notention-sidebar>
              </div>

              <div
                class="main-container ${this.sidebarCollapsed
                  ? "sidebar-collapsed"
                  : ""}"
              >
                <header class="app-header">
                  <div class="header-left">
                    <button
                      class="toggle-sidebar-btn"
                      @click="${() => {
                        this.sidebarCollapsed = !this.sidebarCollapsed;
                        this.render();
                      }}"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
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

                <main class="main-content">${this.getMainContent()}</main>
              </div>
            </div>
          `}
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("notention-app", NotentionApp);
