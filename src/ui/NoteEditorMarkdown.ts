// Markdown Note Editor - Split view with live preview
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { createMetadataSidebar } from "./MetadataSidebar";
import { Note } from "../../shared/types";
import { marked } from "marked";
import { htmlToMarkdown } from "html-to-markdown";
import "./NoteEditorMarkdown.css";

export function createNoteEditorMarkdown(noteId?: string): HTMLElement {
  const { currentNoteId, notes, updateNote } = useAppStore.getState();
  const id = noteId || currentNoteId;

  if (!id) {
    const container = document.createElement("div");
    container.className = "markdown-editor-empty";
    container.textContent = "No note selected";
    return container;
  }

  const note: Note | null = notes[id];

  if (!note) {
    const container = document.createElement("div");
    container.className = "markdown-editor-empty";
    container.textContent = "Note not found";
    return container;
  }

  const container = document.createElement("div");
  container.className = "markdown-editor-container";

  // Header
  const header = document.createElement("div");
  header.className = "markdown-header";

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "markdown-title-input";
  titleInput.value = note.title;
  titleInput.placeholder = "Note title...";
  titleInput.oninput = (e) => {
    updateNote(note.id, { title: (e.target as HTMLInputElement).value });
  };

  const viewControls = document.createElement("div");
  viewControls.className = "markdown-view-controls";

  const editorPanel = document.createElement("div");
  editorPanel.className = "markdown-editor-panel";

  const previewPanel = document.createElement("div");
  previewPanel.className = "markdown-preview-panel";

  const mainContent = document.createElement("div");
  mainContent.className = "markdown-main-content split-view";

  const splitViewBtn = createButton({
    label: "📝📖 Split",
    onClick: () => setView("split"),
    variant: "secondary",
  });

  const editViewBtn = createButton({
    label: "📝 Edit",
    onClick: () => setView("edit"),
    variant: "secondary",
  });

  const previewViewBtn = createButton({
    label: "📖 Preview",
    onClick: () => setView("preview"),
    variant: "secondary",
  });

  viewControls.appendChild(splitViewBtn);
  viewControls.appendChild(editViewBtn);
  viewControls.appendChild(previewViewBtn);

  header.appendChild(titleInput);
  header.appendChild(viewControls);

  const toolbar = document.createElement("div");
  toolbar.className = "markdown-toolbar";

  const markdownButtons = [
    { label: "B", action: "**bold**", title: "Bold" },
    { label: "I", action: "*italic*", title: "Italic" },
    { label: "S", action: "~~strike~~", title: "Strikethrough" },
    { label: "C", action: "`code`", title: "Inline Code" },
    { label: "H1", action: "# ", title: "Heading 1" },
    { label: "H2", action: "## ", title: "Heading 2" },
    { label: "•", action: "- ", title: "Bullet List" },
    { label: "1.", action: "1. ", title: "Numbered List" },
    { label: "[]", action: "- [ ] ", title: "Task List" },
    { label: ">", action: "> ", title: "Quote" },
    { label: "```", action: "```\n\n```", title: "Code Block" },
    { label: "🔗", action: "[link](url)", title: "Link" },
  ];

  markdownButtons.forEach((btn) => {
    const button = document.createElement("button");
    button.className = "markdown-toolbar-btn";
    button.textContent = btn.label;
    button.title = btn.title;
    button.onclick = () => insertMarkdown(btn.action);
    toolbar.appendChild(button);
  });

  const textarea = document.createElement("textarea");
  textarea.className = "markdown-textarea";
  textarea.placeholder = "Write in Markdown...";
  textarea.value = htmlToMarkdown(note.content);

  const previewContent = document.createElement("div");
  previewContent.className = "markdown-preview-content";
  previewPanel.appendChild(previewContent);

  let debounceTimer: ReturnType<typeof setTimeout>;
  const updatePreview = () => {
    const markdown = textarea.value;
    previewContent.innerHTML = marked(markdown);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateNote(note.id, { content: marked(markdown) });
    }, 500);
  };

  updatePreview();
  textarea.oninput = updatePreview;

  function insertMarkdown(markdown: string) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const text =
      markdown.substring(0, markdown.length / 2) +
      selectedText +
      markdown.substring(markdown.length / 2);
    textarea.setRangeText(text, start, end, "end");
    textarea.focus();
    updatePreview();
  }

  function setView(view: "split" | "edit" | "preview") {
    switch (view) {
      case "split":
        mainContent.className = "markdown-main-content split-view";
        break;
      case "edit":
        mainContent.className = "markdown-main-content edit-view";
        break;
      case "preview":
        mainContent.className = "markdown-main-content preview-view";
        break;
    }
  }

  editorPanel.appendChild(toolbar);
  editorPanel.appendChild(textarea);
  mainContent.appendChild(editorPanel);
  mainContent.appendChild(previewPanel);

  const footer = document.createElement("div");
  footer.className = "markdown-footer";

  const statusGroup = document.createElement("div");
  statusGroup.className = "markdown-status-group";

  const statusSelector = document.createElement("select");
  statusSelector.className = "markdown-status-selector";
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
      status: (e.target as HTMLSelectElement).value as
        | "draft"
        | "private"
        | "published",
    });
  };

  const wordCount = document.createElement("span");
  wordCount.className = "markdown-word-count";

  const updateWordCount = () => {
    const words = textarea.value.trim().split(/\s+/).length;
    wordCount.textContent = `${words} words`;
  };
  textarea.addEventListener("input", updateWordCount);
  updateWordCount();

  statusGroup.appendChild(statusSelector);
  statusGroup.appendChild(wordCount);

  const actionsGroup = document.createElement("div");
  actionsGroup.className = "markdown-actions-group";

  let metadataSidebar: HTMLElement | null = null;
  const metadataBtn = createButton({
    label: "📊 Metadata",
    onClick: () => {
      if (metadataSidebar) {
        container.removeChild(metadataSidebar);
        metadataSidebar = null;
      } else {
        metadataSidebar = createMetadataSidebar();
        metadataSidebar.className = "markdown-metadata-sidebar";
        container.appendChild(metadataSidebar);
      }
    },
    variant: "secondary",
  });

  actionsGroup.appendChild(metadataBtn);
  footer.appendChild(statusGroup);
  footer.appendChild(actionsGroup);

  container.appendChild(header);
  container.appendChild(mainContent);
  container.appendChild(footer);

  const unsubscribe = useAppStore.subscribe(
    (state) => state.notes[id],
    (newNote) => {
      if (newNote) {
        const newMarkdown = htmlToMarkdown(newNote.content);
        if (newMarkdown !== textarea.value) {
          textarea.value = newMarkdown;
          updatePreview();
        }
        if (newNote.title !== titleInput.value) {
          titleInput.value = newNote.title;
        }
      }
    },
  );

  const observer = new MutationObserver((mutations, obs) => {
    if (!document.contains(container)) {
      unsubscribe();
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return container;
}
