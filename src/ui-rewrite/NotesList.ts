// src/ui-rewrite/NotesList.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import { Note } from '../../shared/types';

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
    variant: 'primary'
  });

  header.appendChild(title);
  header.appendChild(createNoteButton);

  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'notes-list-controls';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search notes...';
  searchInput.className = 'search-input';

  const sortSelect = document.createElement('select');
  sortSelect.className = 'sort-select';
  const sortOptions = [
    { value: 'updatedAt-desc', label: 'Last Updated' },
    { value: 'createdAt-desc', label: 'Last Created' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
  ];
  sortOptions.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    sortSelect.appendChild(option);
  });

  controlsContainer.appendChild(searchInput);
  controlsContainer.appendChild(sortSelect);

  const listContainer = document.createElement("div");
  listContainer.className = "notes-list";

  const renderNotes = (notesToRender: Note[]) => {
    listContainer.innerHTML = ''; // Clear previous list
    if (notesToRender.length === 0) {
      listContainer.innerHTML = "<p>No notes found.</p>";
    } else {
      const ul = document.createElement("ul");
      notesToRender.forEach(note => {
        const li = document.createElement("li");
        li.className = 'note-item';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'note-item-content';
        contentDiv.innerHTML = `
          <h3>${note.title || 'Untitled Note'}</h3>
          <p>${note.content.substring(0, 100)}...</p>
        `;
        contentDiv.onclick = () => setCurrentNote(note.id);

        const deleteButton = createButton({
          label: 'Delete',
          onClick: async (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this note?')) {
              await deleteNote(note.id);
            }
          },
          variant: 'danger',
          size: 'sm'
        });

        li.appendChild(contentDiv);
        li.appendChild(deleteButton);
        ul.appendChild(li);
      });
      listContainer.appendChild(ul);
    }
  };

  const applyFiltersAndSorting = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const [sortBy, sortOrder] = sortSelect.value.split('-');

    let filteredNotes = Object.values(notes).filter(note =>
      (note.title?.toLowerCase() || '').includes(searchTerm) ||
      (note.content?.toLowerCase() || '').includes(searchTerm)
    );

    filteredNotes.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'title') {
        valA = a.title || '';
        valB = b.title || '';
      } else { // createdAt or updatedAt
        valA = new Date(a[sortBy]).getTime();
        valB = new Date(b[sortBy]).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    renderNotes(filteredNotes);
  };

  searchInput.addEventListener('input', applyFiltersAndSorting);
  sortSelect.addEventListener('change', applyFiltersAndSorting);
  
  container.appendChild(header);
  container.appendChild(controlsContainer);
  container.appendChild(listContainer);

  // Initial render
  renderNotes(Object.values(notes));

  return container;
}
