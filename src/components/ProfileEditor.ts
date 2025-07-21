
import { useAppStore } from '../store';
import './NoteEditor';

class ProfileEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const { userProfile, notes } = useAppStore.getState();

        if (!userProfile || !userProfile.profileNoteId) {
            this.shadowRoot.innerHTML = 'User profile not found.';
            return;
        }

        const profileNote = notes[userProfile.profileNoteId];

        if (!profileNote) {
            this.shadowRoot.innerHTML = 'Profile note not found.';
            return;
        }

        const noteEditor = document.createElement('note-editor');
        noteEditor.setAttribute('note-id', profileNote.id);

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(noteEditor);
    }
}

customElements.define('profile-editor', ProfileEditor);
