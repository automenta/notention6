
import { useAppStore } from '../store';
import { createButton } from '../ui/Button';
import '../ui/FolderView.css';
import { Folder } from '../../shared/types';
import { FolderService } from '../services/FolderService';

class FolderView extends HTMLElement {
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

        const { folders, createFolder } = useAppStore.getState();

        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'src/ui/FolderView.css');

        const container = document.createElement('div');
        container.className = 'folder-view-container';

        const header = document.createElement('header');
        header.className = 'folder-view-header';
        const title = document.createElement('h1');
        title.textContent = 'Folders';
        header.appendChild(title);
        container.appendChild(header);

        const folderList = document.createElement('ul');
        folderList.className = 'folder-list';

        const folderTree = FolderService.buildFolderTree(Object.values(folders));

        folderTree.forEach((folder) => {
            folderList.appendChild(this.renderFolder(folder, folders));
        });

        container.appendChild(folderList);

        const newFolderButton = createButton({
            label: 'New Folder',
            onClick: () => {
                const folderName = prompt('Enter folder name:');
                if (folderName) {
                    createFolder(folderName);
                }
            },
            variant: 'primary',
        });
        container.appendChild(newFolderButton);

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(container);
    }

    renderFolder(folder: Folder, allFolders: { [id: string]: Folder }): HTMLElement {
        const { updateFolder, deleteFolder, getNotesByFolder, moveFolder } = useAppStore.getState();

        const listItem = document.createElement('li');
        listItem.className = 'folder-list-item';
        listItem.setAttribute('data-folder-id', folder.id);
        listItem.setAttribute('draggable', 'true');

        listItem.addEventListener('dragstart', (e) => {
            e.dataTransfer!.setData('text/plain', folder.id);
            e.dataTransfer!.effectAllowed = 'move';
        });

        listItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            listItem.classList.add('drag-over');
        });

        listItem.addEventListener('dragleave', () => {
            listItem.classList.remove('drag-over');
        });

        listItem.addEventListener('drop', (e) => {
            e.preventDefault();
            listItem.classList.remove('drag-over');
            const draggedFolderId = e.dataTransfer!.getData('text/plain');
            const targetFolderId = folder.id;
            if (draggedFolderId !== targetFolderId) {
                moveFolder(draggedFolderId, targetFolderId);
            }
        });

        const folderName = document.createElement('span');
        folderName.textContent = folder.name;
        listItem.appendChild(folderName);

        const noteCount = document.createElement('span');
        noteCount.className = 'note-count';
        const notesInFolder = getNotesByFolder ? getNotesByFolder(folder.id) : [];
        noteCount.textContent = `(${notesInFolder.length})`;
        listItem.appendChild(noteCount);

        const editButton = createButton({
            label: 'Edit',
            onClick: () => {
                const newName = prompt('Enter new folder name:', folder.name);
                if (newName) {
                    updateFolder(folder.id, { name: newName });
                }
            },
            variant: 'secondary',
        });
        listItem.appendChild(editButton);

        const deleteButton = createButton({
            label: 'Delete',
            onClick: () => {
                if (confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
                    deleteFolder(folder.id);
                }
            },
            variant: 'danger',
        });
        listItem.appendChild(deleteButton);

        if (folder.children && folder.children.length > 0) {
            const childList = document.createElement('ul');
            childList.className = 'folder-list';
            folder.children.forEach((childId) => {
                const childFolder = allFolders[childId];
                if (childFolder) {
                    childList.appendChild(this.renderFolder(childFolder, allFolders));
                }
            });
            listItem.appendChild(childList);
        }

        return listItem;
    }
}

customElements.define('folder-view', FolderView);
