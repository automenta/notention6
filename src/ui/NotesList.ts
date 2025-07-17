import { useAppStore } from "../store";
import { Note } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { when } from "lit-html/directives/when.js";
import { logger, debounce } from "../lib/utils";
import "./Button";
import "./Input";
import "./Icon";
import "./FilterModal";

const log = logger("notention-notes-list");

export class NotesList extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private notes: Note[] = [];
  private searchQuery = "";
  private currentFolderId: string | null = "root";
  private currentNoteId: string | null = null;
  private sortOption = "updatedAt-desc";
  private isFilterModalOpen = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        notes: Object.values(state.notes),
        searchQuery: state.searchQuery,
        currentFolderId: state.currentFolderId,
        currentNoteId: state.currentNoteId,
      }),
      (state) => {
        this.notes = state.notes;
        this.searchQuery = state.searchQuery;
        this.currentFolderId = state.currentFolderId;
        this.currentNoteId = state.currentNoteId;
        this.render();
      },
      {
        equalityFn: (a, b) =>
          a.notes === b.notes &&
          a.searchQuery === b.searchQuery &&
          a.currentFolderId === b.currentFolderId &&
          a.currentNoteId === b.currentNoteId,
      },
    );

    const initialState = useAppStore.getState();
    this.notes = Object.values(initialState.notes);
    this.searchQuery = initialState.searchQuery;
    this.currentFolderId = initialState.currentFolderId;
    this.currentNoteId = initialState.currentNoteId;
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
  }

  private handleNoteClick(noteId: string) {
    log(`Note clicked: ${noteId}`);
    useAppStore.getState().setCurrentNoteId(noteId);
  }

  private handleSearchInput = debounce((value: string) => {
    log(`Search query updated: ${value}`);
    useAppStore.getState().setSearchQuery(value);
  }, 300);

  private async handleNewNote() {
    log("Creating new note");
    try {
      const noteId = await useAppStore.getState().createNote({
        title: "Untitled Note",
        content: "<p></p>",
        folderId: this.currentFolderId || "root",
      });
      log(`New note created: ${noteId}`);
      useAppStore.getState().setCurrentNoteId(noteId);
    } catch (error) {
      log.error("Failed to create new note", error);
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 1 && date.getDate() === now.getDate()) {
      return "Today";
    }
    if (diffInDays < 2 && date.getDate() === now.getDate() - 1) {
      return "Yesterday";
    }
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    return date.toLocaleDateString();
  }

  private handleSortChange(value: string) {
    this.sortOption = value;
    this.render();
  }

  private openFilterModal() {
    this.isFilterModalOpen = true;
    this.render();
  }

  private closeFilterModal() {
    this.isFilterModalOpen = false;
    this.render();
  }

  private getFilteredNotes(): Note[] {
    const { searchFilters } = useAppStore.getState();

    const filtered = this.notes.filter((note) => {
      const inFolder =
        !this.currentFolderId || note.folderId === this.currentFolderId;

      const matchesSearch =
        !this.searchQuery ||
        note.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesTags =
        !searchFilters.tags ||
        searchFilters.tags.every((tag) => note.tags.includes(tag));

      return inFolder && matchesSearch && matchesTags;
    });

    const [sortBy, sortOrder] = this.sortOption.split("-");

    return filtered.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case "title":
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case "createdAt":
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
        default:
          valA = new Date(a.updatedAt).getTime();
          valB = new Date(b.updatedAt).getTime();
          break;
      }

      if (valA < valB) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (valA > valB) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  private stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  render() {
    if (!this.shadowRoot) return;
    log("Rendering notes list");

    const filteredNotes = this.getFilteredNotes();

    const template = html`
      <link rel="stylesheet" href="src/ui/NotesList.css" />
      <div class="notes-list-container">
        ${when(
          this.isFilterModalOpen,
          () =>
            html`<filter-modal
              @close=${() => this.closeFilterModal()}
            ></filter-modal>`,
        )}
        <header class="notes-list-header">
          <div class="search-container">
            <ui-input
              id="search-input"
              class="search-input"
              type="search"
              placeholder="Search notes..."
              .value=${this.searchQuery}
              @input=${(e: Event) =>
                this.handleSearchInput((e.target as HTMLInputElement).value)}
            >
              <ui-icon name="search" slot="icon-left"></ui-icon>
            </ui-input>
          </div>
          <div class="notes-list-actions">
            <select @change=${(e: Event) => this.handleSortChange((e.target as HTMLSelectElement).value)} class="sort-select">
              <option value="updatedAt-desc">Last Modified</option>
              <option value="createdAt-desc">Created Date</option>
              <option value="title-asc">Title</option>
            </select>
            <ui-button variant="secondary" @click=${() => this.openFilterModal()}>
              <ui-icon name="filter" slot="icon-left"></ui-icon>
              Filter
            </ui-button>
            <ui-button variant="primary" @click=${() => this.handleNewNote()}>
              <ui-icon name="plus" slot="icon-left"></ui-icon>
              New Note
            </ui-button>
          </div>
        </header>

        <div class="notes-list-content">
          ${when(
            filteredNotes.length > 0,
            () => this.renderNotes(filteredNotes),
            () => this.renderEmptyState(),
          )}
        </div>
      </div>
    `;
    render(template, this.shadowRoot);
  }

  private renderNotes(notes: Note[]) {
    return html`
      <ul class="notes-list">
        ${repeat(
          notes,
          (note) => note.id,
          (note) => html`
            <li
              class="note-item ${note.id === this.currentNoteId
                ? "active"
                : ""}"
              @click=${() => this.handleNoteClick(note.id)}
            >
              <h3 class="note-title">${note.title || "Untitled"}</h3>
              <p class="note-preview">
                <span class="note-date"
                  >${this.formatDate(note.updatedAt)}</span
                >
                <span class="note-excerpt"
                  >${this.stripHtml(note.content)}</span
                >
              </p>
            </li>
          `,
        )}
      </ul>
    `;
  }

  private renderEmptyState() {
    const hasSearch = this.searchQuery.trim().length > 0;
    return html`
      <div class="empty-state">
        <ui-icon
          name=${hasSearch ? "search-x" : "file-plus"}
          class="empty-icon"
        ></ui-icon>
        <h3 class="empty-title">
          ${hasSearch ? "No notes found" : "No notes in this folder"}
        </h3>
        <p class="empty-description">
          ${hasSearch
            ? "Try a different search term or clear the search."
            : "Create a new note to get started."}
        </p>
        ${when(
          !hasSearch,
          () => html`
            <ui-button variant="secondary" @click=${() => this.handleNewNote()}>
              <ui-icon name="plus" slot="icon-left"></ui-icon>
              Create Note
            </ui-button>
          `,
        )}
      </div>
    `;
  }
}

customElements.define("notention-notes-list", NotesList);
