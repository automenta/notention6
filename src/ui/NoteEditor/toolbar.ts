import { Editor } from "@tiptap/core";
import { useStore } from "../../store";
import { createButton } from "../Button";
import { createTagModal } from "../TagModal";
import { templates } from "../../lib/templates";
import { Note } from "../../../shared/types";

export function createToolbar(editor: Editor, note: Note): HTMLElement {
  const { updateNote, userProfile } = useStore.getState();
  const aiEnabled = userProfile?.preferences?.aiEnabled || false;
  const aiService = useStore.getState().getAIService();

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
        const { ontology, addNotification } = useStore.getState();
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
        const { addNotification } = useStore.getState();
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
        const { addNotification } = useStore.getState();
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
        const { addNotification } = useStore.getState();
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
      const { publishCurrentNoteToNostr } = useStore.getState();
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

  return toolbar;
}
