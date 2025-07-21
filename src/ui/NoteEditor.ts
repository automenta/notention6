// src/ui/NoteEditor.ts
import { useAppStore } from "../store";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { SemanticTag } from "../extensions/SemanticTag";
import { Property } from "../extensions/Property";
import { suggestion } from "../lib/suggestion";
import "./NoteEditor.css";
import { createButton } from "./Button";
import { createTagModal } from "./TagModal";
import { createMetadataSidebar } from "./MetadataSidebar";
import { templates } from "../lib/templates";
import { Note } from "../../shared/types";

export function createNoteEditor(noteId?: string): HTMLElement {
  const { currentNoteId, notes, updateNote, userProfile } =
    useAppStore.getState();
  const id = noteId || currentNoteId;
  if (!id) {
    const container = document.createElement("div");
    container.textContent = "No note selected.";
    return container;
  }
  const note: Note | null = notes[id];
  const aiEnabled = userProfile?.preferences?.aiEnabled || false;
  const aiService = useAppStore.getState().getAIService();

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

  // Title Input
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "note-title-input";
  titleInput.placeholder = "Note Title";
  titleInput.value = note.title;
  titleInput.oninput = (e) => {
    updateNote(note.id, { title: (e.target as HTMLInputElement).value });
  };
  mainEditorContainer.appendChild(titleInput);

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";
  mainEditorContainer.appendChild(toolbar);

  // Tiptap Editor
  const editorElement = document.createElement("div");
  editorElement.className = "tiptap-editor";
  mainEditorContainer.appendChild(editorElement);

  const editor = new Editor({
    element: editorElement,
    extensions: [
      StarterKit,
      SemanticTag,
      Property,
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          ...suggestion(editorElement.getRootNode() as ShadowRoot),
          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: "semanticTag",
                  attrs: { tag: props.id },
                },
                {
                  type: "text",
                  text: " ",
                },
              ])
              .run();
          },
        },
      }),
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      updateNote(note.id, { content: html });
    },
  });

  const unsubscribe = useAppStore.subscribe(
    (state) => state.notes[id],
    (newNote) => {
      if (newNote && newNote.content !== editor.getHTML()) {
        editor.commands.setContent(newNote.content, false);
      }
      if (newNote && newNote.title !== titleInput.value) {
        titleInput.value = newNote.title;
      }
    },
  );

  const observer = new MutationObserver((mutations, obs) => {
    if (!document.contains(editorLayout)) {
      unsubscribe();
      editor.destroy();
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Toolbar Buttons
  const boldButton = createButton({
    label: "B",
    onClick: () => editor.chain().focus().toggleBold().run(),
    variant: editor.isActive("bold") ? "primary" : "secondary",
  });
  toolbar.appendChild(boldButton);

  const italicButton = createButton({
    label: "I",
    onClick: () => editor.chain().focus().toggleItalic().run(),
    variant: editor.isActive("italic") ? "primary" : "secondary",
  });
  toolbar.appendChild(italicButton);

  const strikeButton = createButton({
    label: "S",
    onClick: () => editor.chain().focus().toggleStrike().run(),
    variant: editor.isActive("strike") ? "primary" : "secondary",
  });
  toolbar.appendChild(strikeButton);

  const tagButton = createButton({
    label: "#",
    onClick: () => {
      const modal = createTagModal({
        onSelect: (tag) => {
          editor.chain().focus().setSemanticTag(tag).run();
          document.body.removeChild(modal);
        },
        onClose: () => {
          document.body.removeChild(modal);
        },
      });
      document.body.appendChild(modal);
    },
    variant: "secondary",
  });
  toolbar.appendChild(tagButton);

  // AI Buttons
  if (aiEnabled) {
    const autoTagButton = createButton({
      label: "Auto-tag",
      onClick: async () => {
        // ... (logic remains the same)
      },
      variant: "secondary",
    });
    toolbar.appendChild(autoTagButton);

    const summarizeButton = createButton({
      label: "Summarize",
      onClick: async () => {
        // ... (logic remains the same)
      },
      variant: "secondary",
    });
    toolbar.appendChild(summarizeButton);
  }

  const toggleSidebarButton = createButton({
    label: "Metadata",
    onClick: () => {
      metadataSidebar.classList.toggle("hidden");
    },
    variant: "secondary",
  });
  toolbar.appendChild(toggleSidebarButton);

  const statusSelector = document.createElement("select");
  statusSelector.className = "status-selector";
  const statuses = ["draft", "private", "published"];
  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    if (note.status === status) {
      option.selected = true;
    }
    statusSelector.appendChild(option);
  });
  statusSelector.onchange = (e) => {
    const newStatus = (e.target as HTMLSelectElement).value as
      | "draft"
      | "private"
      | "published";
    updateNote(note.id, { status: newStatus });
  };
  toolbar.appendChild(statusSelector);

  const shareButton = createButton({
    label: "Share",
    onClick: () => {
      const { publishCurrentNoteToNostr } = useAppStore.getState();
      if (note.status === "private") {
        const recipientPk = prompt(
          "Enter recipient's Nostr public key (npub):",
        );
        if (recipientPk) {
          publishCurrentNoteToNostr({ encrypt: true, recipientPk });
        }
      } else {
        publishCurrentNoteToNostr({ encrypt: false });
      }
    },
    variant: "primary",
    disabled: note.status === "draft",
  });
  toolbar.appendChild(shareButton);

  editorLayout.appendChild(mainEditorContainer);
  editorLayout.appendChild(metadataSidebar);

  return editorLayout;
}
