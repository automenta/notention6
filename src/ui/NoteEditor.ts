import { useAppStore } from "../store";
import { Note } from "../../shared/types";
import "./Button";
import "./Input";
import "./Textarea";

export class NoteEditor extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private currentNote: Note | null = null;
  private isEditing = false;
  private autoSaveTimeout: number | null = null;
  private hasUnsavedChanges = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe((state) => {
      const noteId = state.currentNoteId;
      const newNote = noteId ? state.notes[noteId] : null;

      // Only update if note changed and we don't have unsaved changes
      if (newNote?.id !== this.currentNote?.id || !this.hasUnsavedChanges) {
        this.currentNote = newNote;
        this.isEditing = !!newNote;
        this.hasUnsavedChanges = false;
        this.render();
      }
    });

    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  }

  private createNewNote = () => {
    const store = useAppStore.getState();
    const noteId = store.createNote({
      title: "Untitled Note",
      content: "",
      folderId: store.currentFolderId || "root",
    });
    this.isEditing = true;
    this.render();
  };

  private saveNote = () => {
    if (!this.currentNote || !this.shadowRoot) return;

    const titleInput = this.shadowRoot.querySelector(
      "#note-title",
    ) as HTMLInputElement;
    const contentTextarea = this.shadowRoot.querySelector(
      "#note-content",
    ) as HTMLTextAreaElement;
    const folderSelect = this.shadowRoot.querySelector(
      "#note-folder",
    ) as HTMLSelectElement;

    if (titleInput && contentTextarea && folderSelect) {
      const updatedNote: Partial<Note> = {
        title: titleInput.value.trim() || "Untitled Note",
        content: contentTextarea.value,
        folderId: folderSelect.value,
        updatedAt: new Date().toISOString(),
      };

      useAppStore.getState().updateNote(this.currentNote.id, updatedNote);
      this.hasUnsavedChanges = false;
      this.render();
    }
  };

  private deleteNote = () => {
    if (!this.currentNote) return;

    if (confirm("Are you sure you want to delete this note?")) {
      useAppStore.getState().deleteNote(this.currentNote.id);
    }
  };

  private autoSave = () => {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = window.setTimeout(() => {
      if (this.hasUnsavedChanges) {
        this.saveNote();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  };

  private handleInput = () => {
    this.hasUnsavedChanges = true;
    this.autoSave();
  };

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  render() {
    if (!this.shadowRoot) return;

    const store = useAppStore.getState();
    const folders = Object.values(store.folders);

    if (!this.currentNote && !this.isEditing) {
      // No note selected - show welcome screen
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            height: 100%;
          }

          .editor-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            max-width: 1000px;
            margin: 0 auto;
            padding: var(--space-6);
          }

          .welcome {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            text-align: center;
          }

          .welcome-icon {
            width: 64px;
            height: 64px;
            margin-bottom: var(--space-4);
            color: var(--color-text-muted);
          }

          .welcome-title {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            margin-bottom: var(--space-2);
          }

          .welcome-description {
            color: var(--color-text-muted);
            margin-bottom: var(--space-6);
            max-width: 400px;
            line-height: var(--line-height-relaxed);
          }
        </style>

        <div class="editor-container">
          <div class="welcome">
            <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <h3 class="welcome-title">Start Writing</h3>
            <p class="welcome-description">
              Create a new note or select an existing one from the sidebar to begin editing.
            </p>
            <ui-button variant="primary" onclick="this.getRootNode().host.createNewNote()">
              Create New Note
            </ui-button>
          </div>
        </div>
      `;
      return;
    }

    // Note editor view
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }

        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }

        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-background-elevated);
        }

        .editor-actions {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .save-status {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-right: var(--space-4);
        }

        .save-status.unsaved {
          color: var(--color-warning);
        }

        .editor-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .note-meta {
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-background-elevated);
        }

        .meta-row {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          margin-bottom: var(--space-3);
        }

        .meta-row:last-child {
          margin-bottom: 0;
        }

        .meta-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          min-width: 60px;
        }

        .meta-info {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        #note-title {
          flex: 1;
        }

        #note-folder {
          min-width: 150px;
        }

        .editor-body {
          flex: 1;
          padding: var(--space-6);
          overflow-y: auto;
        }

        #note-content {
          width: 100%;
          min-height: 400px;
          border: none;
          outline: none;
          resize: vertical;
          font-family: var(--font-mono);
          font-size: var(--font-size-base);
          line-height: var(--line-height-relaxed);
          background: transparent;
          color: var(--color-text-primary);
        }

        select {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-background);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }
      </style>

      <div class="editor-container">
        <div class="editor-header">
          <div class="editor-actions">
            <span class="save-status ${this.hasUnsavedChanges ? "unsaved" : ""}">
              ${this.hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
            </span>
            <ui-button variant="primary" size="sm" onclick="this.getRootNode().host.saveNote()">
              Save
            </ui-button>
            <ui-button variant="ghost" size="sm" onclick="this.getRootNode().host.deleteNote()">
              Delete
            </ui-button>
          </div>
        </div>

        <div class="editor-content">
          <div class="note-meta">
            <div class="meta-row">
              <label class="meta-label" for="note-title">Title:</label>
              <ui-input 
                id="note-title" 
                type="text" 
                value="${this.currentNote?.title || ""}" 
                placeholder="Note title..."
                oninput="this.getRootNode().host.handleInput()"
              ></ui-input>
            </div>
            <div class="meta-row">
              <label class="meta-label" for="note-folder">Folder:</label>
              <select id="note-folder" onchange="this.getRootNode().host.handleInput()">
                <option value="root" ${this.currentNote?.folderId === "root" ? "selected" : ""}>Root</option>
                ${folders
                  .map(
                    (folder) =>
                      `<option value="${folder.id}" ${this.currentNote?.folderId === folder.id ? "selected" : ""}>
                    ${folder.name}
                  </option>`,
                  )
                  .join("")}
              </select>
            </div>
            ${
              this.currentNote
                ? `
              <div class="meta-row">
                <span class="meta-label">Created:</span>
                <span class="meta-info">${this.formatDate(this.currentNote.createdAt)}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Updated:</span>
                <span class="meta-info">${this.formatDate(this.currentNote.updatedAt)}</span>
              </div>
            `
                : ""
            }
          </div>

          <div class="editor-body">
            <textarea 
              id="note-content" 
              placeholder="Start writing your note..."
              oninput="this.getRootNode().host.handleInput()"
            >${this.currentNote?.content || ""}</textarea>
          </div>
        </div>
      </div>
    `;
  }
}

// Make methods available to event handlers
(NoteEditor.prototype as any).createNewNote =
  NoteEditor.prototype.createNewNote;
(NoteEditor.prototype as any).saveNote = NoteEditor.prototype.saveNote;
(NoteEditor.prototype as any).deleteNote = NoteEditor.prototype.deleteNote;
(NoteEditor.prototype as any).handleInput = NoteEditor.prototype.handleInput;

customElements.define("notention-note-editor", NoteEditor);
