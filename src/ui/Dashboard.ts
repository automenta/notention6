import { useAppStore } from "../store";
import { Note } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import "./Card";

export class Dashboard extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private recentNotes: Note[] = [];
  private upcomingDeadlines: Note[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        notes: Object.values(state.notes),
      }),
      ({ notes }) => {
        const recentNotes = this.getRecentNotes(notes);
        const upcomingDeadlines = this.getUpcomingDeadlines(notes);
        if (
          this.recentNotes !== recentNotes ||
          this.upcomingDeadlines !== upcomingDeadlines
        ) {
          this.recentNotes = recentNotes;
          this.upcomingDeadlines = upcomingDeadlines;
          this.render();
        }
      },
      { equalityFn: (a, b) => a.notes === b.notes }
    );
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private getRecentNotes(notes: Note[]): Note[] {
    return notes
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 5);
  }

  private getUpcomingDeadlines(notes: Note[]): Note[] {
    const notesWithDeadlines = notes.filter((note) => {
      const dueDate = this.getDueDate(note.content);
      return dueDate && dueDate > new Date();
    });
    return notesWithDeadlines
      .sort((a, b) => {
        const dateA = this.getDueDate(a.content) as Date;
        const dateB = this.getDueDate(b.content) as Date;
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  }

  private getDueDate(content: string): Date | null {
    const match = content.match(/due::(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return new Date(match[1]);
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
    useAppStore.getState().setCurrentNoteId(noteId);
    useAppStore.getState().setSidebarTab("notes");
  }

  render() {
    if (!this.shadowRoot) return;

    const template = html`
      <link rel="stylesheet" href="src/ui/styles/variables.css" />
      <link rel="stylesheet" href="src/ui/Dashboard.css" />

      <div class="dashboard-container">
        <h1 class="dashboard-title">Dashboard</h1>

        <div class="dashboard-grid">
          <ui-card>
            <h2 class="card-title">Recent Notes</h2>
            <ul class="note-list">
              ${repeat(
                this.recentNotes,
                (note) => note.id,
                (note) => html`
                  <li class="note-item">
                    <a
                      href="#"
                      @click=${(e: Event) => {
                        e.preventDefault();
                        this.handleNoteClick(note.id);
                      }}
                      >${note.title}</a
                    >
                    <span class="note-date"
                      >${new Date(
                        note.updatedAt,
                      ).toLocaleDateString()}</span
                    >
                  </li>
                `,
              )}
            </ul>
          </ui-card>

          <ui-card>
            <h2 class="card-title">Upcoming Deadlines</h2>
            <ul class="note-list">
              ${repeat(
                this.upcomingDeadlines,
                (note) => note.id,
                (note) => html`
                  <li class="note-item">
                    <a
                      href="#"
                      @click=${(e: Event) => {
                        e.preventDefault();
                        this.handleNoteClick(note.id);
                      }}
                      >${note.title}</a
                    >
                    <span class="note-date"
                      >${this.formatDate(
                        this.getDueDate(note.content) as Date,
                      )}</span
                    >
                  </li>
                `,
              )}
            </ul>
          </ui-card>
        </div>
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("notention-dashboard", Dashboard);
