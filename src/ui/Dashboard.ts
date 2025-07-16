import { useAppStore } from "../store";
import { Note } from "../../shared/types";
import "./Card";

export class Dashboard extends HTMLElement {
  private unsubscribe: () => void = () => {};

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe(() => this.render());
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private getRecentNotes(): Note[] {
    const notes = Object.values(useAppStore.getState().notes);
    return notes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }

  private getUpcomingDeadlines(): Note[] {
    const notes = Object.values(useAppStore.getState().notes);
    const notesWithDeadlines = notes.filter(note => {
      const dueDate = this.getDueDate(note.content);
      return dueDate && dueDate > new Date();
    });
    return notesWithDeadlines.sort((a, b) => {
      const dateA = this.getDueDate(a.content) as Date;
      const dateB = this.getDueDate(b.content) as Date;
      return dateA.getTime() - dateB.getTime();
    }).slice(0, 5);
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  render() {
    if (!this.shadowRoot) return;

    const recentNotes = this.getRecentNotes();
    const upcomingDeadlines = this.getUpcomingDeadlines();

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="src/ui/styles/variables.css">
      <link rel="stylesheet" href="src/ui/Dashboard.css">

      <div class="dashboard-container">
        <h1 class="dashboard-title">Dashboard</h1>

        <div class="dashboard-grid">
          <ui-card>
            <h2 class="card-title">Recent Notes</h2>
            <ul class="note-list">
              ${recentNotes
                .map(
                  (note) => `
                <li class="note-item">
                  <a href="#" data-note-id="${note.id}">${note.title}</a>
                  <span class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
                </li>
              `,
                )
                .join("")}
            </ul>
          </ui-card>

          <ui-card>
            <h2 class="card-title">Upcoming Deadlines</h2>
            <ul class="note-list">
              ${upcomingDeadlines
                .map(
                  (note) => `
                <li class="note-item">
                  <a href="#" data-note-id="${note.id}">${note.title}</a>
                  <span class="note-date">${this.formatDate(this.getDueDate(note.content) as Date)}</span>
                </li>
              `,
                )
                .join("")}
            </ul>
          </ui-card>
        </div>
      </div>
    `;

    this.addEventListeners();
  }

  private addEventListeners() {
    this.shadowRoot?.querySelectorAll("a[data-note-id]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const noteId = (e.currentTarget as HTMLElement).dataset.noteId;
        if (noteId) {
          useAppStore.getState().setCurrentNoteId(noteId);
          useAppStore.getState().setSidebarTab("notes");
        }
      });
    });
  }
}

customElements.define("notention-dashboard", Dashboard);
