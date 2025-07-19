import { useStore } from "../store";
import { createDashboard } from "./Dashboard/index";
import { createNotesList } from "./NotesList";
import { createNoteEditor } from "./NoteEditor/index";
import { createProfileEditor } from "./ProfileEditor";
import { createOntologyEditor } from "./OntologyEditor";
import { createFolderView } from "./FolderView";
import { createNetworkPanel } from "./NetworkPanel";
import { createContactsView } from "./ContactsView";
import { createChatPanel } from "./ChatPanel";
import { createSettings } from "./Settings";
import { ComponentRegistry } from "../lib/ComponentRegistry";

export function AppRouter(): HTMLElement {
  const sidebarTab = useStore.use.sidebarTab();
  const currentNoteId = useStore.use.currentNoteId();

  let currentView: HTMLElement | null = null;

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

  return currentView || document.createElement("div");
}
