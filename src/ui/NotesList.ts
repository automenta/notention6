// src/ui-rewrite/NotesList.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { AnimationSystem, animateOnScroll } from "../lib/AnimationSystem";
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
  searchInput.placeholder = "🔍 Search notes...";
  searchInput.value = searchQuery;
  searchInput.oninput = (e) => {
    const query = (e.target as HTMLInputElement).value;
    setSearchQuery(query);

    // Add micro-interaction feedback
    if (query.length > 0) {
      searchInput.classList.add("searching");
    } else {
      searchInput.classList.remove("searching");
    }
  };

  // Add interactive feedback to search input
  AnimationSystem.addRippleEffect(searchInput);
  searchFilterContainer.appendChild(searchInput);

  const viewSwitcher = document.createElement("div");
  viewSwitcher.className = "view-switcher";

  const allButton = createButton({
    label: "📄 All",
    onClick: () => {
      setNoteView("all");
      AnimationSystem.clickFeedback(allButton);
    },
    variant: noteView === "all" ? "primary" : "secondary",
  });
  viewSwitcher.appendChild(allButton);

  const favoritesButton = createButton({
    label: "⭐ Favorites",
    onClick: () => {
      setNoteView("favorites");
      AnimationSystem.clickFeedback(favoritesButton);
    },
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
        createFolder(folderName);
      }
    },
    variant: "secondary",
  });
  searchFilterContainer.appendChild(newFolderButton);

  const tagFilter = document.createElement("select");
  tagFilter.className = "tag-filter";
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Filter by tag...";
  defaultOption.value = "";
  tagFilter.appendChild(defaultOption);

  const allTags = new Set<string>();
  Object.values(notes).forEach((note) => {
    note.tags.forEach((tag) => allTags.add(tag));
  });

  allTags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });

  tagFilter.onchange = (e) => {
    const { setSearchFilters } = useAppStore.getState();
    const selectedTag = (e.target as HTMLSelectElement).value;
    setSearchFilters({ tags: selectedTag ? [selectedTag] : [] });
  };
  searchFilterContainer.appendChild(tagFilter);

  container.appendChild(searchFilterContainer);

  // Notes List
  const list = document.createElement("ul");
  list.className = "notes-list";

  if (noteView === "favorites") {
    notesArray = notesArray.filter((note) => note.pinned);
  } else if (noteView === "archived") {
    notesArray = notesArray.filter((note) => note.archived);
  }

  // Use semantic search if there's a query or filters, otherwise use simple filtering
  let filteredNotes: Note[] = [];
  const { searchFilters } = useAppStore.getState();
  if (
    searchQuery.trim() ||
    (searchFilters.tags && searchFilters.tags.length > 0)
  ) {
    // Import NoteService for semantic search
    import("../services/NoteService").then(async ({ NoteService }) => {
      const { ontology } = useAppStore.getState();
      try {
        filteredNotes = await NoteService.semanticSearch(
          searchQuery,
          ontology,
          searchFilters,
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
    // Clear existing content with fade out
    const existingItems = Array.from(listElement.children) as HTMLElement[];
    if (existingItems.length > 0) {
      existingItems.forEach((item, index) => {
        setTimeout(() => {
          AnimationSystem.fadeOut(item).addEventListener("finish", () => {
            if (index === existingItems.length - 1) {
              listElement.innerHTML = "";
              renderNewContent();
            }
          });
        }, index * 50);
      });
    } else {
      renderNewContent();
    }

    function renderNewContent() {
      if (notes.length > 0) {
        const noteElements: HTMLElement[] = [];

        notes.forEach((note) => {
          const listItem = document.createElement("li");
          listItem.className = "note-item";
          listItem.style.opacity = "0";
          listItem.onclick = () => {
            AnimationSystem.clickFeedback(listItem);
            setCurrentNote(note.id);
          };

          // Add hover effects
          AnimationSystem.hoverLift(listItem);
          AnimationSystem.addRippleEffect(listItem);

          const noteTitle = document.createElement("h3");
          noteTitle.textContent = note.title || "📝 Untitled Note";
          listItem.appendChild(noteTitle);

          const noteExcerpt = document.createElement("p");
          const plainContent = note.content.replace(/<[^>]*>/g, ""); // Strip HTML
          noteExcerpt.textContent =
            plainContent.substring(0, 100) +
            (plainContent.length > 100 ? "..." : "");
          listItem.appendChild(noteExcerpt);

          const noteMeta = document.createElement("div");
          noteMeta.className = "note-meta";

          const noteDate = document.createElement("span");
          noteDate.className = "note-date";
          const date = new Date(note.updatedAt);
          const isToday = date.toDateString() === new Date().toDateString();
          noteDate.textContent = isToday
            ? `🕰️ Today`
            : `📅 ${date.toLocaleDateString()}`;
          noteMeta.appendChild(noteDate);

          // Show tags if they exist
          if (note.tags && note.tags.length > 0) {
            const tagsContainer = document.createElement("div");
            tagsContainer.className = "note-tags";
            note.tags.slice(0, 3).forEach((tag) => {
              const tagSpan = document.createElement("span");
              tagSpan.className = "note-tag";
              tagSpan.textContent = tag;
              // Add color coding for different tag types
              if (tag.includes("ai") || tag.includes("AI")) {
                tagSpan.classList.add("tag-ai");
              } else if (tag.includes("project")) {
                tagSpan.classList.add("tag-project");
              } else if (tag.includes("personal")) {
                tagSpan.classList.add("tag-personal");
              }
              tagsContainer.appendChild(tagSpan);
            });
            if (note.tags.length > 3) {
              const moreTag = document.createElement("span");
              moreTag.className = "note-tag more-tags";
              moreTag.textContent = `+${note.tags.length - 3}`;
              tagsContainer.appendChild(moreTag);
            }
            noteMeta.appendChild(tagsContainer);
          }

          listItem.appendChild(noteMeta);

          const actionsContainer = document.createElement("div");
          actionsContainer.className = "note-actions";

          // Pin/Unpin button
          const pinButton = createButton({
            label: note.pinned ? "⭐" : "☆",
            onClick: (e) => {
              e.stopPropagation();
              updateNote(note.id, { pinned: !note.pinned });
              AnimationSystem.microBounce();
            },
            variant: "ghost",
            iconOnly: true,
            tooltip: note.pinned ? "Unpin note" : "Pin note",
          });
          actionsContainer.appendChild(pinButton);

          const folderSelect = document.createElement("select");
          folderSelect.className = "folder-select";
          folderSelect.onclick = (e) => e.stopPropagation(); // Prevent note selection

          const defaultOption = document.createElement("option");
          defaultOption.textContent = "📁 Move to...";
          defaultOption.value = "";
          folderSelect.appendChild(defaultOption);

          Object.values(folders).forEach((folder) => {
            const option = document.createElement("option");
            option.value = folder.id;
            option.textContent = `📁 ${folder.name}`;
            if (note.folderId === folder.id) {
              option.selected = true;
            }
            folderSelect.appendChild(option);
          });

          folderSelect.onchange = (e) => {
            const newFolderId = (e.target as HTMLSelectElement).value;
            if (newFolderId) {
              updateNote(note.id, { folderId: newFolderId });
              AnimationSystem.microScale();
            }
          };

          actionsContainer.appendChild(folderSelect);
          listItem.appendChild(actionsContainer);

          noteElements.push(listItem);
          listElement.appendChild(listItem);
        });

        // Apply staggered entrance animations
        AnimationSystem.staggeredEntrance(noteElements, 100);
      } else {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.innerHTML = `
                    <div class="empty-state-icon">📝</div>
                    <h3>${searchQuery ? "No notes found" : "No notes yet"}</h3>
                    <p>${searchQuery ? "Try adjusting your search terms" : "Create your first note to get started"}</p>
                `;
        listElement.appendChild(emptyState);
        AnimationSystem.fadeIn(emptyState);
      }
      //listElement.appendChild(noNotesMessage);
    }
  }

  container.appendChild(list);

  return container;
}
