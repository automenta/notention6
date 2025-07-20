// Minimal Note Editor - Simple textarea-based editor for distraction-free writing
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { createMetadataSidebar } from "./MetadataSidebar";
import { Note } from "../../shared/types";
import "./NoteEditorMinimal.css";

export function createNoteEditorMinimal(noteId?: string): HTMLElement {
  const { currentNoteId, notes, updateNote, userProfile } =
    useAppStore.getState();
  const id = noteId || currentNoteId;

  if (!id) {
    const container = document.createElement("div");
    container.className = "minimal-editor-empty";
    container.textContent = "No note selected";
    return container;
  }

  const note: Note | null = notes[id];
  const aiEnabled = userProfile?.preferences?.aiEnabled || false;
  const aiService = useAppStore.getState().getAIService();

  if (!note) {
    const container = document.createElement("div");
    container.className = "minimal-editor-empty";
    container.textContent = "Note not found";
    return container;
  }

  const container = document.createElement("div");
  container.className = "minimal-editor-container";

  // Header with basic controls
  const header = document.createElement("div");
  header.className = "minimal-editor-header";

  // Title input with clean styling
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "minimal-title-input";
  titleInput.value = note.title;
  titleInput.placeholder = "Note title...";
  titleInput.oninput = (e) => {
    updateNote(note.id, { title: (e.target as HTMLInputElement).value });
  };

  // Word count and status
  const statusInfo = document.createElement("div");
  statusInfo.className = "minimal-status-info";

  const wordCountSpan = document.createElement("span");
  wordCountSpan.className = "word-count";

  const statusSpan = document.createElement("span");
  statusSpan.className = `status-indicator status-${note.status}`;
  statusSpan.textContent = note.status;

  statusInfo.appendChild(wordCountSpan);
  statusInfo.appendChild(statusSpan);

  header.appendChild(titleInput);
  header.appendChild(statusInfo);

  // Main content area
  const contentArea = document.createElement("div");
  contentArea.className = "minimal-content-area";

  // Content textarea
  const contentTextarea = document.createElement("textarea");
  contentTextarea.className = "minimal-content-textarea";
  contentTextarea.placeholder = "Start writing...";

  // Convert HTML content to plain text for minimal editor
  const htmlToText = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  contentTextarea.value = htmlToText(note.content);

  // Auto-resize textarea
  const autoResize = () => {
    contentTextarea.style.height = "auto";
    contentTextarea.style.height = contentTextarea.scrollHeight + "px";
  };

  let debounceTimer: ReturnType<typeof setTimeout>;
  contentTextarea.oninput = (e) => {
    const text = (e.target as HTMLTextAreaElement).value;

    // Simple text to HTML conversion
    const htmlContent =
      "<p>" + text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateNote(note.id, { content: htmlContent });
    }, 500);

    // Update word count
    const wordCount = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    wordCountSpan.textContent = `${wordCount} words`;

    autoResize();
  };

  const unsubscribe = useAppStore.subscribe(
    (state) => state.notes[id],
    (newNote) => {
      if (newNote) {
        const newText = htmlToText(newNote.content);
        if (newText !== contentTextarea.value) {
          contentTextarea.value = newText;
        }
        if (newNote.title !== titleInput.value) {
          titleInput.value = newNote.title;
        }
      }
    },
  );

  // Initial word count and resize
  const initialText = contentTextarea.value;
  const initialWordCount = initialText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  wordCountSpan.textContent = `${initialWordCount} words`;

  setTimeout(autoResize, 0); // Run after DOM insertion

  contentArea.appendChild(contentTextarea);

  // Footer with minimal controls
  const footer = document.createElement("div");
  footer.className = "minimal-editor-footer";

  // Status selector
  const statusSelector = document.createElement("select");
  statusSelector.className = "minimal-status-selector";
  const statuses = ["draft", "private", "published"];
  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    if (note.status === status) option.selected = true;
    statusSelector.appendChild(option);
  });
  statusSelector.onchange = (e) => {
    const newStatus = (e.target as HTMLSelectElement).value as
      | "draft"
      | "private"
      | "published";
    updateNote(note.id, { status: newStatus });
    statusSpan.textContent = newStatus;
    statusSpan.className = `status-indicator status-${newStatus}`;
  };

  // Quick actions
  const actionsGroup = document.createElement("div");
  actionsGroup.className = "minimal-actions-group";

  // Toggle metadata sidebar
  let metadataSidebar: HTMLElement | null = null;
  const toggleMetadataButton = createButton({
    label: "📊",
    onClick: () => {
      if (metadataSidebar) {
        container.removeChild(metadataSidebar);
        metadataSidebar = null;
        toggleMetadataButton.textContent = "📊";
      } else {
        metadataSidebar = createMetadataSidebar();
        metadataSidebar.className = "minimal-metadata-sidebar";
        container.appendChild(metadataSidebar);
        toggleMetadataButton.textContent = "❌";
      }
    },
    variant: "secondary",
  });

  // AI-powered features (if enabled)
  if (aiEnabled) {
    const aiButton = createButton({
      label: "✨ AI",
      onClick: async () => {
        const menu = createAIMenu(note, contentTextarea, aiService);
        container.appendChild(menu);
      },
      variant: "secondary",
    });
    actionsGroup.appendChild(aiButton);
  }

  // Share button
  const shareButton = createButton({
    label: "📤",
    onClick: () => {
      const { publishCurrentNoteToNostr } = useAppStore.getState();
      if (note.status === "private") {
        const recipientPk = prompt("Enter recipient's Nostr public key:");
        if (recipientPk)
          publishCurrentNoteToNostr({ encrypt: true, recipientPk });
      } else if (note.status === "published") {
        publishCurrentNoteToNostr({ encrypt: false });
      }
    },
    variant: note.status === "draft" ? "secondary" : "primary",
  });

  actionsGroup.appendChild(toggleMetadataButton);
  actionsGroup.appendChild(shareButton);

  footer.appendChild(statusSelector);
  footer.appendChild(actionsGroup);

  // Assembly
  container.appendChild(header);
  container.appendChild(contentArea);
  container.appendChild(footer);

  // Focus content area by default
  setTimeout(() => {
    contentTextarea.focus();
    // Position cursor at end
    contentTextarea.setSelectionRange(
      contentTextarea.value.length,
      contentTextarea.value.length,
    );
  }, 100);

  return container;
}

