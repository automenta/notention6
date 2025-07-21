
import { useAppStore } from '../store';
import { createAccountWizard } from '../ui/AccountWizard';
import '../ui/NotentionApp.css';
import './Sidebar'; // Import sidebar to register the custom element
import './AppRouter';


function profileExists(profile: any): profile is { nostrPubkey: string } {
  return (
    profile &&
    typeof profile.nostrPubkey === 'string' &&
    profile.nostrPubkey.length > 0
  );
}

class NotentionApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    useAppStore.subscribe(() => this.render());
    useAppStore.getState().initializeApp().then(() => this.render());
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { userProfile, sidebarCollapsed } = useAppStore.getState();

    if (!this.shadowRoot) return;

    // Link to external stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'src/ui/NotentionApp.css');
    this.shadowRoot.innerHTML = ''; // Clear previous content
    this.shadowRoot.appendChild(linkElem);


    if (!profileExists(userProfile)) {
      const wizard = createAccountWizard();
      this.shadowRoot.appendChild(wizard);
    } else {
      const appContainer = document.createElement('div');
      appContainer.className = 'app-container';

      const sidebarContainer = document.createElement('aside');
      sidebarContainer.className = `sidebar-container ${
        sidebarCollapsed ? 'collapsed' : ''
      }`;
      const sidebar = document.createElement('app-sidebar');
      sidebarContainer.appendChild(sidebar);

      const mainContainer = document.createElement('main');
      mainContainer.className = 'main-container';
      const appRouter = document.createElement('app-router');
      mainContainer.appendChild(appRouter);

      appContainer.appendChild(sidebarContainer);
      appContainer.appendChild(mainContainer);

      this.shadowRoot.appendChild(appContainer);
    }
  }
}

customElements.define('notention-app', NotentionApp);
