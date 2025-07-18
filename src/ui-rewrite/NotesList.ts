// src/ui-rewrite/NotesList.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import './NotesList.css';
import { Note } from '../../shared/types';

export function createNotesList(): HTMLElement {
  const { notes, searchQuery, setSearchQuery, setCurrentNote, noteView, setNoteView } = useAppStore.getState();
  let notesArray: Note[] = Object.values(notes);

  const container = document.createElement('div');
  container.className = 'notes-list-container';

  // Header
  const header = document.createElement('header');
  header.className = 'notes-list-header';
  const title = document.createElement('h1');
  title.textContent = 'Notes';
  header.appendChild(title);
  container.appendChild(header);

  // Search and Filter
  const searchFilterContainer = document.createElement('div');
  searchFilterContainer.className = 'search-filter-container';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search notes...';
  searchInput.value = searchQuery;
  searchInput.oninput = (e) => {
    setSearchQuery((e.target as HTMLInputElement).value);
  };
  searchFilterContainer.appendChild(searchInput);

  const viewSwitcher = document.createElement('div');
  viewSwitcher.className = 'view-switcher';

  const allButton = createButton({
    label: 'All',
    onClick: () => setNoteView('all'),
    variant: noteView === 'all' ? 'primary' : 'secondary'
  });
  viewSwitcher.appendChild(allButton);

  const favoritesButton = createButton({
    label: 'Favorites',
    onClick: () => setNoteView('favorites'),
    variant: noteView === 'favorites' ? 'primary' : 'secondary'
  });
  viewSwitcher.appendChild(favoritesButton);

  const archivedButton = createButton({
    label: 'Archived',
    onClick: () => setNoteView('archived'),
    variant: noteView === 'archived' ? 'primary' : 'secondary'
  });
  viewSwitcher.appendChild(archivedButton);

  searchFilterContainer.appendChild(viewSwitcher);
  container.appendChild(searchFilterContainer);

  // Notes List
  const list = document.createElement('ul');
  list.className = 'notes-list';

  if (noteView === 'favorites') {
    notesArray = notesArray.filter(note => note.pinned);
  } else if (noteView === 'archived') {
    notesArray = notesArray.filter(note => note.archived);
  }

  const filteredNotes = notesArray.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredNotes.length > 0) {
    filteredNotes.forEach(note => {
      const listItem = document.createElement('li');
      listItem.className = 'note-item';
      listItem.onclick = () => setCurrentNote(note.id);

      const noteTitle = document.createElement('h3');
      noteTitle.textContent = note.title || 'Untitled Note';
      listItem.appendChild(noteTitle);

      const noteExcerpt = document.createElement('p');
      noteExcerpt.innerHTML = note.content.substring(0, 100) + '...';
      listItem.appendChild(noteExcerpt);

      const noteDate = document.createElement('span');
      noteDate.className = 'note-date';
      noteDate.textContent = new Date(note.updatedAt).toLocaleDateString();
      listItem.appendChild(noteDate);

      list.appendChild(listItem);
    });
  } else {
    const noNotesMessage = document.createElement('p');
    noNotesMessage.textContent = 'No notes found.';
    list.appendChild(noNotesMessage);
  }

  container.appendChild(list);

  return container;
}
