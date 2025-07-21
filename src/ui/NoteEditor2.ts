// src/ui/NoteEditor2.ts
import { useAppStore } from "../store";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./NoteEditor.css";
import { createButton } from "./Button";
import { createMetadataSidebar } from "./MetadataSidebar";
import { Note } from "../../shared/types";

export function createNoteEditor2(noteId?: string): HTMLElement {
  const { currentNoteId, notes, updateNote } = useAppStore.getState();
  const id = noteId || currentNoteId;

  const editorLayout = document.createElement("div");
  editorLayout.className = "note-editor-layout";

  if (!id) {
    editorLayout.textContent = "No note selected.";
    return editorLayout;
  }

  const note: Note | null = notes[id];

  if (!note) {
    editorLayout.textContent = "Note not found.";
    return editorLayout;
  }

  const mainEditorContainer = document.createElement("div");
  mainEditorContainer.className = "note-editor-main";

  const metadataSidebar = createMetadataSidebar();
  metadataSidebar.classList.add("hidden");

  // Title Input
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "note-title-input";
  titleInput.value = note.title;
  titleInput.oninput = (e) => {
    updateNote(note.id, { title: (e.target as HTMLInputElement).value });
  };
  mainEditorContainer.appendChild(titleInput);

  // Quill Editor Container
  const editorContainer = document.createElement("div");
  editorContainer.className = "quill-editor";
  mainEditorContainer.appendChild(editorContainer);

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";
  // Add standard Quill toolbar options
  toolbar.innerHTML = `
    <span class="ql-formats">
      <select class="ql-header" defaultValue="0">
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="0">Normal</option>
      </select>
      <button class="ql-bold"></button>
      <button class="ql-italic"></button>
      <button class="ql-underline"></button>
      <button class="ql-strike"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-list" value="ordered"></button>
      <button class="ql-list" value="bullet"></button>
      <button class="ql-blockquote"></button>
      <button class="ql-code-block"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-link"></button>
      <button class="ql-image"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-clean"></button>
    </span>
  `;
  mainEditorContainer.insertBefore(toolbar, editorContainer);

  const quill = new Quill(editorContainer, {
    modules: {
      toolbar: toolbar,
    },
    theme: "snow",
    placeholder: "Write something amazing...",
  });

  // Set initial content
  quill.root.innerHTML = note.content;

  // Debounced update function
  let debounceTimer: ReturnType<typeof setTimeout>;
  quill.on("text-change", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const content = quill.root.innerHTML;
      if (note.content !== content) {
        updateNote(note.id, { content });
      }
    }, 500);
  });

  // Handle external updates
  const unsubscribe = useAppStore.subscribe(
    (state) => state.notes[id],
    (newNote) => {
      if (newNote && newNote.content !== quill.root.innerHTML) {
        const selection = quill.getSelection();
        quill.root.innerHTML = newNote.content;
        if (selection) {
          quill.setSelection(selection);
        }
      }
      if (newNote && newNote.title !== titleInput.value) {
        titleInput.value = newNote.title;
      }
    },
  );

  // Metadata and other controls
  const controlsContainer = document.createElement("div");
  controlsContainer.className = "editor-controls";

  const toggleSidebarButton = createButton({
    label: "Metadata",
    onClick: () => {
      metadataSidebar.classList.toggle("hidden");
    },
    variant: "secondary",
  });
  controlsContainer.appendChild(toggleSidebarButton);

  mainEditorContainer.appendChild(controlsContainer);
  editorLayout.appendChild(mainEditorContainer);
  editorLayout.appendChild(metadataSidebar);

  // Cleanup on element removal
  const observer = new MutationObserver((mutations, obs) => {
    if (!document.contains(editorLayout)) {
      unsubscribe();
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return editorLayout;
}
