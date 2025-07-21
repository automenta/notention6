
import { useAppStore } from '../store';
import { createButton } from '../ui/Button';
import { AnimationSystem } from '../lib/AnimationSystem';
import '../ui/NotesList.css';
import { Note } from '../../shared/types';
import { NoteService } from '../services/NoteService';

class NotesList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        useAppStore.subscribe(() => this.render());
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const {
            notes,
            folders,
            createFolder,
            updateNote,
            searchQuery,
            setSearchQuery,
            setCurrentNote,
            noteView,
            setNoteView,
            searchFilters,
            setSearchFilters,
            ontology
        } = useAppStore.getState();

        let notesArray: Note[] = Object.values(notes);

        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'src/ui/NotesList.css');

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
        searchInput.placeholder = '🔍 Search notes...';
        searchInput.value = searchQuery;
        searchInput.oninput = (e) => {
            const query = (e.target as HTMLInputElement).value;
            setSearchQuery(query);
        };
        searchFilterContainer.appendChild(searchInput);

        const viewSwitcher = document.createElement('div');
        viewSwitcher.className = 'view-switcher';

        const allButton = createButton({
            label: '📄 All',
            onClick: () => setNoteView('all'),
            variant: noteView === 'all' ? 'primary' : 'secondary',
        });
        viewSwitcher.appendChild(allButton);

        const favoritesButton = createButton({
            label: '⭐ Favorites',
            onClick: () => setNoteView('favorites'),
            variant: noteView === 'favorites' ? 'primary' : 'secondary',
        });
        viewSwitcher.appendChild(favoritesButton);

        const archivedButton = createButton({
            label: 'Archived',
            onClick: () => setNoteView('archived'),
            variant: noteView === 'archived' ? 'primary' : 'secondary',
        });
        viewSwitcher.appendChild(archivedButton);

        searchFilterContainer.appendChild(viewSwitcher);
        container.appendChild(searchFilterContainer);

        const list = document.createElement('ul');
        list.className = 'notes-list';

        if (noteView === 'favorites') {
            notesArray = notesArray.filter((note) => note.pinned);
        } else if (noteView === 'archived') {
            notesArray = notesArray.filter((note) => note.archived);
        }

        let filteredNotes: Note[] = [];
        if (searchQuery.trim() || (searchFilters.tags && searchFilters.tags.length > 0)) {
            NoteService.semanticSearch(searchQuery, ontology, searchFilters, notesArray)
                .then(results => {
                    this.renderNotesList(list, results);
                })
                .catch(error => {
                    console.error('Semantic search failed, falling back to simple search:', error);
                    filteredNotes = notesArray.filter(
                        (note) =>
                            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            note.content.toLowerCase().includes(searchQuery.toLowerCase()),
                    );
                    this.renderNotesList(list, filteredNotes);
                });
            filteredNotes = notesArray.filter(
                (note) =>
                    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    note.content.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        } else {
            filteredNotes = notesArray;
        }

        this.renderNotesList(list, filteredNotes);

        container.appendChild(list);

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(container);
    }

    renderNotesList(listElement: HTMLElement, notes: Note[]) {
        listElement.innerHTML = '';
        if (notes.length > 0) {
            const noteElements: HTMLElement[] = [];
            notes.forEach((note) => {
                const listItem = document.createElement('li');
                listItem.className = 'note-item';
                listItem.onclick = () => {
                    useAppStore.getState().setCurrentNote(note.id);
                };

                const noteTitle = document.createElement('h3');
                noteTitle.textContent = note.title || '📝 Untitled Note';
                listItem.appendChild(noteTitle);

                const noteExcerpt = document.createElement('p');
                const plainContent = note.content.replace(/<[^>]*>/g, '');
                noteExcerpt.textContent = plainContent.substring(0, 100) + (plainContent.length > 100 ? '...' : '');
                listItem.appendChild(noteExcerpt);

                noteElements.push(listItem);
                listElement.appendChild(listItem);
            });
            AnimationSystem.staggeredEntrance(noteElements, 100);
        } else {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <div class="empty-state-icon">📝</div>
                <h3>No notes found</h3>
                <p>Create a new note or adjust your search terms.</p>
            `;
            listElement.appendChild(emptyState);
        }
    }
}

customElements.define('notes-list', NotesList);
