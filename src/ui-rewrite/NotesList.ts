// src/ui-rewrite/NotesList.ts

interface Note {
  id: string;
  title: string;
  content: string;
}

export function createNotesList(options: {
  notes: Note[];
  onDelete: (noteId: string) => void;
}): HTMLElement {
  const list = document.createElement("div");
  list.className = "notes-list";

  if (options.notes.length === 0) {
    list.innerHTML = "<p>No notes yet.</p>";
    return list;
  }

  const ul = document.createElement("ul");
  options.notes.forEach(note => {
    const li = document.createElement("li");
    li.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content}</p>
    `;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "btn btn-secondary";
    deleteButton.addEventListener("click", () => {
      options.onDelete(note.id);
    });

    li.appendChild(deleteButton);
    ul.appendChild(li);
  });

  list.appendChild(ul);

  return list;
}
