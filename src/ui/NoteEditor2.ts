// src/ui-rewrite/NoteEditor2.ts
import { useAppStore } from "../store";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./NoteEditor.css";
import { createButton } from "./Button";
import { createTagModal } from "./TagModal";
import { createMetadataSidebar } from "./MetadataSidebar";
import { templates } from "../lib/templates";
import { Note } from "../../shared/types";

// Custom SemanticTag blot (inline format)
const SemanticTag = Quill.import("blots/inline");
class SemanticTagBlot extends SemanticTag {
  static blotName = "semanticTag";
  static tagName = "span";
  static className = "semantic-tag";

  static create(value: { tag: string }) {
    const node = super.create();
    node.setAttribute("data-tag", value.tag);
    return node;
  }

  static value(node: HTMLElement) {
    return { tag: node.getAttribute("data-tag") || "" };
  }
}
Quill.register(SemanticTagBlot);

// Custom Property blot (block format)
const Block = Quill.import("blots/block");
class PropertyBlot extends Block {
  static blotName = "property";
  static tagName = "div";
  static className = "property";

  static create(value: { key: string }) {
    const node = super.create();
    node.setAttribute("data-key", value.key);
    return node;
  }

  static value(node: HTMLElement) {
    return { key: node.getAttribute("data-key") || "" };
  }
}
Quill.register(PropertyBlot);

