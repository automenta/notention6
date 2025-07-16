import { useAppStore } from "../store";
import { Note } from "../../shared/types";
import "./Button";
import "./Input";

export class NotesList extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private notes: Note[] = [];
  private searchQuery = "";
  private selectedFolder: string | undefined = undefined;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Subscribe to store changes
    this.unsubscribe = useAppStore.subscribe((state) => {
      this.notes = Object.values(state.notes);
      this.searchQuery = state.searchQuery;
      this.render();
    });

    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private handleNoteClick(noteId: string) {
    useAppStore.getState().setCurrentNote(noteId);

    // For now, just show the note editor in a modal or navigate to it
    this.dispatchEvent(
      new CustomEvent("note-selected", {
        detail: { noteId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleSearchInput(value: string) {
    useAppStore.getState().setSearchQuery(value);
  }

  private handleNewNote() {
    const store = useAppStore.getState();
    const noteId = store.createNote({
      title: "Untitled Note",
      content: "",
      folderId: "root",
    });
    store.setCurrentNote(noteId);
    this.dispatchEvent(
      new CustomEvent("note-selected", {
        detail: { noteId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private getFilteredNotes(): Note[] {
    let filtered = this.notes;

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Filter by folder
    if (this.selectedFolder) {
      filtered = filtered.filter(
        (note) => note.folderId === this.selectedFolder,
      );
    }

    // Sort by updated date (most recent first)
    return filtered.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  private stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  render() {
    if (!this.shadowRoot) return;

    const filteredNotes = this.getFilteredNotes();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }

        .notes-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .notes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
          flex-shrink: 0;
        }

        .notes-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .search-container {
          margin-bottom: var(--space-4);
          flex-shrink: 0;
        }

        .search-input {
          width: 100%;
          max-width: 400px;
        }

        .notes-stats {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
          padding: var(--space-4);
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
        }

        .stat-number {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .notes-list {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        .note-item {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          margin-bottom: var(--space-3);
          cursor: pointer;
          transition: var(--transition-base);
          position: relative;
        }

        .note-item:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-border-strong);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .note-item:active {
          transform: translateY(0);
        }

        .note-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }

        .note-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0;
          line-height: var(--line-height-tight);
        }

        .note-meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .note-status {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }

        .note-status.draft {
          background: var(--color-warning-50);
          color: var(--color-warning-600);
        }

        .note-status.published {
          background: var(--color-success-50);
          color: var(--color-success-600);
        }

        .note-preview {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-3);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .note-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .note-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          background: var(--color-accent-light);
          color: var(--color-accent);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin-bottom: var(--space-4);
          color: var(--color-text-muted);
        }

        .empty-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .empty-description {
          color: var(--color-text-muted);
          margin-bottom: var(--space-6);
          max-width: 300px;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .notes-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-4);
          }

          .header-actions {
            justify-content: flex-end;
          }

          .notes-stats {
            flex-direction: column;
            gap: var(--space-2);
          }

          .stat-item {
            flex-direction: row;
            gap: var(--space-3);
          }

          .note-header {
            flex-direction: column;
            gap: var(--space-2);
          }

          .note-meta {
            align-self: flex-start;
          }
        }
      </style>

      <div class="notes-container">
        <!-- Header -->
        <div class="notes-header">
          <h1 class="notes-title">Notes</h1>
          <div class="header-actions">
            <ui-button variant="primary" data-action="new-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14m-7-7h14"></path>
              </svg>
              New Note
            </ui-button>
          </div>
        </div>

        <!-- Search -->
        <div class="search-container">
          <ui-input 
            id="search-input"
            class="search-input"
            type="search"
            placeholder="Search notes, tags, content..."
            value="${this.searchQuery}"
          >
            <svg slot="icon-left-content" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </ui-input>
        </div>

        <!-- Stats -->
        <div class="notes-stats">
          <div class="stat-item">
            <div class="stat-number">${this.notes.length}</div>
            <div class="stat-label">Total Notes</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${this.notes.filter((n) => n.status === "draft").length}</div>
            <div class="stat-label">Drafts</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${this.notes.filter((n) => n.status === "published").length}</div>
            <div class="stat-label">Published</div>
          </div>
        </div>

        <!-- Notes List -->
        <div class="notes-list">
          ${
            filteredNotes.length === 0
              ? `
            <div class="empty-state">
              <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              <h3 class="empty-title">
                ${this.searchQuery ? "No notes found" : "No notes yet"}
              </h3>
              <p class="empty-description">
                ${
                  this.searchQuery
                    ? "Try adjusting your search terms or create a new note."
                    : "Start capturing your thoughts by creating your first note."
                }
              </p>
              ${
                !this.searchQuery
                  ? `
                <ui-button variant="primary" data-action="new-note">
                  Create your first note
                </ui-button>
              `
                  : ""
              }
            </div>
          `
              : filteredNotes
                  .map(
                    (note) => `
            <div class="note-item" data-note-id="${note.id}">
              <div class="note-header">
                <h3 class="note-title">${note.title || "Untitled"}</h3>
                <div class="note-meta">
                  <span class="note-status ${note.status}">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                    ${note.status}
                  </span>
                  <span>${this.formatDate(new Date(note.updatedAt))}</span>
                </div>
              </div>
              
              ${
                note.content
                  ? `
                <p class="note-preview">${this.stripHtml(note.content)}</p>
              `
                  : ""
              }
              
              ${
                note.tags.length > 0
                  ? `
                <div class="note-tags">
                  ${note.tags
                    .slice(0, 3)
                    .map(
                      (tag) => `
                    <span class="note-tag">${tag}</span>
                  `,
                    )
                    .join("")}
                  ${
                    note.tags.length > 3
                      ? `
                    <span class="note-tag">+${note.tags.length - 3}</span>
                  `
                      : ""
                  }
                </div>
              `
                  : ""
              }
            </div>
          `,
                  )
                  .join("")
          }
        </div>
      </div>
    `;

    // Add event listeners for dynamic content
    this.addEventListeners();
  }

  private addEventListeners() {
    if (!this.shadowRoot) return;

    // Note item clicks
    const noteItems = this.shadowRoot.querySelectorAll(".note-item");
    noteItems.forEach((item) => {
      item.addEventListener("click", () => {
        const noteId = (item as HTMLElement).dataset.noteId;
        if (noteId) {
          this.handleNoteClick(noteId);
        }
      });
    });

    // New note buttons
    const newNoteButtons = this.shadowRoot.querySelectorAll(
      '[data-action="new-note"]',
    );
    newNoteButtons.forEach((button) => {
      button.addEventListener("click", () => this.handleNewNote());
    });

    // Search input
    const searchInput = this.shadowRoot.querySelector("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        this.handleSearchInput(target.value);
      });
    }
  }
}

customElements.define("notention-notes-list", NotesList);
