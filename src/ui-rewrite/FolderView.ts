// src/ui-rewrite/FolderView.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./FolderView.css";
import { Folder } from "../../shared/types";
import { FolderService } from "../services/FolderService";

function renderFolder(folder: Folder, allFolders: { [id: string]: Folder }): HTMLElement {
    const { updateFolder, deleteFolder, getNotesByFolder, setSelectedFolder } = useAppStore.getState();

    const listItem = document.createElement("li");
    listItem.className = "folder-list-item";
    listItem.setAttribute("data-folder-id", folder.id);

    const folderContent = document.createElement("div");
    folderContent.className = "folder-content";
    folderContent.addEventListener('click', () => {
        setSelectedFolder(folder.id);
    });

    const folderName = document.createElement("span");
    folderName.textContent = folder.name;
    folderContent.appendChild(folderName);

    const noteCount = document.createElement("span");
    noteCount.className = "note-count";
    const notesInFolder = getNotesByFolder ? getNotesByFolder(folder.id) : [];
    noteCount.textContent = `(${notesInFolder.length})`;
    folderContent.appendChild(noteCount);

    listItem.appendChild(folderContent);

    const controls = document.createElement("div");
    controls.className = "folder-controls";

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
    controls.appendChild(editButton);

    const deleteButton = createButton({
        label: "Delete",
        onClick: () => {
            if (confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
                deleteFolder(folder.id);
            }
        },
        variant: "danger",
    });
    controls.appendChild(deleteButton);

    listItem.appendChild(controls);

    const childNodes = (folder as any).childrenNodes;
    if (childNodes && childNodes.length > 0) {
        const childList = document.createElement("ul");
        childList.className = "folder-list-nested";
        childNodes.forEach((childFolder: Folder) => {
            childList.appendChild(renderFolder(childFolder, allFolders));
        });
        listItem.appendChild(childList);
    }

    return listItem;
}

export function createFolderView(): HTMLElement {
    const { folders, createFolder, setSelectedFolder } = useAppStore.getState();

    const container = document.createElement("div");
    container.className = "folder-view-container";

    const header = document.createElement("header");
    header.className = "folder-view-header";
    const title = document.createElement("h1");
    title.textContent = "Folders";
    header.appendChild(title);

    const allNotesButton = createButton({
        label: "All Notes",
        onClick: () => {
            setSelectedFolder(undefined);
        },
        variant: "secondary",
    });
    header.appendChild(allNotesButton);

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