export function createNoteEditor2(noteId?: string): HTMLElement {
  const { currentNoteId, notes, updateNote, userProfile } = useAppStore.getState();
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

  const toggleSidebarButton = createButton({
    label: "Metadata",
    onClick: () => metadataSidebar.classList.toggle("hidden"),
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

  // Quill Editor Container
  const editorContainer = document.createElement("div");
  editorContainer.className = "quill-editor";
  mainEditorContainer.appendChild(editorContainer);

  // Initialize Quill editor
  const quill = new Quill(editorContainer, {
    modules: {
      toolbar: null, // We'll create custom toolbar
    },
    theme: "snow",
  });

  // Set initial content
  let initialContent = "";
  if (note.values) {
    Object.entries(note.values).forEach(([key, value]) => {
      initialContent += `<div class="property" data-key="${key}">${value}</div>`;
    });
  }
  initialContent += `<div>${note.content}</div>`;
  quill.root.innerHTML = initialContent;

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";

  // Template Buttons
  const templateButtons = document.createElement("div");
  templateButtons.className = "template-buttons";

  templates.forEach((template) => {
    const button = createButton({
      label: template.name,
      onClick: () => {
        let templateContent = `<h1>${template.name}</h1>`;
        templateContent += `<p><em>${template.description}</em></p>`;

        if (template.id === "meeting-note") {
          templateContent += "<h2>Meeting Agenda</h2><ul><li></li></ul><h2>Attendees</h2><ul><li></li></ul><h2>Notes</h2><p></p>";
        } else if (template.id === "project-plan") {
          templateContent += "<h2>Project Overview</h2><p></p><h2>Goals</h2><ul><li></li></ul><h2>Timeline</h2><p></p>";
        } else if (template.id === "daily-note") {
          templateContent += "<h2>Today's Highlights</h2><p></p><h2>Tasks</h2><ul><li></li></ul><h2>Reflections</h2><p></p>";
        }

        const range = quill.getSelection();
        quill.clipboard.dangerouslyPasteHTML(range?.index || 0, templateContent);

        // Create fields object from template fields
        const fields: { [key: string]: string } = {};
        template.fields.forEach((field) => {
          fields[field.name] = field.defaultValue || "";
        });

        // Apply template data
        updateNote(note.id, {
          fields,
          tags: [...note.tags, ...template.defaultTags],
          values: { ...note.values, ...template.defaultValues },
        });
      },
      variant: "secondary",
    });
    templateButtons.appendChild(button);
  });
  toolbar.appendChild(templateButtons);

  // Format buttons
  const addFormatButton = (format: string, label: string) => {
    const button = createButton({
      label,
      onClick: () => {
        const range = quill.getSelection();
        if (range) {
          const formatState = quill.getFormat(range);
          quill.format(format, !formatState[format]);
        }
      },
      variant: quill.getFormat()?.[format] ? "primary" : "secondary",
    });
    toolbar.appendChild(button);
  };

  addFormatButton("bold", "Bold");
  addFormatButton("italic", "Italic");
  addFormatButton("strike", "Strike");

  const tagButton = createButton({
    label: "Tag",
    onClick: () => {
      const modal = createTagModal({
        onSelect: (tag) => {
          const range = quill.getSelection();
          if (range) {
            quill.format("semanticTag", { tag });
          }
          document.body.removeChild(modal);
        },
        onClose: () => document.body.removeChild(modal),
      });
      document.body.appendChild(modal);
    },
    variant: "secondary",
  });
  toolbar.appendChild(tagButton);

  // AI Buttons (simplified for brevity)
  const aiButton = (label: string, onClick: () => void) => {
    const button = createButton({
      label,
      onClick,
      variant: "secondary",
      disabled: !aiEnabled,
    });
    toolbar.appendChild(button);
  };

  aiButton("Auto-tag", async () => {
    // Implementation would be similar to original
    // but using quill.getText() instead of editor.getText()
  });

  aiButton("Summarize", async () => {
    // Implementation would be similar to original
  });

  aiButton("AI Generate", async () => {
    const prompt = window.prompt("What would you like me to write about?");
    if (prompt) {
      const content = await aiService.generateNoteContent(prompt);
      if (content) {
        const range = quill.getSelection();
        quill.insertText(range?.index || 0, content);
      }
    }
  });

  toolbar.appendChild(toggleSidebarButton);
  mainEditorContainer.insertBefore(toolbar, editorContainer);

  // Status selector
  const statusSelector = document.createElement("select");
  statusSelector.className = "status-selector";
  const statuses = ["draft", "private", "published"];
  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    if (note.status === status) option.selected = true;
    statusSelector.appendChild(option);
  });
  statusSelector.onchange = (e) => {
    updateNote(note.id, {
      status: (e.target as HTMLSelectElement).value as "draft" | "private" | "published",
    });
  };
  toolbar.appendChild(statusSelector);

  // Share button
  const shareButton = createButton({
    label: "Share",
    onClick: () => {
      const { publishCurrentNoteToNostr } = useAppStore.getState();
      if (note.status === "private") {
        const recipientPk = prompt("Enter recipient's Nostr public key (npub):");
        if (recipientPk) publishCurrentNoteToNostr({ encrypt: true, recipientPk });
      } else {
        publishCurrentNoteToNostr({ encrypt: false });
      }
    },
    variant: "primary",
    disabled: note.status === "draft",
  });
  toolbar.appendChild(shareButton);

  // Update handler
  quill.on("text-change", () => {
    const newValues: { [key: string]: any } = {};
    const contentParts: string[] = [];
    
    // Extract properties and content (matching original logic)
    const contentNodes: any[] = [];
    quill.root.childNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        if (node.classList.contains("property")) {
          const key = node.getAttribute("data-key");
          if (key) newValues[key] = node.textContent || "";
        } else {
          contentNodes.push(node.cloneNode(true));
        }
      }
    });
    
    // Create content HTML
    const contentHtml = contentNodes.map(node => node.outerHTML).join('');

    updateNote(note.id, {
      content: contentHtml,
      values: newValues,
    });
  });

  // Subscription for external changes (using simpler approach)
  const unsubscribe = useAppStore.subscribe(() => {
    const state = useAppStore.getState();
    const newNote = state.notes[id];
    if (!newNote || newNote.id !== note.id) return;
    
    // Update editor content if changed externally
    if (newNote.content && newNote.content !== quill.root.innerHTML) {
      quill.root.innerHTML = newNote.content;
    }
    
    // Update metadata sidebar if values or fields change
    if (newNote.values !== note.values || newNote.fields !== note.fields) {
      const newSidebar = createMetadataSidebar();
      newSidebar.classList.toggle("hidden", metadataSidebar.classList.contains("hidden"));
      editorLayout.replaceChild(newSidebar, metadataSidebar);
      metadataSidebar = newSidebar;
    }
  });

  editorLayout.appendChild(mainEditorContainer);
  editorLayout.appendChild(metadataSidebar);

  return editorLayout;
}