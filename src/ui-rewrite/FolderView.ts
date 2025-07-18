// src/ui-rewrite/FolderView.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./FolderView.css";
import { Folder } from "../../shared/types";
import { FolderService } from "../services/FolderService";

function renderFolder(folder: Folder, allFolders: { [id: string]: Folder }): HTMLElement {
    const { updateFolder, deleteFolder, getNotesByFolder } = useAppStore.getState();

    const listItem = document.createElement("li");
    listItem.className = "folder-list-item";
    listItem.setAttribute("data-folder-id", folder.id);

    const folderName = document.createElement("span");
    folderName.textContent = folder.name;
    listItem.appendChild(folderName);

    const noteCount = document.createElement("span");
    noteCount.className = "note-count";
    const notesInFolder = getNotesByFolder ? getNotesByFolder(folder.id) : [];
    noteCount.textContent = `(${notesInFolder.length})`;
    listItem.appendChild(noteCount);

    const editButton = createButton({
        label: "Edit",
        onClick: () => {
            const newName = prompt("Enter new folder name:", folder.name);
            if (newName) {
                updateFolder(folder.id, { name: newName });
            }
        },
        variant: "secondary",
    });
    listItem.appendChild(editButton);

    const deleteButton = createButton({
        label: "Delete",
        onClick: () => {
            if (confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
                deleteFolder(folder.id);
            }
        },
        variant: "danger",
    });
    listItem.appendChild(deleteButton);

    if (folder.children && folder.children.length > 0) {
        const childList = document.createElement("ul");
        childList.className = "folder-list";
        folder.children.forEach(childId => {
            const childFolder = allFolders[childId];
            if (childFolder) {
                childList.appendChild(renderFolder(childFolder, allFolders));
            }
        });
        listItem.appendChild(childList);
    }

    return listItem;
}

export function createFolderView(): HTMLElement {
    const { folders, createFolder } = useAppStore.getState();

    const container = document.createElement("div");
    container.className = "folder-view-container";

    const header = document.createElement("header");
    header.className = "folder-view-header";
    const title = document.createElement("h1");
    title.textContent = "Folders";
    header.appendChild(title);
    container.appendChild(header);

    const folderList = document.createElement("ul");
    folderList.className = "folder-list";

    const folderTree = FolderService.buildFolderTree(Object.values(folders));

    folderTree.forEach((folder) => {
        folderList.appendChild(renderFolder(folder, folders));
    });

    container.appendChild(folderList);

    const newFolderButton = createButton({
        label: "New Folder",
        onClick: () => {
            const folderName = prompt("Enter folder name:");
            if (folderName) {
                createFolder(folderName);
            }
        },
        variant: "primary",
    });
    container.appendChild(newFolderButton);

    return container;
}
