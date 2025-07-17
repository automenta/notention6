// src/ui-rewrite/Dashboard.ts
import { useAppStore } from '../store';
import { createButton } from './Button';

export function createDashboard(): HTMLElement {
  const { notes, contacts, createNote, setCurrentNote, setSidebarTab } = useAppStore.getState();
  const notesArray = Object.values(notes);
  const contactsArray = Object.values(contacts);

  const dashboard = document.createElement('div');
  dashboard.className = 'dashboard';

  // Header
  const header = document.createElement('header');
  header.className = 'dashboard-header';
  const title = document.createElement('h1');
  title.textContent = 'Dashboard';
  header.appendChild(title);
  dashboard.appendChild(header);

  // Stats
  const statsContainer = document.createElement('div');
  statsContainer.className = 'dashboard-stats';

  const totalNotesStat = document.createElement('div');
  totalNotesStat.className = 'stat-card';
  totalNotesStat.innerHTML = `
    <h3>Total Notes</h3>
    <p>${notesArray.length}</p>
  `;
  statsContainer.appendChild(totalNotesStat);

  // Placeholder for other stats
  const upcomingStat = document.createElement('div');
  upcomingStat.className = 'stat-card';
  upcomingStat.innerHTML = `
    <h3>Upcoming Events</h3>
    <p>0</p>
  `;
  statsContainer.appendChild(upcomingStat);

  const contactsStat = document.createElement('div');
  contactsStat.className = 'stat-card';
  contactsStat.innerHTML = `
    <h3>Contacts</h3>
    <p>${contactsArray.length}</p>
  `;
  statsContainer.appendChild(contactsStat);

  dashboard.appendChild(statsContainer);

  // Quick Actions
  const quickActions = document.createElement('div');
  quickActions.className = 'dashboard-quick-actions';

  const newNoteButton = createButton({
    label: 'New Note',
    onClick: () => {
      const newNote = createNote({ title: 'New Note', content: ''});
      setCurrentNote(newNote.id);
      setSidebarTab('notes');
    },
    variant: 'primary'
  });
  quickActions.appendChild(newNoteButton);

  dashboard.appendChild(quickActions);

  // Recent Notes
  const recentNotesContainer = document.createElement('div');
  recentNotesContainer.className = 'dashboard-recent-notes';

  const recentNotesTitle = document.createElement('h3');
  recentNotesTitle.textContent = 'Recent Notes';
  recentNotesContainer.appendChild(recentNotesTitle);

  const recentNotesList = document.createElement('ul');
  const recentNotes = notesArray
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (recentNotes.length > 0) {
    recentNotes.forEach(note => {
      const li = document.createElement('li');
      li.className = 'recent-note-item';
      li.textContent = note.title || 'Untitled Note';
      li.onclick = () => setCurrentNote(note.id);
      recentNotesList.appendChild(li);
    });
  } else {
    recentNotesList.innerHTML = '<p>No recent notes.</p>';
  }

  recentNotesContainer.appendChild(recentNotesList);
  dashboard.appendChild(recentNotesContainer);

  return dashboard;
}
