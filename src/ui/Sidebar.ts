import { useAppStore } from "../store";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { when } from "lit-html/directives/when.js";
import { logger } from "../lib/utils";
import "./Button";
import "./FolderTree";
import "./Icon";
import { UserProfile } from "../../shared/types";

const log = logger("notention-sidebar");

interface SidebarTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

export class Sidebar extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private currentView = "notes";
  private userProfile: UserProfile | null = null;
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
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.currentView = this.getAttribute("current-view") || "notes";
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        sidebarTab: state.sidebarTab,
        directMessages: state.directMessages,
        matches: state.matches,
        userProfile: state.userProfile,
      }),
      ({ sidebarTab, directMessages, matches, userProfile }) => {
        log(
          `State updated: sidebarTab=${sidebarTab}, userProfile=${!!userProfile}`,
        );
        this.updateBadges(directMessages, matches);
        this.userProfile = userProfile;
        if (sidebarTab !== this.currentView) {
          this.currentView = sidebarTab;
        }
        this.render();
      },
      {
        equalityFn: (a, b) =>
          a.sidebarTab === b.sidebarTab &&
          a.directMessages === b.directMessages &&
          a.matches === b.matches &&
          a.userProfile === b.userProfile,
      },
    );
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "current-view" && oldValue !== newValue) {
      log(`Attribute 'current-view' changed to ${newValue}`);
      this.currentView = newValue || "notes";
      this.render();
    }
  }

  private updateBadges(directMessages: any[], matches: any[]) {
    const chatTab = this.tabs.find((tab) => tab.id === "chats");
    if (chatTab) {
      const newBadgeCount = directMessages?.length || 0;
      if (chatTab.badge !== newBadgeCount) {
        chatTab.badge = newBadgeCount;
        log(`Updating chats badge to ${newBadgeCount}`);
      }
    }
    const networkTab = this.tabs.find((tab) => tab.id === "network");
    if (networkTab) {
      const newBadgeCount = matches?.length || 0;
      if (networkTab.badge !== newBadgeCount) {
        networkTab.badge = newBadgeCount;
        log(`Updating network badge to ${newBadgeCount}`);
      }
    }
  }

  private handleTabClick(tabId: string) {
    log(`Tab clicked: ${tabId}`);
    if (tabId !== this.currentView) {
      useAppStore.getState().setSidebarTab(tabId as any);
    }
  }

  private async handleNewNote() {
    log("Creating new note");
    try {
      const noteId = await useAppStore.getState().createNote();
      log(`New note created with id: ${noteId}`);
      useAppStore.getState().setSidebarTab("notes");
      useAppStore.getState().setCurrentNote(noteId);
    } catch (error) {
      log.error("Error creating new note:", error);
    }
  }

  private getUsername(): string {
    if (!this.userProfile) return "Anonymous";
    const { name, nostrPubkey } = this.userProfile;
    return name || `${nostrPubkey.substring(0, 8)}...`;
  }

  render() {
    if (!this.shadowRoot) return;
    log(`Rendering sidebar for view: ${this.currentView}`);

    const template = html`
      <link rel="stylesheet" href="src/ui/Sidebar.css" />
      <div class="sidebar-content">
        <header class="sidebar-header">
          <h1 class="sidebar-title">Notention</h1>
          <button class="new-note-button" @click=${() => this.handleNewNote()}>
            <ui-icon name="plus-circle" class="nav-icon"></ui-icon>
            <span>New Note</span>
          </button>
        </header>

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
                    aria-current=${tab.id === this.currentView
                      ? "page"
                      : "false"}
                  >
                    <ui-icon name=${tab.icon} class="nav-icon"></ui-icon>
                    <span class="nav-label">${tab.label}</span>
                    ${when(
                      tab.badge && tab.badge > 0,
                      () => html`<span class="nav-badge">${tab.badge}</span>`,
                    )}
                  </button>
                </li>
              `,
            )}
          </ul>
        </nav>

        <div class="sidebar-folders">
          ${when(
            this.currentView === "notes",
            () => html`<notention-folder-tree></notention-folder-tree>`,
          )}
        </div>

        <footer class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              ${this.getUsername().charAt(0).toUpperCase()}
            </div>
            <div class="user-details">
              <p class="user-name">${this.getUsername()}</p>
              <p class="user-status">Online</p>
            </div>
          </div>
        </footer>
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("notention-sidebar", Sidebar);
