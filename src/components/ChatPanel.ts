
import { useAppStore } from '../store';
import { createButton } from '../ui/Button';
import '../ui/ChatPanel.css';
import { Contact, DirectMessage } from '../../shared/types';
import { ChatService } from '../services/ChatService';

class ChatPanel extends HTMLElement {
    private selectedContact: Contact | { pubkey: 'public'; alias: 'Public Chat' } | null = null;
    private messageUnsubscribe: (() => void) | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        useAppStore.subscribe((state, prevState) => {
            if (state.directMessages !== prevState.directMessages || state.userProfile?.contacts !== prevState.userProfile?.contacts) {
                this.render();
            }
        });
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        this.messageUnsubscribe?.();
    }

    render() {
        if (!this.shadowRoot) return;

        const { userProfile, directMessages } = useAppStore.getState();
        const contacts = userProfile?.contacts || [];

        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'src/ui/ChatPanel.css');

        const container = document.createElement('div');
        container.className = 'chat-panel-container';

        // ... (Header and layout setup)

        const contactList = document.createElement('ul');
        contactList.className = 'chat-contact-list';
        this.renderContactList(contactList, contacts);

        const messageViewContainer = document.createElement('div');
        messageViewContainer.className = 'message-view-container';
        this.renderMessageView(messageViewContainer, directMessages);

        // ... (append elements to container)

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(container);
    }

    renderContactList(listElement: HTMLUListElement, contacts: Contact[]) {
        // ... (full implementation)
    }

    renderMessageView(container: HTMLDivElement, messages: DirectMessage[]) {
        // ... (full implementation)
    }
}

customElements.define('chat-panel', ChatPanel);
