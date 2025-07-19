// Markdown Note Editor - Split view with live preview
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { createMetadataSidebar } from "./MetadataSidebar";
import { Note } from "../../shared/types";
import "./NoteEditorMarkdown.css";

export function createNoteEditorMarkdown(noteId?: string): HTMLElement {
  const { currentNoteId, notes, updateNote, userProfile } =
    useAppStore.getState();
  const id = noteId || currentNoteId;

  if (!id) {
    const container = document.createElement("div");
    container.className = "markdown-editor-empty";
    container.textContent = "No note selected";
    return container;
  }

  const note: Note | null = notes[id];
  const aiEnabled = userProfile?.preferences?.aiEnabled || false;

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

  // View toggle buttons
  const viewControls = document.createElement("div");
  viewControls.className = "markdown-view-controls";

  let currentView: "split" | "edit" | "preview" = "split";

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

  // Main content area
  const mainContent = document.createElement("div");
  mainContent.className = "markdown-main-content";

  // Editor panel
  const editorPanel = document.createElement("div");
  editorPanel.className = "markdown-editor-panel";

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "markdown-toolbar";

  // Common markdown buttons
  const markdownButtons = [
    { label: "𝐁", action: "**bold**", title: "Bold" },
    { label: "𝐼", action: "*italic*", title: "Italic" },
    { label: "~~", action: "~~strikethrough~~", title: "Strikethrough" },
    { label: "`", action: "`code`", title: "Inline Code" },
    { label: "H1", action: "# ", title: "Heading 1" },
    { label: "H2", action: "## ", title: "Heading 2" },
    { label: "H3", action: "### ", title: "Heading 3" },
    { label: "•", action: "- ", title: "Bullet List" },
    { label: "1.", action: "1. ", title: "Numbered List" },
    { label: "[]", action: "- [ ] ", title: "Task List" },
    { label: ">", action: "> ", title: "Quote" },
    { label: "```", action: "```\n\n```", title: "Code Block" },
    { label: "🔗", action: "[text](url)", title: "Link" },
    { label: "📷", action: "![alt](url)", title: "Image" },
  ];

  markdownButtons.forEach((btn) => {
    const button = document.createElement("button");
    button.className = "markdown-toolbar-btn";
    button.textContent = btn.label;
    button.title = btn.title;
    button.onclick = () => insertMarkdown(btn.action);
    toolbar.appendChild(button);
  });

  // Textarea
  const textarea = document.createElement("textarea");
  textarea.className = "markdown-textarea";
  textarea.placeholder = "Write in Markdown...";

  // Convert HTML to markdown (basic conversion)
  textarea.value = htmlToMarkdown(note.content);

  // Preview panel
  const previewPanel = document.createElement("div");
  previewPanel.className = "markdown-preview-panel";

  const previewContent = document.createElement("div");
  previewContent.className = "markdown-preview-content";

  previewPanel.appendChild(previewContent);

  // Update preview function
  const updatePreview = () => {
    const markdown = textarea.value;
    const html = markdownToHtml(markdown);
    previewContent.innerHTML = html;

    // Update note content
    updateNote(note.id, { content: html });
  };

  // Set initial preview
  updatePreview();

  // Update on input
  textarea.oninput = updatePreview;

  // Insert markdown helper
  function insertMarkdown(markdown: string) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let insertText = markdown;

    // Handle special cases
    if (markdown.includes("text")) {
      insertText = markdown.replace("text", selectedText || "text");
    } else if (markdown.includes("**bold**") && selectedText) {
      insertText = `**${selectedText}**`;
    } else if (markdown.includes("*italic*") && selectedText) {
      insertText = `*${selectedText}*`;
    } else if (markdown.includes("~~strikethrough~~") && selectedText) {
      insertText = `~~${selectedText}~~`;
    } else if (markdown.includes("`code`") && selectedText) {
      insertText = `\`${selectedText}\``;
    } else if (
      markdown.startsWith("#") ||
      markdown.startsWith("-") ||
      markdown.startsWith(">") ||
      markdown.startsWith("1.")
    ) {
      // For line-based formatting, insert at line start
      const lines = textarea.value.split("\n");
      const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;
      textarea.setSelectionRange(lineStart, lineStart);
      insertText = markdown;
    }

    textarea.setRangeText(
      insertText,
      textarea.selectionStart,
      textarea.selectionEnd,
      "end",
    );
    textarea.focus();
    updatePreview();
  }

  // View switching function
  function setView(view: "split" | "edit" | "preview") {
    currentView = view;

    // Update button states
    [splitViewBtn, editViewBtn, previewViewBtn].forEach((btn) => {
      btn.className = btn.className.replace(" active", "");
    });

    switch (view) {
      case "split":
        splitViewBtn.className += " active";
        editorPanel.style.display = "flex";
        previewPanel.style.display = "block";
        mainContent.className = "markdown-main-content split-view";
        break;
      case "edit":
        editViewBtn.className += " active";
        editorPanel.style.display = "flex";
        previewPanel.style.display = "none";
        mainContent.className = "markdown-main-content edit-view";
        break;
      case "preview":
        previewViewBtn.className += " active";
        editorPanel.style.display = "none";
        previewPanel.style.display = "block";
        mainContent.className = "markdown-main-content preview-view";
        break;
    }
  }

  // Set initial view
  setView("split");

  editorPanel.appendChild(toolbar);
  editorPanel.appendChild(textarea);
  mainContent.appendChild(editorPanel);
  mainContent.appendChild(previewPanel);

  // Footer with controls
  const footer = document.createElement("div");
  footer.className = "markdown-footer";

  // Status and actions
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

  // Word count
  const wordCount = document.createElement("span");
  wordCount.className = "markdown-word-count";

  const updateWordCount = () => {
    const text = textarea.value.trim();
    const words = text.split(/\s+/).filter((word) => word.length > 0).length;
    wordCount.textContent = `${words} words`;
  };

  textarea.addEventListener("input", updateWordCount);
  updateWordCount();

  statusGroup.appendChild(statusSelector);
  statusGroup.appendChild(wordCount);

  // Action buttons
  const actionsGroup = document.createElement("div");
  actionsGroup.className = "markdown-actions-group";

  // Metadata toggle
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

  // Share button
  const shareButton = createButton({
    label: "📤 Share",
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

  actionsGroup.appendChild(metadataBtn);
  actionsGroup.appendChild(shareButton);

  footer.appendChild(statusGroup);
  footer.appendChild(actionsGroup);

  // Assembly
  container.appendChild(header);
  container.appendChild(mainContent);
  container.appendChild(footer);

  return container;
}

// Basic HTML to Markdown conversion
function htmlToMarkdown(html: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Simple conversion - can be enhanced
  let markdown = tempDiv.innerHTML
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n")
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(
      /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi,
      "![$2]($1)",
    )
    .replace(/<br[^>]*>/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<ul[^>]*>(.*?)<\/ul>/gi, "$1\n")
    .replace(/<ol[^>]*>(.*?)<\/ol>/gi, "$1\n")
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n");

  // Clean up extra whitespace
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}

// Basic Markdown to HTML conversion
function markdownToHtml(markdown: string): string {
  return (
    markdown
      // Headers
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")

      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")

      // Code
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")

      // Links and Images
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>')

      // Lists
      .replace(/^\s*\* (.*$)/gim, "<li>$1</li>")
      .replace(/^\s*- (.*$)/gim, "<li>$1</li>")
      .replace(/^\s*\+ (.*$)/gim, "<li>$1</li>")
      .replace(/^\s*\d+\. (.*$)/gim, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")

      // Task lists
      .replace(
        /^\s*- \[ \] (.*$)/gim,
        '<input type="checkbox" disabled> $1<br>',
      )
      .replace(
        /^\s*- \[x\] (.*$)/gim,
        '<input type="checkbox" checked disabled> $1<br>',
      )

      // Blockquotes
      .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")

      // Line breaks
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")

      // Wrap in paragraphs
      .replace(/^(.*)$/gim, "<p>$1</p>")

      // Clean up
      .replace(/<p><\/p>/g, "")
      .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, "$1")
      .replace(/<p>(<blockquote>.*<\/blockquote>)<\/p>/g, "$1")
      .replace(/<p>(<ul>.*<\/ul>)<\/p>/g, "$1")
      .replace(/<p>(<pre>.*<\/pre>)<\/p>/g, "$1")
  );
}
