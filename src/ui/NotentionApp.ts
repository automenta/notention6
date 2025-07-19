// src/ui-rewrite/NotentionApp.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { createSidebar } from "./Sidebar";
import { createAccountWizard } from "./AccountWizard";
import { createDashboard } from "./Dashboard";
import { createNotesList } from "./NotesList";
import { createNoteEditor } from "./NoteEditor";
import { createProfileEditor } from "./ProfileEditor";
import { createOntologyEditor } from "./OntologyEditor";
import { createFolderView } from "./FolderView";
import { createNetworkPanel } from "./NetworkPanel";
import { createContactsView } from "./ContactsView";
import { createChatPanel } from "./ChatPanel";
import { createSettings } from "./Settings";
import { createNotificationBar } from "./NotificationBar";
import { ComponentRegistry } from "../lib/ComponentRegistry";
import { registerComponents } from "../lib/ComponentRegistrations";
import { AnimationSystem, createFeedbackSystem } from "../lib/AnimationSystem";
import "./NotentionApp.css";

// A type guard to check if a profile exists and has a public key
function profileExists(profile: any): profile is { nostrPubkey: string } {
  return (
    profile &&
    typeof profile.nostrPubkey === "string" &&
    profile.nostrPubkey.length > 0
  );
}

// Global feedback system
const feedback = createFeedbackSystem();

function applyTheme() {
  const { userProfile } = useAppStore.getState();
  const theme = userProfile?.preferences.theme || "system";
  if (
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function renderApp(rootElement: HTMLElement) {
  // Initial render function
  const render = () => {
    const { userProfile, sidebarTab, sidebarCollapsed, currentNoteId } =
      useAppStore.getState();

    // Apply the theme
    applyTheme();

    // Clear the root element
    rootElement.innerHTML = "";

    if (!profileExists(userProfile)) {
      // If no profile, show the wizard
      const wizard = createAccountWizard();
      rootElement.appendChild(wizard);
    } else {
      // If profile exists, show the main app
      const appContainer = document.createElement("div");
      appContainer.className = "app-container";

      // Sidebar
      const sidebarContainer = document.createElement("aside");
      sidebarContainer.className = `sidebar-container ${sidebarCollapsed ? "collapsed" : ""}`;
      const sidebar = createSidebar(sidebarTab);
      sidebarContainer.appendChild(sidebar);

      // Main Content
      const mainContainer = document.createElement("div");
      mainContainer.className = "main-container";

      // Header
      const header = document.createElement("header");
      header.className = "app-header";
      const toggleButton = createButton({
        label: "☰",
        onClick: () => useAppStore.getState().toggleSidebar(),
        variant: "secondary",
      });
      const title = document.createElement("h1");
      title.textContent = "Notention";
      header.appendChild(toggleButton);
      header.appendChild(title);

      // Main View
      const mainViewContainer = document.createElement("main");
      mainViewContainer.className = "main-content";

      let currentView: HTMLElement | null;

      if (sidebarTab === "notes" && currentNoteId) {
        // Use component registry to create note editor with user's preferred variant
        const noteEditor = ComponentRegistry.createComponent(
          "noteEditor",
          currentNoteId,
        );
        currentView = noteEditor || createNoteEditor(currentNoteId); // Fallback to original if registry fails
      } else {
        switch (sidebarTab) {
          case "dashboard":
            currentView = createDashboard();
            break;
          case "notes":
            currentView = createNotesList();
            break;
          case "profile":
            currentView = createProfileEditor();
            break;
          case "folders":
            currentView = createFolderView();
            break;
          case "ontology":
            currentView = createOntologyEditor();
            break;
          case "network":
            currentView = createNetworkPanel();
            break;
          case "contacts":
            currentView = createContactsView();
            break;
          case "chats":
            currentView = createChatPanel();
            break;
          case "settings":
            currentView = createSettings();
            break;
          default:
            currentView = createDashboard();
        }
      }

      if (currentView) {
        mainViewContainer.appendChild(currentView);
      }

      mainContainer.appendChild(header);
      mainContainer.appendChild(mainViewContainer);

      appContainer.appendChild(sidebarContainer);
      appContainer.appendChild(mainContainer);

      // Notification Bar
      const notificationBar = createNotificationBar();
      appContainer.appendChild(notificationBar);

      rootElement.appendChild(appContainer);
    }
  };

  // Subscribe to the store
  useAppStore.subscribe(render);

  // Listen for component preference changes to re-render
  window.addEventListener("componentPreferenceChanged", (event: any) => {
    const { typeId } = event.detail;
    if (typeId === "noteEditor") {
      // Re-render the app to use the new preferred component
      render();
    }
  });

  // Initialize component registry before app initialization
  registerComponents();

  // Initial call to initialize and render the app
  useAppStore
    .getState()
    .initializeApp()
    .then(() => {
      render();
    });
}
