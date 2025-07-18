// src/ui-rewrite/NoteEditor.ts
import { useAppStore } from "../store";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { SemanticTag } from "../extensions/SemanticTag";
import "./NoteEditor.css";
import { createButton } from "./Button";
import { createTagModal } from "./TagModal";
import { createMetadataSidebar } from "./MetadataSidebar";
import { templates } from "../lib/templates";
import { AIService } from "../services/AIService";
import { Note } from "../../shared/types";

export function createNoteEditor(): HTMLElement {
  const { currentNoteId, notes, updateNote, userProfile } =
    useAppStore.getState();
  const note: Note | null = currentNoteId ? notes[currentNoteId] : null;
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
    extensions: [StarterKit, SemanticTag],
    content: note.content,
    onUpdate: ({ editor }) => {
      updateNote(note.id, { content: editor.getHTML() });
    },
  });

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";

  // Template Selector
  const templateSelector = document.createElement("select");
  templateSelector.className = "template-selector";
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select a template";
  defaultOption.value = "";
  templateSelector.appendChild(defaultOption);

  templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    templateSelector.appendChild(option);
  });

  templateSelector.onchange = (e) => {
    const selectedTemplateId = (e.target as HTMLSelectElement).value;
    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (selectedTemplate) {
      // Apply template content based on template structure
      let templateContent = `<h1>${selectedTemplate.name}</h1>`;
      templateContent += `<p><em>${selectedTemplate.description}</em></p>`;

      // Add default content based on template type
      if (selectedTemplate.id === "meeting-note") {
        templateContent +=
          "<h2>Meeting Agenda</h2><ul><li></li></ul><h2>Attendees</h2><ul><li></li></ul><h2>Notes</h2><p></p>";
      } else if (selectedTemplate.id === "project-plan") {
        templateContent +=
          "<h2>Project Overview</h2><p></p><h2>Goals</h2><ul><li></li></ul><h2>Timeline</h2><p></p>";
      } else if (selectedTemplate.id === "daily-note") {
        templateContent +=
          "<h2>Today's Highlights</h2><p></p><h2>Tasks</h2><ul><li></li></ul><h2>Reflections</h2><p></p>";
      }

      editor.commands.setContent(templateContent);

      // Create fields object from template fields
      const fields: { [key: string]: string } = {};
      selectedTemplate.fields.forEach((field) => {
        fields[field.name] = field.defaultValue || "";
      });

      // Apply template data
      updateNote(note.id, {
        fields,
        tags: [...note.tags, ...selectedTemplate.defaultTags],
        values: { ...note.values, ...selectedTemplate.defaultValues },
      });
    }
  };
  toolbar.appendChild(templateSelector);

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
          updateNote(note.id, { tags: newTags });

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

  mainEditorContainer.insertBefore(toolbar, editorElement);

  // Save Button
  const saveButton = createButton({
    label: "Save",
    onClick: () => {
      // The note is already updated on every change, so this button is just for show for now.
      // In a real app, you might want to debounce the updates and have an explicit save.
      console.log("Note saved!");
    },
    variant: "primary",
  });
  mainEditorContainer.appendChild(saveButton);

  // Metadata Sidebar
  const metadataSidebar = createMetadataSidebar();

  editorLayout.appendChild(mainEditorContainer);
  editorLayout.appendChild(metadataSidebar);

  return editorLayout;
}
