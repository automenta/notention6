import { useAppStore } from "../store";
import { Note } from "../../shared/types";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { suggestion } from "../lib/suggestion";
import "./Button";
import "./Input";

export class NoteEditor extends HTMLElement {
  private editor: Editor | null = null;
  private unsubscribe: () => void = () => {};
  private currentNote: Note | null = null;
  private hasUnsavedChanges = false;
  private autoSaveTimeout: number | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        currentNoteId: state.currentNoteId,
        notes: state.notes,
      }),
      ({ currentNoteId, notes }) => {
        const newNote = currentNoteId ? notes[currentNoteId] : null;
        if (newNote?.id !== this.currentNote?.id || !this.hasUnsavedChanges) {
          this.currentNote = newNote;
          this.hasUnsavedChanges = false;
          this.render();
        }
      },
      {
        equalityFn: (a, b) =>
          a.currentNoteId === b.currentNoteId && a.notes === b.notes,
      },
    );

    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
    this.editor?.destroy();
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  }

  private initializeTiptap() {
    if (this.editor) {
      this.editor.destroy();
    }

    const editorElement = this.shadowRoot?.querySelector(".editor-body");
    if (!editorElement || !this.currentNote) return;

    this.editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit,
        Mention.configure({
          HTMLAttributes: {
            class: "tag",
          },
          suggestion: suggestion,
        }),
      ],
      content: this.currentNote.content,
      onUpdate: () => {
        this.hasUnsavedChanges = true;
        this.autoSave();
        this.requestUpdate();
      },
      onSelectionUpdate: () => {
        this.requestUpdate();
      },
    });
  }

  private createNewNote = () => {
    const store = useAppStore.getState();
    store.createNote({
      title: "Untitled Note",
      content: "<p></p>",
      folderId: store.currentFolderId || "root",
    });
  };

  private saveNote = () => {
    if (!this.currentNote || !this.shadowRoot || !this.editor) return;

    const titleInput = this.shadowRoot.querySelector(
      "#note-title",
    ) as HTMLInputElement;
    const folderSelect = this.shadowRoot.querySelector(
      "#note-folder",
    ) as HTMLSelectElement;

    if (titleInput && folderSelect) {
      const updatedNote: Partial<Note> = {
        title: titleInput.value.trim() || "Untitled Note",
        content: this.editor.getHTML(),
        folderId: folderSelect.value,
        updatedAt: new Date().toISOString(),
      };

      useAppStore.getState().updateNote(this.currentNote.id, updatedNote);
      this.hasUnsavedChanges = false;
      this.requestUpdate();
    }
  };

  private deleteNote = () => {
    if (!this.currentNote) return;
    if (confirm("Are you sure you want to delete this note?")) {
      useAppStore.getState().deleteNote(this.currentNote.id);
    }
  };

  private autoSave = () => {
    if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = window.setTimeout(() => {
      if (this.hasUnsavedChanges) this.saveNote();
    }, 2000);
  };

  private handleInput = () => {
    this.hasUnsavedChanges = true;
    this.autoSave();
    this.requestUpdate();
  };

  private requestUpdate() {
    this.render();
  }

  private getToolbarHTML() {
    const isBold = this.editor?.isActive("bold");
    const isItalic = this.editor?.isActive("italic");
    const isStrike = this.editor?.isActive("strike");
    const isBulletList = this.editor?.isActive("bulletList");
    const isOrderedList = this.editor?.isActive("orderedList");
    const isBlockquote = this.editor?.isActive("blockquote");
    const isCodeBlock = this.editor?.isActive("codeBlock");

    return html`
      <div class="editor-actions">
        <span class="save-status ${this.hasUnsavedChanges ? "unsaved" : ""}">
          ${this.hasUnsavedChanges ? "Saving..." : "Saved"}
        </span>
        <ui-button variant="primary" size="sm" @click=${this.saveNote}
          >Save</ui-button
        >
        <ui-button variant="ghost" size="sm" @click=${this.deleteNote}
          >Delete</ui-button
        >
      </div>
      <div class="editor-toolbar">
        <button
          class="toolbar-button ${isBold ? "is-active" : ""}"
          @click=${() => this.editor?.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          class="toolbar-button ${isItalic ? "is-active" : ""}"
          @click=${() => this.editor?.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          class="toolbar-button ${isStrike ? "is-active" : ""}"
          @click=${() => this.editor?.chain().focus().toggleStrike().run()}
        >
          S
        </button>
        <button
          class="toolbar-button"
          @click=${() =>
            this.editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </button>
        <button
          class="toolbar-button"
          @click=${() =>
            this.editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          class="toolbar-button"
          @click=${() =>
            this.editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          class="toolbar-button ${isBulletList ? "is-active" : ""}"
          @click=${() => this.editor?.chain().focus().toggleBulletList().run()}
        >
          UL
        </button>
        <button
          class="toolbar-button ${isOrderedList ? "is-active" : ""}"
          @click=${() => this.editor?.chain().focus().toggleOrderedList().run()}
        >
          OL
        </button>
        <button
          class="toolbar-button ${isBlockquote ? "is-active" : ""}"
          @click=${() => this.editor?.chain().focus().toggleBlockquote().run()}
        >
          ”
        </button>
        <button
          class="toolbar-button ${isCodeBlock ? "is-active" : ""}"
          @click=${() => this.editor?.chain().focus().toggleCodeBlock().run()}
        >
          &lt;/&gt;
        </button>
        <button
          class="toolbar-button"
          @click=${() => this.editor?.chain().focus().setHorizontalRule().run()}
        >
          ―
        </button>
      </div>
    `;
  }

  render() {
    if (!this.shadowRoot) return;

    const template = html`
      <link rel="stylesheet" href="src/ui/styles/variables.css" />
      <link rel="stylesheet" href="src/ui/NoteEditor.css" />

      ${!this.currentNote
        ? html`
            <div class="welcome-container">
              <svg
                class="welcome-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                ></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              <h3 class="welcome-title">Select a Note</h3>
              <p class="welcome-description">
                Choose a note from the list to view and edit it, or create a
                new one to get started.
              </p>
              <ui-button variant="primary" @click=${this.createNewNote}>
                Create New Note
              </ui-button>
            </div>
          `
        : this.renderEditor()}
    `;

    render(template, this.shadowRoot);
    if (this.currentNote && !this.editor) {
      this.initializeTiptap();
    }
  }

  private renderEditor() {
    const store = useAppStore.getState();
    const folders = Object.values(store.folders);

    return html`
      <div class="editor-container">
        <div class="editor-header">${this.getToolbarHTML()}</div>
        <div class="editor-content">
          <div class="note-meta">
            <div class="meta-row">
              <label class="meta-label" for="note-title">Title</label>
              <ui-input
                id="note-title"
                type="text"
                .value=${this.currentNote?.title || ""}
                @input=${this.handleInput}
              ></ui-input>
            </div>
            <div class="meta-row">
              <label class="meta-label" for="note-folder">Folder</label>
              <select id="note-folder" @change=${this.handleInput}>
                <option
                  value="root"
                  ?selected=${this.currentNote?.folderId === "root"}
                >
                  Root
                </option>
                ${repeat(
                  folders,
                  (f) => f.id,
                  (f) => html`
                    <option
                      value="${f.id}"
                      ?selected=${this.currentNote?.folderId === f.id}
                    >
                      ${f.name}
                    </option>
                  `,
                )}
              </select>
            </div>
          </div>
          <div class="editor-body"></div>
        </div>
      </div>
    `;
  }
}

customElements.define("notention-note-editor", NoteEditor);
