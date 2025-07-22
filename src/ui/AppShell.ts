
// src/ui/AppShell.ts
import { useAppStore } from "../store";
import { createAccountWizard } from "./AccountWizard";
import { createNotificationBar } from "./NotificationBar";
import { registerComponents } from "../lib/ComponentRegistrations";
import { AnimationSystem } from "../lib/AnimationSystem";
import { createSidebar } from "./Sidebar"; // Import Sidebar
import { createNotesApp } from "./NotesApp"; // Import NotesApp
import { createMessagingApp } from "./MessagingApp"; // Import MessagingApp
import { createOntologyEditor } from "./OntologyEditor"; // Import OntologyEditor
import { createNetworkPanel } from "./NetworkPanel"; // Import NetworkPanel
import { createSettings } from "./Settings"; // Import Settings
import { createContactsView } from "./ContactsView"; // Import ContactsView
import { createChatPanel } from "./ChatPanel"; // Import ChatPanel
import { createProfileEditor } from "./ProfileEditor"; // Import ProfileEditor
import { createDashboard } from "./Dashboard"; // Import Dashboard
import "./NotentionApp.css";

// A type guard to check if a profile exists and has a public key
function profileExists(profile: any): profile is { nostrPubkey: string } {
  return (
    profile &&
    typeof profile.nostrPubkey === "string" &&
    profile.nostrPubkey.length > 0
  );
}

function applyTheme() {
  const { userProfile } = useAppStore.getState();
  const theme = userProfile?.preferences.theme || "system";

  // Remove all theme attributes
  document.documentElement.removeAttribute("data-theme");

  if (theme === "system") {
    // Apply dark theme if system preference is dark
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } else {
    // Apply the selected theme
    document.documentElement.setAttribute("data-theme", theme);
  }
}

interface AppShellConfig {
  // renderContent: () => HTMLElement; // No longer needed as AppShell will manage content based on sidebarTab
}

export function createAppShell(rootElement: HTMLElement, config?: AppShellConfig) { // config is now optional
  const render = () => {
    const { userProfile, sidebarTab } = useAppStore.getState();

    applyTheme();

    rootElement.innerHTML = "";

    if (!profileExists(userProfile)) {
      const wizard = createAccountWizard();
      rootElement.appendChild(wizard);
    } else {
      const appContainer = document.createElement("div");
      appContainer.className = "app-container";
      AnimationSystem.fadeIn(appContainer);

      // Sidebar
      const sidebar = createSidebar(sidebarTab);
      appContainer.appendChild(sidebar);

      // Main Content Area
      const mainContentArea = document.createElement("main");
      mainContentArea.className = "main-content-area";

      let currentContent: HTMLElement | null = null;

      switch (sidebarTab) {
        case "dashboard":
          currentContent = createDashboard();
          break;
        case "notes":
          currentContent = createNotesApp(mainContentArea); // Pass mainContentArea as root for NotesApp
          break;
        case "profile":
          currentContent = createProfileEditor();
          break;
        case "ontology":
          currentContent = createOntologyEditor();
          break;
        case "network":
          currentContent = createNetworkPanel();
          break;
        case "matches":
          // Matches panel is part of NetworkPanel, or could be a separate view if needed.
          // For now, direct to NetworkPanel.
          currentContent = createNetworkPanel();
          break;
        case "contacts":
          currentContent = createContactsView();
          break;
        case "chats":
          currentContent = createChatPanel();
          break;
        case "settings":
          currentContent = createSettings();
          break;
        default:
          currentContent = createDashboard(); // Default to dashboard
      }

      if (currentContent) {
        mainContentArea.appendChild(currentContent);
      }

      appContainer.appendChild(mainContentArea);

      // Notification Bar
      const notificationBar = createNotificationBar();
      appContainer.appendChild(notificationBar);

      rootElement.appendChild(appContainer);
    }
  };

  // Subscribe to the store for re-renders on state changes
  useAppStore.subscribe(render);
  useAppStore.subscribe((state) => state.sidebarTab, render); // Re-render when sidebarTab changes

  // Listen for component preference changes to re-render
  window.addEventListener("componentPreferenceChanged", (event: any) => {
    const { typeId } = event.detail;
    // Re-render if the note editor preference changes, as it affects the view
    if (typeId === "noteEditor") {
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
