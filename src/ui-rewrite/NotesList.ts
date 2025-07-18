// src/ui-rewrite/NotesList.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./NotesList.css";
import { Note } from "../../shared/types";

export function createNotesList(): HTMLElement {
  const {
    notes,
    folders,
    createFolder,
    updateNote,
    searchQuery,
    setSearchQuery,
    setCurrentNote,
    noteView,
    setNoteView,
  } = useAppStore.getState();
  let notesArray: Note[] = Object.values(notes);

  const container = document.createElement("div");
  container.className = "notes-list-container";

  // Header
  const header = document.createElement("header");
  header.className = "notes-list-header";
  const title = document.createElement("h1");
  title.textContent = "Notes";
  header.appendChild(title);
  container.appendChild(header);

  // Search and Filter
  const searchFilterContainer = document.createElement("div");
  searchFilterContainer.className = "search-filter-container";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Search notes...";
  searchInput.value = searchQuery;
  searchInput.oninput = (e) => {
    setSearchQuery((e.target as HTMLInputElement).value);
  };
  searchFilterContainer.appendChild(searchInput);

  const viewSwitcher = document.createElement("div");
  viewSwitcher.className = "view-switcher";

  const allButton = createButton({
    label: "All",
    onClick: () => setNoteView("all"),
    variant: noteView === "all" ? "primary" : "secondary",
  });
  viewSwitcher.appendChild(allButton);

  const favoritesButton = createButton({
    label: "Favorites",
    onClick: () => setNoteView("favorites"),
    variant: noteView === "favorites" ? "primary" : "secondary",
  });
  viewSwitcher.appendChild(favoritesButton);

  const archivedButton = createButton({
    label: "Archived",
    onClick: () => setNoteView("archived"),
    variant: noteView === "archived" ? "primary" : "secondary",
  });
  viewSwitcher.appendChild(archivedButton);

  searchFilterContainer.appendChild(viewSwitcher);

  const newFolderButton = createButton({
    label: "New Folder",
    onClick: () => {
      const folderName = prompt("Enter new folder name:");
      if (folderName) {
        createFolder({ name: folderName });
      }
    },
    variant: "secondary",
  });
  searchFilterContainer.appendChild(newFolderButton);

  container.appendChild(searchFilterContainer);

  // Notes List
  const list = document.createElement("ul");
  list.className = "notes-list";

  if (noteView === "favorites") {
    notesArray = notesArray.filter((note) => note.pinned);
  } else if (noteView === "archived") {
    notesArray = notesArray.filter((note) => note.archived);
  }

  // Use semantic search if there's a query, otherwise use simple filtering
  let filteredNotes: Note[] = [];
  if (searchQuery.trim()) {
    // Import NoteService for semantic search
    import("../services/NoteService").then(async ({ NoteService }) => {
      const { ontology } = useAppStore.getState();
      try {
        filteredNotes = await NoteService.semanticSearch(
          searchQuery,
          ontology,
          {},
          notesArray,
        );
        // Re-render the list with search results
        renderNotesList(list, filteredNotes);
      } catch (error) {
        console.error(
          "Semantic search failed, falling back to simple search:",
          error,
        );
        filteredNotes = notesArray.filter(
          (note) =>
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        renderNotesList(list, filteredNotes);
      }
    });
    // For immediate feedback, use simple filtering first
    filteredNotes = notesArray.filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  } else {
    filteredNotes = notesArray;
  }

  // Initial render
  renderNotesList(list, filteredNotes);

  function renderNotesList(listElement: HTMLElement, notes: Note[]) {
    // Clear existing content
    listElement.innerHTML = "";

    if (notes.length > 0) {
      notes.forEach((note) => {
        const listItem = document.createElement("li");
        listItem.className = "note-item";
        listItem.onclick = () => setCurrentNote(note.id);

        const noteTitle = document.createElement("h3");
        noteTitle.textContent = note.title || "Untitled Note";
        listItem.appendChild(noteTitle);

        const noteExcerpt = document.createElement("p");
        noteExcerpt.innerHTML = note.content.substring(0, 100) + "...";
        listItem.appendChild(noteExcerpt);

        const noteMeta = document.createElement("div");
        noteMeta.className = "note-meta";

        const noteDate = document.createElement("span");
        noteDate.className = "note-date";
        noteDate.textContent = new Date(note.updatedAt).toLocaleDateString();
        noteMeta.appendChild(noteDate);

        // Show tags if they exist
        if (note.tags && note.tags.length > 0) {
          const tagsContainer = document.createElement("div");
          tagsContainer.className = "note-tags";
          note.tags.slice(0, 3).forEach((tag) => {
            const tagSpan = document.createElement("span");
            tagSpan.className = "note-tag";
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
          });
          noteMeta.appendChild(tagsContainer);
        }

        listItem.appendChild(noteMeta);

        const folderSelect = document.createElement("select");
        folderSelect.className = "folder-select";
        folderSelect.onclick = (e) => e.stopPropagation(); // Prevent note selection

        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Move to...";
        defaultOption.value = "";
        folderSelect.appendChild(defaultOption);

        Object.values(folders).forEach(folder => {
            const option = document.createElement("option");
            option.value = folder.id;
            option.textContent = folder.name;
            if (note.folderId === folder.id) {
                option.selected = true;
            }
            folderSelect.appendChild(option);
        });

        folderSelect.onchange = (e) => {
            const newFolderId = (e.target as HTMLSelectElement).value;
            if (newFolderId) {
                updateNote(note.id, { folderId: newFolderId });
            }
        };

        listItem.appendChild(folderSelect);
        listElement.appendChild(listItem);
      });
    } else {
      const noNotesMessage = document.createElement("p");
      noNotesMessage.textContent = searchQuery
        ? "No notes found matching your search."
        : "No notes found.";
      noNotesMessage.className = "no-notes-message";
      listElement.appendChild(noNotesMessage);
    }
  }

  container.appendChild(list);

  return container;
}
