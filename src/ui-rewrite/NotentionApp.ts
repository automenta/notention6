// src/ui-rewrite/NotentionApp.ts

import { createButton } from "./Button";
import { createNoteEditor } from "./NoteEditor";
import { createNotesList } from "./NotesList";
import { createOntologyEditor } from "./OntologyEditor";

interface Note {
  id: string;
  title: string;
  content: string;
}

export function renderApp(rootElement: HTMLElement) {
  let sidebarCollapsed = false;
  let notes: Note[] = [];
  let ontology: any = {};
  let currentView: "notes" | "ontology" = "notes";

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    render();
  }

  function addNote(note: { title: string; content: string }) {
    notes.push({ ...note, id: Date.now().toString() });
    render();
  }

  function deleteNote(noteId: string) {
    notes = notes.filter(note => note.id !== noteId);
    render();
  }

  function saveOntology(newOntology: any) {
    ontology = newOntology;
    render();
  }

  function switchView(view: "notes" | "ontology") {
    currentView = view;
    render();
  }

  function render() {
    rootElement.innerHTML = `
      <div class="app-container">
        <aside class="sidebar-container ${sidebarCollapsed ? "collapsed" : ""}">
          <div id="notes-list-container"></div>
        </aside>
        <div class="main-container">
          <header class="app-header">
            <div id="toggle-button-container"></div>
            <h1 class="app-title">Notention</h1>
            <div id="view-switcher-container"></div>
          </header>
          <main class="main-content">
            <div id="main-view-container"></div>
          </main>
        </div>
      </div>
    `;

    const toggleButtonContainer = rootElement.querySelector("#toggle-button-container") as HTMLElement;
    const viewSwitcherContainer = rootElement.querySelector("#view-switcher-container") as HTMLElement;
    const mainViewContainer = rootElement.querySelector("#main-view-container") as HTMLElement;
    const notesListContainer = rootElement.querySelector("#notes-list-container") as HTMLElement;

    const toggleButton = createButton({
      label: "Toggle Sidebar",
      onClick: toggleSidebar,
    });

    const notesViewButton = createButton({
      label: "Notes",
      onClick: () => switchView("notes"),
      variant: currentView === "notes" ? "primary" : "secondary",
    });

    const ontologyViewButton = createButton({
      label: "Ontology",
      onClick: () => switchView("ontology"),
      variant: currentView === "ontology" ? "primary" : "secondary",
    });

    const noteEditor = createNoteEditor({
      onSave: addNote,
    });

    const ontologyEditor = createOntologyEditor({
      onSave: saveOntology,
    });

    const notesList = createNotesList({
      notes: notes,
      onDelete: deleteNote,
    });

    toggleButtonContainer.innerHTML = "";
    toggleButtonContainer.appendChild(toggleButton);

    viewSwitcherContainer.innerHTML = "";
    viewSwitcherContainer.appendChild(notesViewButton);
    viewSwitcherContainer.appendChild(ontologyViewButton);

    mainViewContainer.innerHTML = "";
    if (currentView === "notes") {
      mainViewContainer.appendChild(noteEditor);
    } else {
      mainViewContainer.appendChild(ontologyEditor);
    }

    notesListContainer.innerHTML = "";
    notesListContainer.appendChild(notesList);
  }

  render();
}