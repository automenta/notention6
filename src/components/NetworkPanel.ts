
import { useAppStore } from '../store';
import { createButton } from '../ui/Button';
import '../ui/NetworkPanel.css';
import { Note } from '../../shared/types';
import { nostrService } from '../services/NostrService';

class NetworkPanel extends HTMLElement {
    private isSubscribed: boolean = false;
    private publicFeedNotes: Note[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        useAppStore.subscribe(() => this.render());
    }

    connectedCallback() {
        this.render();
        this.subscribeToNostr();
    }

    subscribeToNostr() {
        if (this.isSubscribed) return;
        this.isSubscribed = true;

        const { addMatch, ontology, notes, addNotification } = useAppStore.getState();
        const allNotes = Object.values(notes);

        nostrService.subscribeToEvents([{ kinds: [1], limit: 20 }], (event) => {
            const note: Note = {
                id: event.id,
                title: event.tags.find((t) => t[0] === 'title')?.[1] || 'Untitled',
                content: event.content,
                createdAt: new Date(event.created_at * 1000),
                updatedAt: new Date(event.created_at * 1000),
                status: 'published',
                tags: event.tags.filter((t) => t[0] === 't').map((t) => `#${t[1]}`),
                values: {},
                fields: {},
                pinned: false,
                archived: false,
            };
            this.publicFeedNotes = [...this.publicFeedNotes, note];
            this.render();
        });

        nostrService.findMatchingNotes(
            ontology,
            (localNote, remoteNote, similarity) => {
                addMatch({
                    localNoteId: localNote.id,
                    targetNoteId: remoteNote.id,
                    similarity,
                });
            },
            allNotes,
        );
    }

    render() {
        if (!this.shadowRoot) return;

        const {
            matches,
            nostrRelays,
            addNostrRelay,
            removeNostrRelay,
            topicNotes,
            subscribeToTopic,
        } = useAppStore.getState();

        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'src/ui/NetworkPanel.css');

        const container = document.createElement('div');
        container.className = 'network-panel-container';

        // ... (Full rendering logic for all sections will go here)

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(container);
    }
}

customElements.define('network-panel', NetworkPanel);
