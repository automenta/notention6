// src/ui/NotentionApp.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { createSidebar } from "./Sidebar";
import { createAccountWizard } from "./AccountWizard";
import { createNotificationBar } from "./NotificationBar";
import { ComponentRegistry } from "../lib/ComponentRegistry";
import { registerComponents } from "../lib/ComponentRegistrations";
import { AnimationSystem, createFeedbackSystem } from "../lib/AnimationSystem";
import { AppRouter } from "./AppRouter";
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

export function renderApp(rootElement: HTMLElement) {
  // Initial render function
  const render = () => {
    const { userProfile, sidebarTab, sidebarCollapsed } =
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
      AnimationSystem.fadeIn(appContainer);

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
