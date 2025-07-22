// src/ui/NotentionApp.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { createSidebar } from "./Sidebar";
import { AppRouter } from "./AppRouter";
import { createAppShell } from "./AppShell";
import "./NotentionApp.css";

function renderNotentionContent(): HTMLElement {
  const { sidebarTab, sidebarCollapsed } = useAppStore.getState();

  const appContent = document.createElement("div");
  appContent.className = "app-content-container"; // A new class for styling if needed

  // Sidebar
  const sidebarContainer = document.createElement("aside");
  sidebarContainer.className = `sidebar-container ${
    sidebarCollapsed ? "collapsed" : ""
  }`;
  const sidebar = createSidebar(sidebarTab);
  sidebarContainer.appendChild(sidebar);

  // Main Content
  const mainContainer = document.createElement("div");
  mainContainer.className = "main-container";

  // Main View
  const mainViewContainer = document.createElement("main");
  mainViewContainer.className = "main-content";

  const toggleButton = createButton({
    label: "☰",
    onClick: () => useAppStore.getState().toggleSidebar(),
    variant: "secondary",
    className: "sidebar-toggle-btn",
  });
  mainContainer.appendChild(toggleButton);

  const currentView = AppRouter();
  mainViewContainer.appendChild(currentView);

  mainContainer.appendChild(mainViewContainer);

  appContent.appendChild(sidebarContainer);
  appContent.appendChild(mainContainer);

  return appContent;
}

export function renderApp(rootElement: HTMLElement) {
  createAppShell(rootElement, {
    renderContent: renderNotentionContent,
  });
}
