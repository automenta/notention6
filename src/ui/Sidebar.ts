import { useAppStore } from "../store";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import "./Button";
import "./FolderTree";
import "./Icon";

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
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        sidebarTab: state.sidebarTab,
        directMessages: state.directMessages,
        matches: state.matches,
      }),
      ({ sidebarTab, directMessages, matches }) => {
        this.updateBadges(directMessages, matches);
        if (sidebarTab !== this.currentView) {
          this.currentView = sidebarTab;
          this.render();
        }
      },
      {
        equalityFn: (a, b) =>
          a.sidebarTab === b.sidebarTab &&
          a.directMessages === b.directMessages &&
          a.matches === b.matches,
      }
    );
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

  private updateBadges(directMessages: any[], matches: any[]) {
    const chatTab = this.tabs.find((tab) => tab.id === "chats");
    if (chatTab) {
      chatTab.badge = directMessages?.length || 0;
    }
    const networkTab = this.tabs.find((tab) => tab.id === "network");
    if (networkTab) {
      networkTab.badge = matches?.length || 0;
    }
  }

  private handleTabClick(tabId: string) {
    if (tabId !== this.currentView) {
      useAppStore.getState().setSidebarTab(tabId as any);
    }
  }

  private handleNewNote() {
    useAppStore
      .getState()
      .createNote()
      .then((noteId) => {
        useAppStore.getState().setSidebarTab("notes");
        useAppStore.getState().setCurrentNote(noteId);
      });
  }

  render() {
    if (!this.shadowRoot) return;

    const template = html`
      <link rel="stylesheet" href="src/ui/Sidebar.css" />
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h1 class="sidebar-title">Notention</h1>
          <button class="new-note-button" @click=${this.handleNewNote}>
            <ui-icon icon="plus" class="nav-icon"></ui-icon>
            New Note
          </button>
        </div>

        <nav class="sidebar-nav">
          <ul class="nav-list">
            ${repeat(
              this.tabs,
              (tab) => tab.id,
              (tab) => html`
                <li class="nav-item">
                  <button
                    class="nav-button ${tab.id === this.currentView
                      ? "active"
                      : ""}"
                    @click=${() => this.handleTabClick(tab.id)}
                  >
                    <ui-icon icon=${tab.icon} class="nav-icon"></ui-icon>
                    <span class="nav-label">${tab.label}</span>
                    ${tab.badge && tab.badge > 0
                      ? html`<span class="nav-badge">${tab.badge}</span>`
                      : ""}
                  </button>
                </li>
              `,
            )}
          </ul>
        </nav>

        ${this.currentView === "notes"
          ? html`<notention-folder-tree></notention-folder-tree>`
          : ""}

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">U</div>
            <div class="user-details">
              <p class="user-name">User</p>
              <p class="user-status">Online</p>
            </div>
          </div>
        </div>
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("notention-sidebar", Sidebar);
