// src/ui-rewrite/FolderView.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./FolderView.css";
import { Folder } from "../../shared/types";

export function createFolderView(): HTMLElement {
    const { folders, createFolder, updateFolder, deleteFolder, getNotesByFolder } = useAppStore.getState();

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

    Object.values(folders).forEach((folder) => {
        const listItem = document.createElement("li");
        listItem.className = "folder-list-item";

        const folderName = document.createElement("span");
        folderName.textContent = folder.name;
        listItem.appendChild(folderName);

        const noteCount = document.createElement("span");
        noteCount.className = "note-count";
        const notesInFolder = getNotesByFolder(folder.id);
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

        folderList.appendChild(listItem);
    });

    container.appendChild(folderList);

    const newFolderButton = createButton({
        label: "New Folder",
        onClick: () => {
            const folderName = prompt("Enter folder name:");
            if (folderName) {
                createFolder({ name: folderName });
            }
        },
        variant: "primary",
    });
    container.appendChild(newFolderButton);

    return container;
}