function createAIMenu(
  note: Note,
  textarea: HTMLTextAreaElement,
  aiService: any,
): HTMLElement {
  const menu = document.createElement("div");
  menu.className = "minimal-ai-menu";

  const menuContent = document.createElement("div");
  menuContent.className = "minimal-ai-menu-content";

  // Close button
  const closeButton = createButton({
    label: "❌",
    onClick: () => {
      if (menu.parentNode) {
        menu.parentNode.removeChild(menu);
      }
    },
    variant: "secondary",
  });
  closeButton.className = "minimal-ai-close";

  // AI options
  const optionsTitle = document.createElement("h3");
  optionsTitle.textContent = "AI Assistant";
  optionsTitle.className = "minimal-ai-title";

  const expandButton = createButton({
    label: "📝 Expand Content",
    onClick: async () => {
      const selectedText =
        textarea.value.substring(
          textarea.selectionStart,
          textarea.selectionEnd,
        ) || textarea.value;
      if (selectedText.trim()) {
        const expanded = await aiService.generateText(
          `Expand on this content: ${selectedText}`,
        );
        if (expanded) {
          insertTextAtCursor(textarea, `\n\n${expanded}`);
        }
      }
      menu.parentNode?.removeChild(menu);
    },
    variant: "secondary",
  });

  const summarizeButton = createButton({
    label: "📋 Summarize",
    onClick: async () => {
      const text = textarea.value;
      if (text.trim()) {
        const summary = await aiService.generateText(
          `Summarize this content: ${text}`,
        );
        if (summary) {
          insertTextAtCursor(textarea, `\n\n## Summary\n${summary}`);
        }
      }
      menu.parentNode?.removeChild(menu);
    },
    variant: "secondary",
  });

  const improveButton = createButton({
    label: "✨ Improve Writing",
    onClick: async () => {
      const selectedText =
        textarea.value.substring(
          textarea.selectionStart,
          textarea.selectionEnd,
        ) || textarea.value;
      if (selectedText.trim()) {
        const improved = await aiService.generateText(
          `Improve the writing and clarity of: ${selectedText}`,
        );
        if (improved) {
          if (textarea.selectionStart !== textarea.selectionEnd) {
            // Replace selected text
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value =
              textarea.value.substring(0, start) +
              improved +
              textarea.value.substring(end);
          } else {
            insertTextAtCursor(textarea, `\n\n${improved}`);
          }
        }
      }
      menu.parentNode?.removeChild(menu);
    },
    variant: "secondary",
  });

  menuContent.appendChild(closeButton);
  menuContent.appendChild(optionsTitle);
  menuContent.appendChild(expandButton);
  menuContent.appendChild(summarizeButton);
  menuContent.appendChild(improveButton);

  menu.appendChild(menuContent);

  // Click outside to close
  menu.onclick = (e) => {
    if (e.target === menu) {
      menu.parentNode?.removeChild(menu);
    }
  };

  return menu;
}

function insertTextAtCursor(textarea: HTMLTextAreaElement, text: string): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.value =
    textarea.value.substring(0, start) + text + textarea.value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.dispatchEvent(new Event("input"));
}
