import { useAppStore } from "../store";
import { Folder, Note } from "../../shared/types";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { html, render } from "lit-html";
import { when } from "lit-html/directives/when.js";
import { repeat } from "lit-html/directives/repeat.js";
import { suggestion } from "../lib/suggestion";
import { logger, debounce } from "../lib/utils";
import "./Button";
import "./Input";
import "./Icon";

const log = logger("notention-note-editor");

type SaveStatus = "idle" | "saving" | "saved" | "error";

export class NoteEditor extends HTMLElement {
  private editor: Editor | null = null;
  private unsubscribe: () => void = () => {};
  private currentNote: Note | null = null;
  private folders: Folder[] = [];
  private saveStatus: SaveStatus = "idle";
  private debouncedSave: () => void;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.debouncedSave = debounce(this.saveNote, 1500);
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        currentNoteId: state.currentNoteId,
        notes: state.notes,
        folders: Object.values(state.folders),
      }),
      ({ currentNoteId, notes, folders }) => {
        const newNote = currentNoteId ? notes[currentNoteId] : null;
        this.folders = folders;

        if (newNote?.id !== this.currentNote?.id) {
          log(`Switching to note: ${newNote?.id}`);
          this.currentNote = newNote;
          this.saveStatus = "idle";
          this.render();
          // This ensures the editor is re-initialized after the DOM is updated
          setTimeout(() => this.initializeTiptap(), 0);
        }
      },
      {
        equalityFn: (a, b) =>
          a.currentNoteId === b.currentNoteId &&
          a.notes === b.notes &&
          a.folders === b.folders,
      },
    );

    // Initial load
    const initialState = useAppStore.getState();
    const currentNoteId = initialState.currentNoteId;
    this.currentNote = currentNoteId ? initialState.notes[currentNoteId] : null;
    this.folders = Object.values(initialState.folders);
    this.render();
    if (this.currentNote) {
      setTimeout(() => this.initializeTiptap(), 0);
    }
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
    this.editor?.destroy();
  }

  private initializeTiptap() {
    if (this.editor) {
      log("Destroying existing Tiptap instance");
      this.editor.destroy();
      this.editor = null;
    }

    const editorElement = this.shadowRoot?.querySelector(".editor-body");
    if (!editorElement || !this.currentNote) {
      log(
        "Editor element not found or no current note, skipping Tiptap initialization",
      );
      return;
    }

    log("Initializing Tiptap editor");
    this.editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit,
        Mention.configure({
          HTMLAttributes: { class: "tag" },
          suggestion: suggestion,
        }),
      ],
      content: this.currentNote.content,
      onUpdate: () => {
        this.handleInput();
        this.renderToolbar(); // Re-render only the toolbar for performance
      },
      onSelectionUpdate: () => {
        this.renderToolbar();
      },
    });
  }

  private async createNewNote() {
    log("Creating new note");
    const store = useAppStore.getState();
    try {
      const noteId = await store.createNote({
        title: "Untitled Note",
        content: "<p></p>",
        folderId: store.currentFolderId || "root",
      });
      log(`New note created: ${noteId}`);
      store.setCurrentNoteId(noteId);
    } catch (error) {
      log.error("Failed to create new note", error);
    }
  }

  private async saveNote() {
    if (!this.currentNote || !this.shadowRoot || !this.editor) return;
    log(`Saving note: ${this.currentNote.id}`);
    this.saveStatus = "saving";
    this.renderSaveStatus();

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

      try {
        await useAppStore
          .getState()
          .updateNote(this.currentNote.id, updatedNote);
        this.saveStatus = "saved";
        log("Note saved successfully");
      } catch (error) {
        this.saveStatus = "error";
        log.error("Failed to save note", error);
      }
      this.renderSaveStatus();

      // Reset status after a delay
      if (this.saveStatus === "saved" || this.saveStatus === "error") {
        setTimeout(() => {
          this.saveStatus = "idle";
          this.renderSaveStatus();
        }, 3000);
      }
    }
  }

  private async deleteNote() {
    if (!this.currentNote) return;
    if (window.confirm("Are you sure you want to delete this note?")) {
      log(`Deleting note: ${this.currentNote.id}`);
      try {
        await useAppStore.getState().deleteNote(this.currentNote.id);
        log("Note deleted successfully");
      } catch (error) {
        log.error("Failed to delete note", error);
      }
    }
  }

  private handleInput = () => {
    this.saveStatus = "saving";
    this.renderSaveStatus();
    this.debouncedSave();
  };

  private renderToolbar() {
    const toolbarContainer = this.shadowRoot?.querySelector(".editor-toolbar");
    if (toolbarContainer) {
      render(this.toolbarTemplate(), toolbarContainer);
    }
  }

  private renderSaveStatus() {
    const saveStatusContainer = this.shadowRoot?.querySelector(
      ".save-status-container",
    );
    if (saveStatusContainer) {
      render(this.saveStatusTemplate(), saveStatusContainer);
    }
  }

  private saveStatusTemplate() {
    switch (this.saveStatus) {
      case "saving":
        return html`<span class="save-status saving">Saving...</span>`;
      case "saved":
        return html`<span class="save-status saved">Saved</span>`;
      case "error":
        return html`<span class="save-status error">Error saving</span>`;
      default:
        return html`<span class="save-status"></span>`;
    }
  }

  private toolbarTemplate() {
    const isBold = this.editor?.isActive("bold");
    const isItalic = this.editor?.isActive("italic");
    // ... add other states

    return html`
      <button
        class="toolbar-button ${isBold ? "is-active" : ""}"
        @click=${() => this.editor?.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <ui-icon name="bold"></ui-icon>
      </button>
      <button
        class="toolbar-button ${isItalic ? "is-active" : ""}"
        @click=${() => this.editor?.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <ui-icon name="italic"></ui-icon>
      </button>
      <!-- ... other buttons -->
    `;
  }

  render() {
    if (!this.shadowRoot) return;
    log("Full render");

    const template = html`
      <link rel="stylesheet" href="src/ui/styles/variables.css" />
      <link rel="stylesheet" href="src/ui/NoteEditor.css" />

      ${when(
        !this.currentNote,
        () => this.welcomeTemplate(),
        () => this.editorTemplate(),
      )}
    `;

    render(template, this.shadowRoot);
  }

  private welcomeTemplate() {
    return html`
      <div class="welcome-container">
        <ui-icon name="file-plus" class="welcome-icon"></ui-icon>
        <h3 class="welcome-title">Select or Create a Note</h3>
        <p class="welcome-description">
          Choose a note from the list to begin editing, or create a new one to
          capture your thoughts.
        </p>
        <ui-button variant="primary" @click=${() => this.createNewNote()}>
          <ui-icon name="plus" slot="icon-left"></ui-icon>
          Create New Note
        </ui-button>
      </div>
    `;
  }

  private editorTemplate() {
    if (!this.currentNote) return;

    return html`
      <div class="editor-container">
        <header class="editor-header">
          <div class="editor-toolbar">${this.toolbarTemplate()}</div>
          <div class="editor-actions">
            <div class="save-status-container">
              ${this.saveStatusTemplate()}
            </div>
            <ui-button
              variant="danger"
              size="sm"
              @click=${() => this.deleteNote()}
            >
              <ui-icon name="trash-2" slot="icon-left"></ui-icon>
              Delete
            </ui-button>
          </div>
        </header>
        <div class="editor-content">
          <div class="note-meta">
            <div class="meta-row">
              <label class="meta-label" for="note-title">Title</label>
              <ui-input
                id="note-title"
                type="text"
                .value=${this.currentNote.title || ""}
                @input=${this.handleInput}
                placeholder="Untitled Note"
              ></ui-input>
            </div>
            <div class="meta-row">
              <label class="meta-label" for="note-folder">Folder</label>
              <select
                id="note-folder"
                @change=${this.handleInput}
                class="folder-select"
              >
                <option
                  value="root"
                  ?selected=${this.currentNote.folderId === "root"}
                >
                  Root
                </option>
                ${repeat(
                  this.folders,
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
