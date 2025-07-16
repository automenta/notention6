import { useAppStore } from "../store";
import { Note } from "../../shared/types";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
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
    this.unsubscribe = useAppStore.subscribe((state) => {
      const noteId = state.currentNoteId;
      const newNote = noteId ? state.notes[noteId] : null;

      if (newNote?.id !== this.currentNote?.id || !this.hasUnsavedChanges) {
        this.currentNote = newNote;
        this.hasUnsavedChanges = false;
        this.render();
        this.initializeTiptap();
      }
    });

    this.render();
    this.initializeTiptap();
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
      extensions: [StarterKit],
      content: this.currentNote.content,
      onUpdate: () => {
        this.hasUnsavedChanges = true;
        this.autoSave();
        this.updateToolbar();
      },
      onSelectionUpdate: () => {
        this.updateToolbar();
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
      this.renderToolbar(); // Re-render toolbar to update save status
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
    this.renderToolbar();
  };

  private formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  private updateToolbar() {
    if (!this.shadowRoot || !this.editor) return;
    const buttons = this.shadowRoot.querySelectorAll(".toolbar-button");
    buttons.forEach((button) => {
      const action = button.getAttribute("data-action");
      if (action && this.editor?.isActive(action)) {
        button.classList.add("is-active");
      } else {
        button.classList.remove("is-active");
      }
    });
  }

  private renderToolbar() {
    if (!this.shadowRoot) return;
    const toolbarContainer = this.shadowRoot.querySelector(".editor-header");
    if (toolbarContainer) {
      toolbarContainer.innerHTML = this.getToolbarHTML();
    }
  }

  private getToolbarHTML(): string {
    return `
      <div class="editor-actions">
        <span class="save-status ${this.hasUnsavedChanges ? "unsaved" : ""}">
          ${this.hasUnsavedChanges ? "Saving..." : "Saved"}
        </span>
        <ui-button variant="primary" size="sm" onclick="this.getRootNode().host.saveNote()">Save</ui-button>
        <ui-button variant="ghost" size="sm" onclick="this.getRootNode().host.deleteNote()">Delete</ui-button>
      </div>
      <div class="editor-toolbar">
        <button class="toolbar-button" data-action="bold" onclick="this.getRootNode().host.editor.chain().focus().toggleBold().run()">B</button>
        <button class="toolbar-button" data-action="italic" onclick="this.getRootNode().host.editor.chain().focus().toggleItalic().run()">I</button>
        <button class="toolbar-button" data-action="strike" onclick="this.getRootNode().host.editor.chain().focus().toggleStrike().run()">S</button>
        <button class="toolbar-button" data-action="bulletList" onclick="this.getRootNode().host.editor.chain().focus().toggleBulletList().run()">UL</button>
        <button class="toolbar-button" data-action="orderedList" onclick="this.getRootNode().host.editor.chain().focus().toggleOrderedList().run()">OL</button>
      </div>
    `;
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="src/ui/styles/variables.css">
      <link rel="stylesheet" href="src/ui/NoteEditor.css">
    `;

    if (!this.currentNote) {
      this.shadowRoot.innerHTML += `
        <div class="welcome-container">
          <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
          </svg>
          <h3 class="welcome-title">Select a Note</h3>
          <p class="welcome-description">
            Choose a note from the list to view and edit it, or create a new one to get started.
          </p>
          <ui-button variant="primary" onclick="this.getRootNode().host.createNewNote()">
            Create New Note
          </ui-button>
        </div>
      `;
      return;
    }

    const store = useAppStore.getState();
    const folders = Object.values(store.folders);

    this.shadowRoot.innerHTML += `
      <div class="editor-container">
        <div class="editor-header">
          ${this.getToolbarHTML()}
        </div>
        <div class="editor-content">
          <div class="note-meta">
            <div class="meta-row">
              <label class="meta-label" for="note-title">Title</label>
              <ui-input 
                id="note-title" 
                type="text" 
                value="${this.currentNote.title}"
                oninput="this.getRootNode().host.handleInput()"
              ></ui-input>
            </div>
            <div class="meta-row">
              <label class="meta-label" for="note-folder">Folder</label>
              <select id="note-folder" onchange="this.getRootNode().host.handleInput()">
                <option value="root" ${
                  this.currentNote.folderId === "root" ? "selected" : ""
                }>Root</option>
                ${folders
                  .map(
                    (f) =>
                      `<option value="${f.id}" ${
                        this.currentNote?.folderId === f.id ? "selected" : ""
                      }>${f.name}</option>`,
                  )
                  .join("")}
              </select>
            </div>
          </div>
          <div class="editor-body"></div>
        </div>
      </div>
    `;

    this.addEventListeners();
  }

  private addEventListeners() {
    if (!this.shadowRoot) return;
    const toolbar = this.shadowRoot.querySelector(".editor-toolbar");
    toolbar?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest(".toolbar-button");
      if (button) {
        this.updateToolbar();
      }
    });
  }
}

customElements.define("notention-note-editor", NoteEditor);

// Make methods available on the instance for event handlers
(NoteEditor.prototype as any).createNewNote = NoteEditor.prototype.createNewNote;
(NoteEditor.prototype as any).saveNote = NoteEditor.prototype.saveNote;
(NoteEditor.prototype as any).deleteNote = NoteEditor.prototype.deleteNote;
(NoteEditor.prototype as any).handleInput = NoteEditor.prototype.handleInput;
