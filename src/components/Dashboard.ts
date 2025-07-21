
import { createQuickActions } from '../ui/Dashboard/QuickActions';
import { createStats } from '../ui/Dashboard/Stats';
import { createRecentNotes } from '../ui/Dashboard/RecentNotes';
import { createRecentActivity } from '../ui/Dashboard/RecentActivity';
import '../ui/Dashboard/Dashboard.css';

class AppDashboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'src/ui/Dashboard/Dashboard.css');

        const dashboard = document.createElement('div');
        dashboard.className = 'dashboard';

        // Header
        const header = document.createElement('header');
        header.className = 'dashboard-header';
        const title = document.createElement('h1');
        title.textContent = 'Dashboard';
        header.appendChild(title);
        dashboard.appendChild(header);

        // Quick Actions
        const quickActions = createQuickActions();
        dashboard.appendChild(quickActions);

        // Main Content Area
        const mainContent = document.createElement('div');
        mainContent.className = 'dashboard-main-content';

        // Left Column
        const leftColumn = document.createElement('div');
        leftColumn.className = 'dashboard-column';

        // Stats
        const statsContainer = createStats();
        leftColumn.appendChild(statsContainer);

        // Recent Notes
        const recentNotesContainer = createRecentNotes();
        leftColumn.appendChild(recentNotesContainer);

        // Right Column
        const rightColumn = document.createElement('div');
        rightColumn.className = 'dashboard-column';

        // Recent Activity
        const recentActivityContainer = createRecentActivity();
        rightColumn.appendChild(recentActivityContainer);

        mainContent.appendChild(leftColumn);
        mainContent.appendChild(rightColumn);
        dashboard.appendChild(mainContent);

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(dashboard);
    }
}

customElements.define('app-dashboard', AppDashboard);
