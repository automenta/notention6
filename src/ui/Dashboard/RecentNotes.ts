import { useAppStore } from "../../store";
import { Note } from "../../../shared/types";

export function createRecentNotes(): HTMLElement {
  const { notes, setCurrentNote } = useAppStore.getState();
  const notesArray = Object.values(notes);

  const container = document.createElement("div");
  container.className = "dashboard-recent-notes";

  const title = document.createElement("h3");
  title.textContent = "Recent Notes";
  container.appendChild(title);

  const list = document.createElement("ul");
  const recentNotes = notesArray
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  if (recentNotes.length > 0) {
    recentNotes.forEach((note) => {
      const li = document.createElement("li");
      li.className = "recent-note-item";
      li.textContent = note.title || "Untitled Note";
      li.onclick = () => setCurrentNote(note.id);
      list.appendChild(li);
    });
  } else {
    list.innerHTML = "<p>No recent notes.</p>";
  }

  container.appendChild(list);
  return container;
}
