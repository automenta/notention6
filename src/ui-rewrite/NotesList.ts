// src/ui-rewrite/NotesList.ts
import { useAppStore } from '../store';
import { createButton } from './Button';

export function createNotesList(): HTMLElement {
  const { notes, createNote, deleteNote, setCurrentNote } = useAppStore.getState();
  
  const container = document.createElement("div");
  container.className = "notes-list-container";

  const header = document.createElement('div');
  header.className = 'notes-list-header';
  
  const title = document.createElement('h2');
  title.textContent = 'Notes';
  
  const createNoteButton = createButton({
    label: 'New Note',
    onClick: () => createNote(),
    className: 'btn-primary'
  });

  header.appendChild(title);
  header.appendChild(createNoteButton);

  const list = document.createElement("div");
  list.className = "notes-list";

  const notesArray = Object.values(notes);

  if (notesArray.length === 0) {
    list.innerHTML = "<p>No notes yet. Create one!</p>";
  } else {
    const ul = document.createElement("ul");
    notesArray.forEach(note => {
      const li = document.createElement("li");
      li.className = 'note-item';
      li.innerHTML = `
        <div class="note-item-content">
          <h3>${note.title}</h3>
          <p>${note.content.substring(0, 100)}...</p>
        </div>
      `;
      li.onclick = () => setCurrentNote(note.id);

      const deleteButton = createButton({
        label: 'Delete',
        onClick: async (e) => {
          e.stopPropagation(); // prevent li.onclick from firing
          if (confirm('Are you sure you want to delete this note?')) {
            await deleteNote(note.id);
          }
        },
        className: 'btn-danger btn-sm'
      });

      li.appendChild(deleteButton);
      ul.appendChild(li);
    });
    list.appendChild(ul);
  }
  
  container.appendChild(header);
  container.appendChild(list);

  return container;
}
