import { useAppStore } from "../store";
import { Folder } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import "./Button";

export class FolderTree extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private folders: Folder[] = [];
  private currentFolderId: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe((state) => {
      const newFolders = Object.values(state.folders);
      const newCurrentFolderId = state.currentFolderId;
      if (
        this.folders !== newFolders ||
        this.currentFolderId !== newCurrentFolderId
      ) {
        this.folders = newFolders;
        this.currentFolderId = newCurrentFolderId;
        this.render();
      }
    });
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private handleCreateFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      useAppStore.getState().createFolder(folderName);
    }
  };

  private handleFolderClick = (folderId: string) => {
    useAppStore.getState().setCurrentFolderId(folderId);
  };

  private handleRenameFolder = (folderId: string, currentName: string) => {
    const newName = prompt("Enter new folder name:", currentName);
    if (newName && newName !== currentName) {
      useAppStore.getState().updateFolder(folderId, { name: newName });
    }
  };

  private handleDeleteFolder = (folderId: string) => {
    if (confirm("Are you sure you want to delete this folder?")) {
      useAppStore.getState().deleteFolder(folderId);
    }
  };

  render() {
    if (!this.shadowRoot) return;

    const template = html`
      <link rel="stylesheet" href="src/ui/FolderTree.css" />
      <div class="folder-tree-container">
        <div class="folder-tree-header">
          <h3 class="folder-tree-title">Folders</h3>
          <ui-button
            class="create-folder-button"
            variant="ghost"
            size="sm"
            @click=${this.handleCreateFolder}
          >
            +
          </ui-button>
        </div>
        <ul class="folder-list">
          ${repeat(
            this.folders,
            (folder) => folder.id,
            (folder) => html`
              <li
                class="folder-item ${this.currentFolderId === folder.id
                  ? "active"
                  : ""}"
                @click=${() => this.handleFolderClick(folder.id)}
              >
                <span class="folder-name">${folder.name}</span>
                <div class="folder-actions">
                  <button
                    class="edit-folder-button"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      this.handleRenameFolder(folder.id, folder.name);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    class="delete-folder-button"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      this.handleDeleteFolder(folder.id);
                    }}
                  >
                    Del
                  </button>
                </div>
              </li>
            `,
          )}
        </ul>
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("notention-folder-tree", FolderTree);
