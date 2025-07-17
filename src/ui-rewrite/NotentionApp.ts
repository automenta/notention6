// src/ui-rewrite/NotentionApp.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import { createSidebar } from './Sidebar';
import { createAccountWizard } from './AccountWizard';
import { createDashboard } from './Dashboard';
import { createNotesList } from './NotesList';
import { createOntologyEditor } from './OntologyEditor';
import { createNetworkPanel } from './NetworkPanel';
import { createContactsView } from './ContactsView';
import { createChatPanel } from './ChatPanel';
import { createSettings } from './Settings';

// A type guard to check if a profile exists and has a public key
function profileExists(profile: any): profile is { nostrPubkey: string } {
    return profile && typeof profile.nostrPubkey === 'string' && profile.nostrPubkey.length > 0;
}

export function renderApp(rootElement: HTMLElement) {
    // Initial render function
    const render = () => {
        const state = useAppStore.getState();
        const { userProfile, sidebarTab, sidebarCollapsed } = state;

        // Clear the root element
        rootElement.innerHTML = '';

        if (!profileExists(userProfile)) {
            // If no profile, show the wizard
            const wizard = createAccountWizard();
            rootElement.appendChild(wizard);
        } else {
            // If profile exists, show the main app
            const appContainer = document.createElement('div');
            appContainer.className = 'app-container';

            // Sidebar
            const sidebarContainer = document.createElement('aside');
            sidebarContainer.className = `sidebar-container ${sidebarCollapsed ? 'collapsed' : ''}`;
            const sidebar = createSidebar(sidebarTab);
            sidebarContainer.appendChild(sidebar);

            // Main Content
            const mainContainer = document.createElement('div');
            mainContainer.className = 'main-container';

            // Header
            const header = document.createElement('header');
            header.className = 'app-header';
            const toggleButton = createButton({
                label: '☰',
                onClick: () => {
                    // This is a temporary solution. A proper action should be created in the store.
                    useAppStore.setState({ sidebarCollapsed: !sidebarCollapsed });
                }
            });
            const title = document.createElement('h1');
            title.textContent = 'Notention';
            header.appendChild(toggleButton);
            header.appendChild(title);

            // Main View
            const mainViewContainer = document.createElement('main');
            mainViewContainer.className = 'main-content';
            
            let currentView: HTMLElement;
            switch (sidebarTab) {
                case 'dashboard':
                    currentView = createDashboard();
                    break;
                case 'notes':
                    currentView = createNotesList({ notes: [], onDelete: () => {} });
                    break;
                case 'ontology':
                    currentView = createOntologyEditor({ onSave: () => {} });
                    break;
                case 'network':
                    currentView = createNetworkPanel();
                    break;
                case 'contacts':
                    currentView = createContactsView();
                    break;
                case 'chats':
                    currentView = createChatPanel();
                    break;
                case 'settings':
                    currentView = createSettings();
                    break;
                default:
                    currentView = createDashboard();
            }
            mainViewContainer.appendChild(currentView);

            mainContainer.appendChild(header);
            mainContainer.appendChild(mainViewContainer);
            
            appContainer.appendChild(sidebarContainer);
            appContainer.appendChild(mainContainer);
            
            rootElement.appendChild(appContainer);
        }
    };

    // Subscribe to the store
    useAppStore.subscribe(render);

    // Initial call to initialize and render the app
    useAppStore.getState().initializeApp().then(() => {
        render();
    });
}
