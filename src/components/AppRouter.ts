
import { useAppStore } from '../store';
import './Dashboard';
import './NoteEditor';
import './NotesList';
import './ProfileEditor';
import './OntologyEditor';
import './NetworkPanel';
import './ContactsView';
import './ChatPanel';
import './Settings';
import './FolderView';
import { ComponentRegistry } from '../lib/ComponentRegistry';

class AppRouter extends HTMLElement {
    constructor() {
        super();
        useAppStore.subscribe(() => this.render());
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const { sidebarTab, currentNoteId } = useAppStore.getState();

        let currentView: HTMLElement | null = null;

        if (sidebarTab === 'notes' && currentNoteId) {
            currentView = document.createElement('note-editor');
            currentView.setAttribute('note-id', currentNoteId);
        } else {
            switch (sidebarTab) {
                case 'dashboard':
                    currentView = document.createElement('app-dashboard');
                    break;
                case 'notes':
                    currentView = document.createElement('notes-list');
                    break;
                case 'profile':
                    currentView = document.createElement('profile-editor');
                    break;
                case 'folders':
                    currentView = document.createElement('folder-view');
                    break;
                case 'ontology':
                    currentView = document.createElement('ontology-editor');
                    break;
                case 'network':
                    currentView = document.createElement('network-panel');
                    break;
                case 'contacts':
                    currentView = document.createElement('contacts-view');
                    break;
                case 'chats':
                    currentView = document.createElement('chat-panel');
                    break;
                case 'settings':
                    currentView = document.createElement('settings-view');
                    break;
                default:
                    currentView = document.createElement('app-dashboard');
            }
        }

        this.innerHTML = '';
        if (currentView) {
            this.appendChild(currentView);
        }
    }
}

customElements.define('app-router', AppRouter);
