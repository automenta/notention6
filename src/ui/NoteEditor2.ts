// src/ui-rewrite/NoteEditor.ts
import { useAppStore } from "../store";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./NoteEditor.css";
import { createButton } from "./Button";
import { createTagModal } from "./TagModal";
import { createMetadataSidebar } from "./MetadataSidebar";
import { templates } from "../lib/templates";
import { AIService } from "../services/AIService";
import { Note } from "../../shared/types";

export function createNoteEditor2(noteId?: string): HTMLElement {
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
            // get the node before the suggestion
            const nodeBefore = editor.view.state.selection.$from.nodeBefore;
            // get the current word
            const text = nodeBefore?.text || "";
            const trigger = text.slice(0, 1);
            const query = text.slice(1);

            // insert a semantic tag
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
    content: {
      type: "doc",
      content: [
        ...Object.entries(note.values || {}).map(([key, value]) => ({
          type: "property",
          attrs: { key },
          content: [{ type: "text", text: String(value) }],
        })),
        {
          type: "paragraph",
          content: [{ type: "text", text: note.content }],
        },
      ],
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const newValues: { [key: string]: any } = {};
      const contentParts: any[] = [];

      if (json.content) {
        json.content.forEach((node: any) => {
          if (node.type === "property") {
            newValues[node.attrs.key] = node.content?.[0]?.text || "";
          } else {
            contentParts.push(node);
          }
        });
      }

      const newContent = {
        type: "doc",
        content: contentParts,
      };

      // This is a temporary solution to get the HTML content.
      // A better solution would be to use a proper HTML serializer.
      const tempEditor = new Editor({
        extensions: [StarterKit],
        content: newContent,
      });
      const contentHtml = tempEditor.getHTML();
      tempEditor.destroy();

      updateNote(note.id, {
        content: contentHtml,
        values: newValues,
      });
    },
  });

  useAppStore.subscribe(
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

        // Add default content based on template type
        if (template.id === "meeting-note") {
          templateContent +=
            "<h2>Meeting Agenda</h2><ul><li></li></ul><h2>Attendees</h2><ul><li></li></ul><h2>Notes</h2><p></p>";
        } else if (template.id === "project-plan") {
          templateContent +=
            "<h2>Project Overview</h2><p></p><h2>Goals</h2><ul><li></li></ul><h2>Timeline</h2><p></p>";
        } else if (template.id === "daily-note") {
          templateContent +=
            "<h2>Today's Highlights</h2><p></p><h2>Tasks</h2><ul><li></li></ul><h2>Reflections</h2><p></p>";
        }

        editor.commands.insertContent(templateContent);

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

  const boldButton = createButton({
    label: "Bold",
    onClick: () => editor.chain().focus().toggleBold().run(),
    variant: editor.isActive("bold") ? "primary" : "secondary",
  });
  toolbar.appendChild(boldButton);

  const italicButton = createButton({
    label: "Italic",
    onClick: () => editor.chain().focus().toggleItalic().run(),
    variant: editor.isActive("italic") ? "primary" : "secondary",
  });
  toolbar.appendChild(italicButton);

  const strikeButton = createButton({
    label: "Strike",
    onClick: () => editor.chain().focus().toggleStrike().run(),
    variant: editor.isActive("strike") ? "primary" : "secondary",
  });
  toolbar.appendChild(strikeButton);

  const tagButton = createButton({
    label: "Tag",
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
  const autoTagButton = createButton({
    label: "Auto-tag",
    onClick: async () => {
      try {
        const { ontology, addNotification } = useAppStore.getState();
        addNotification({
          id: `auto-tag-${Date.now()}`,
          type: "info",
          message: "Auto-tagging in progress...",
          timestamp: new Date(),
        });

        const tags = await aiService.autoTag(
          editor.getText(),
          note.title,
          ontology,
        );
        if (tags.length > 0) {
          // Insert tags at cursor position
          tags.forEach((tag) => {
            editor.chain().focus().insertContent(`${tag} `).run();
          });
          // Also add to note metadata
          const existingTags = note.tags || [];
          const newTags = [...new Set([...existingTags, ...tags])];
          await updateNote(note.id, { tags: newTags });

          addNotification({
            id: `auto-tag-success-${Date.now()}`,
            type: "success",
            message: `Added ${tags.length} tag(s)`,
            timestamp: new Date(),
            timeout: 3000,
          });
        } else {
          addNotification({
            id: `auto-tag-none-${Date.now()}`,
            type: "info",
            message: "No relevant tags found",
            timestamp: new Date(),
            timeout: 3000,
          });
        }
      } catch (error) {
        console.error("Auto-tagging failed:", error);
        const { addNotification } = useAppStore.getState();
        addNotification({
          id: `auto-tag-error-${Date.now()}`,
          type: "error",
          message: "Auto-tagging failed",
          timestamp: new Date(),
          timeout: 5000,
        });
      }
    },
    variant: "secondary",
    disabled: !aiEnabled,
  });
  toolbar.appendChild(autoTagButton);

  const summarizeButton = createButton({
    label: "Summarize",
    onClick: async () => {
      try {
        const { addNotification } = useAppStore.getState();
        addNotification({
          id: `summarize-${Date.now()}`,
          type: "info",
          message: "Generating summary...",
          timestamp: new Date(),
        });

        const summary = await aiService.summarize(editor.getText(), note.title);
        if (summary) {
          // Insert summary at the beginning of the note
          const currentContent = editor.getHTML();
          editor.commands.setContent(
            `<div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 10px;"><strong>AI Summary:</strong><br/>${summary}</div>${currentContent}`,
          );

          addNotification({
            id: `summarize-success-${Date.now()}`,
            type: "success",
            message: "Summary added to note",
            timestamp: new Date(),
            timeout: 3000,
          });
        }
      } catch (error) {
        console.error("Summarization failed:", error);
        const { addNotification } = useAppStore.getState();
        addNotification({
          id: `summarize-error-${Date.now()}`,
          type: "error",
          message: "Summary generation failed",
          timestamp: new Date(),
          timeout: 5000,
        });
      }
    },
    variant: "secondary",
    disabled: !aiEnabled,
  });
  toolbar.appendChild(summarizeButton);

  const generateContentButton = createButton({
    label: "AI Generate",
    onClick: async () => {
      try {
        const prompt = window.prompt("What would you like me to write about?");
        if (prompt) {
          const content = await aiService.generateNoteContent(prompt);
          if (content) {
            editor.chain().focus().insertContent(`<p>${content}</p>`).run();
          }
        }
      } catch (error) {
        console.error("Content generation failed:", error);
      }
    },
    variant: "secondary",
    disabled: !aiEnabled,
  });
  toolbar.appendChild(generateContentButton);
  toolbar.appendChild(toggleSidebarButton);

  mainEditorContainer.insertBefore(toolbar, editorElement);

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

  mainEditorContainer.insertBefore(toolbar, editorElement);

  editorLayout.appendChild(mainEditorContainer);
  editorLayout.appendChild(metadataSidebar);

  return editorLayout;
}
