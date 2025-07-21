import '../components/Sidebar';

export function createSidebar(currentView: AppView): HTMLElement {
    const sidebar = document.createElement('app-sidebar');
    sidebar.setAttribute('current-view', currentView);
    return sidebar;
}
