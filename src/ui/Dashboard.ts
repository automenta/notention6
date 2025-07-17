import { useAppStore } from "../store";
import { Note } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { when } from "lit-html/directives/when.js";
import { logger } from "../lib/utils";
import "./Card";

const log = logger("notention-dashboard");

export class Dashboard extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private recentNotes: Note[] = [];
  private upcomingDeadlines: Note[] = [];
  private isLoading = true;

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
        loading: state.loading,
      }),
      ({ notes, loading }) => {
        log(`State updated: ${notes.length} notes, loading=${loading}`);
        this.isLoading = loading;
        if (!loading) {
          this.processNotes(notes);
        }
        this.render();
      },
      { equalityFn: (a, b) => a.notes === b.notes && a.loading === b.loading },
    );
    // Initial load
    const initialState = useAppStore.getState();
    this.isLoading = initialState.loading;
    this.processNotes(Object.values(initialState.notes));
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
  }

  private processNotes(notes: Note[]) {
    log(`Processing ${notes.length} notes`);
    this.recentNotes = this.getRecentNotes(notes);
    this.upcomingDeadlines = this.getUpcomingDeadlines(notes);
    log(
      `Found ${this.recentNotes.length} recent notes and ${this.upcomingDeadlines.length} upcoming deadlines.`,
    );
  }

  private getRecentNotes(notes: Note[]): Note[] {
    return [...notes]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 5);
  }

  private getUpcomingDeadlines(notes: Note[]): Note[] {
    const now = new Date();
    const notesWithDeadlines = notes
      .map((note) => ({ note, dueDate: this.getDueDate(note.content) }))
      .filter(({ dueDate }) => dueDate && dueDate > now) as {
      note: Note;
      dueDate: Date;
    }[];

    return notesWithDeadlines
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .map(({ note }) => note)
      .slice(0, 5);
  }

  private getDueDate(content: string): Date | null {
    // More robust regex to find due dates
    const match = content.match(/(?:due|deadline)::(\d{4}-\d{2}-\d{2})/i);
    if (match && match[1]) {
      try {
        const date = new Date(match[1]);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        log.error("Error parsing due date:", e);
        return null;
      }
    }
    return null;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  private handleNoteClick(noteId: string) {
    log(`Note clicked: ${noteId}`);
    useAppStore.getState().setCurrentNoteId(noteId);
    useAppStore.getState().setSidebarTab("notes");
  }

  private renderNoteList(notes: Note[], emptyMessage: string, showDate = true) {
    return html`
      ${when(
        notes.length > 0,
        () => html`
          <ul class="note-list">
            ${repeat(
              notes,
              (note) => note.id,
              (note) => html`
                <li class="note-item">
                  <a
                    href="#"
                    @click=${(e: Event) => {
                      e.preventDefault();
                      this.handleNoteClick(note.id);
                    }}
                    >${note.title || "Untitled Note"}</a
                  >
                  ${when(
                    showDate,
                    () => html`
                      <span class="note-date">
                        ${this.formatDate(
                          this.getDueDate(note.content) ||
                            new Date(note.updatedAt),
                        )}
                      </span>
                    `,
                  )}
                </li>
              `,
            )}
          </ul>
        `,
        () => html`<p class="empty-message">${emptyMessage}</p>`,
      )}
    `;
  }

  render() {
    if (!this.shadowRoot) return;
    log("Rendering dashboard");

    const template = html`
      <link rel="stylesheet" href="src/ui/styles/variables.css" />
      <link rel="stylesheet" href="src/ui/Dashboard.css" />

      <div class="dashboard-container">
        <h1 class="dashboard-title">Dashboard</h1>

        ${when(
          this.isLoading,
          () => html`<div class="loading-indicator">Loading...</div>`,
          () => html`
            <div class="dashboard-grid">
              <ui-card>
                <h2 class="card-title">Recent Notes</h2>
                ${this.renderNoteList(
                  this.recentNotes,
                  "No recent notes found.",
                )}
              </ui-card>

              <ui-card>
                <h2 class="card-title">Upcoming Deadlines</h2>
                ${this.renderNoteList(
                  this.upcomingDeadlines,
                  "No upcoming deadlines.",
                )}
              </ui-card>
            </div>
          `,
        )}
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("notention-dashboard", Dashboard);
