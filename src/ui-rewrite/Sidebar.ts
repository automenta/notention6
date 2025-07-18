// src/ui-rewrite/Sidebar.ts
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
  | "contacts"
  | "chats"
  | "settings";

const views: { id: AppView; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "notes", label: "Notes" },
  { id: "profile", label: "Profile" },
  { id: "ontology", label: "Ontology" },
  { id: "network", label: "Network" },
  { id: "contacts", label: "Contacts" },
  { id: "chats", label: "Chats" },
  { id: "settings", label: "Settings" },
];

export function createSidebar(currentView: AppView): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "sidebar-nav";

  views.forEach((view) => {
    const button = createButton({
      label: view.label,
      onClick: () => useAppStore.getState().setSidebarTab(view.id),
      variant: currentView === view.id ? "primary" : "secondary",
    });
    nav.appendChild(button);
  });

  return nav;
}
