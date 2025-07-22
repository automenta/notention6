
import { useAppStore } from "../store";
import { createNotesList } from "./NotesList";
import { createNoteEditor } from "./NoteEditor";
import { createFolderView } from "./FolderView";
import { createButton } from "./Button";
import "./NotentionApp.css";

export function createNotesApp(): HTMLElement {
  const { currentNoteId, notesViewMode, setNotesViewMode } = useAppStore.getState();

  const mainContainer = document.createElement("div");
  mainContainer.className = "two-panel-layout notes-layout";

  const leftPanel = document.createElement("div");
  leftPanel.className = "left-panel";
  
  const toggleButton = createButton({
    label: notesViewMode === "list" ? "Show Folders" : "Show Notes",
    onClick: () => {
      setNotesViewMode(notesViewMode === "list" ? "folders" : "list");
    },
    variant: "secondary",
    className: "view-toggle-btn"
  });
  leftPanel.appendChild(toggleButton);

  if (notesViewMode === 'list') {
    const notesList = createNotesList();
    leftPanel.appendChild(notesList);
  } else {
    const folderView = createFolderView();
    leftPanel.appendChild(folderView);
  }

  const rightPanel = document.createElement("div");
  rightPanel.className = "right-panel";
  
  const noteEditor = createNoteEditor(currentNoteId);
  rightPanel.appendChild(noteEditor);

  mainContainer.appendChild(leftPanel);
  mainContainer.appendChild(rightPanel);
  
  return mainContainer;
}

