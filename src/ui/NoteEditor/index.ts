// src/ui-rewrite/NoteEditor.ts
import { useStore } from "../../store";
import "./NoteEditor.css";
import { createButton } from "../Button";
import { createMetadataSidebar } from "../MetadataSidebar";
import { Note } from "../../../shared/types";
import { createToolbar } from "./toolbar";
import { createTiptapEditor } from "./editor";

export function createNoteEditor(noteId?: string): HTMLElement {
  const { currentNoteId, notes, updateNote } = useStore.getState();
  const id = noteId || currentNoteId;
  if (!id) {
    const container = document.createElement("div");
    container.textContent = "No note selected.";
    return container;
  }
  const note: Note | null = notes[id];

  const editorLayout = document.createElement("div");
  editorLayout.className = "note-editor-layout";

  const mainEditorContainer = document.createElement("div");
  mainEditorContainer.className = "note-editor-main";

  if (!note) {
    mainEditorContainer.textContent = "No note selected.";
    editorLayout.appendChild(mainEditorContainer);
    return editorLayout;
  }

  let metadataSidebar = createMetadataSidebar();
  metadataSidebar.classList.add("hidden");

  const toggleSidebarButton = createButton({
    label: "Metadata",
    onClick: () => {
      metadataSidebar.classList.toggle("hidden");
    },
    variant: "secondary",
  });

  // Title Input
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "note-title-input";
  titleInput.value = note.title;
  titleInput.oninput = (e) => {
    updateNote(note.id, { title: (e.target as HTMLInputElement).value });
  };
  mainEditorContainer.appendChild(titleInput);

  // Tiptap Editor
  const editorElement = document.createElement("div");
  editorElement.className = "tiptap-editor";
  mainEditorContainer.appendChild(editorElement);

  const editor = createTiptapEditor(editorElement, note);

  useStore.subscribe(
    (state) => state.notes[state.currentNoteId as string],
    (newNote, oldNote) => {
      if (
        newNote?.content !== oldNote?.content &&
        newNote?.content !== editor.getHTML()
      ) {
        editor.commands.setContent(newNote.content, false);
      }
      if (
        newNote?.values !== oldNote?.values ||
        newNote?.fields !== oldNote?.fields
      ) {
        const newSidebar = createMetadataSidebar();
        newSidebar.classList.toggle(
          "hidden",
          metadataSidebar.classList.contains("hidden"),
        );
        editorLayout.replaceChild(newSidebar, metadataSidebar);
        metadataSidebar = newSidebar;
      }
    },
  );

  const toolbar = createToolbar(editor, note);
  toolbar.appendChild(toggleSidebarButton);

  mainEditorContainer.insertBefore(toolbar, editorElement);

  editorLayout.appendChild(mainEditorContainer);
  editorLayout.appendChild(metadataSidebar);

  return editorLayout;
}
