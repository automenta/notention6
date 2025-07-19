// src/ui/Sidebar.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./Sidebar.css";

type AppView =
  | "dashboard"
  | "notes"
  | "profile"
  | "folders"
  | "ontology"
  | "network"
  | "matches"
  | "contacts"
  | "chats"
  | "settings";

const views: { id: AppView; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "ontology", label: "Ontology", icon: "🌳" },
  { id: "network", label: "Network", icon: "🌐" },
  { id: "matches", label: "Matches", icon: "🔗" },
  { id: "contacts", label: "Contacts", icon: "👥" },
  { id: "chats", label: "Chats", icon: "💬" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export function createSidebar(currentView: AppView): HTMLElement {
  const { sidebarCollapsed } = useAppStore.getState();

  const nav = document.createElement("nav");
  nav.className = "sidebar-nav";

  views.forEach((view) => {
    const button = createButton({
      label: sidebarCollapsed ? view.icon : `${view.icon} ${view.label}`,
      onClick: () => useAppStore.getState().setSidebarTab(view.id),
      variant: currentView === view.id ? "primary" : "ghost",
      className: "sidebar-button",
    });
    nav.appendChild(button);
  });

  return nav;
}
