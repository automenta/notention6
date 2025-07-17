import { screen, fireEvent, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { useAppStore } from "../store";
import { Note, Folder } from "../../shared/types";
import { NotentionApp } from "./NotentionApp";
import "./FolderTree";

// Mock the Zustand store
vi.mock("../services/db", () => ({
  DBService: {
    getContacts: vi.fn().mockResolvedValue([]),
  },
}));

const setupTest = async () => {
  vi.clearAllMocks();

  const mockNotes: { [id: string]: Note } = {};
  const mockFolders: { [id: string]: Folder } = {};
  const mockStore = {
    notes: mockNotes,
    folders: mockFolders,
    searchFilters: { folderId: undefined },
    sidebarTab: "notes",
    initializeApp: vi.fn(),
    setCurrentNoteId: vi.fn(),
    setSidebarTab: vi.fn(),
    setCurrentNote: vi.fn(),
    createNote: vi.fn(async (noteData) => {
      const newNote = {
        id: `note-${Object.keys(mockNotes).length + 1}`,
        ...noteData,
      };
      mockNotes[newNote.id] = newNote as Note;
      return newNote;
    }),
    loadNotes: vi.fn(),
    loadFolders: vi.fn(),
    setSearchFilter: vi.fn(),
    createFolder: vi.fn(async (name, parentId) => {
      const newFolder = {
        id: `folder-${Object.keys(mockFolders).length + 1}`,
        name,
        parentId,
        noteIds: [],
        children: [],
      };
      mockFolders[newFolder.id] = newFolder as Folder;
      return newFolder.id;
    }),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
  };

  vi.spyOn(useAppStore, "getState").mockReturnValue(mockStore);
  vi.spyOn(useAppStore, "subscribe").mockImplementation(() => () => {});

  const app = new NotentionApp();
  document.body.innerHTML = "";
  document.body.appendChild(app);

  useAppStore.getState().setSidebarTab("notes");

  await waitFor(() => {
    const folderTreeElement = app.shadowRoot!.querySelector(
      "notention-folder-tree",
    );
    expect(folderTreeElement).not.toBeNull();
  });

  return { app, mockStore };
};

describe("FolderTree Component", () => {
  it('should create a new folder when "Create New Folder" is clicked', async () => {
    const { app, mockStore } = await setupTest();
    const createFolderSpy = vi.spyOn(mockStore, "createFolder");
    const folderName = "My New Folder";
    window.prompt = vi.fn(() => folderName);

    const folderTreeElement = app.shadowRoot!.querySelector(
      "notention-folder-tree",
    )!;
    await (folderTreeElement as any).updateComplete;

    const createFolderButton = folderTreeElement.shadowRoot!.querySelector(
      "notention-button.create-folder-button",
    );
    expect(createFolderButton).not.toBeNull();
    fireEvent.click(createFolderButton!);

    await waitFor(() => {
      expect(createFolderSpy).toHaveBeenCalledWith(folderName);
    });
  });

  it("should filter notes when a folder is clicked", async () => {
    const { app, mockStore } = await setupTest();
    const setSearchFilterSpy = vi.spyOn(mockStore, "setSearchFilter");
    const folderA: Folder = {
      id: "folder-A",
      name: "Folder A",
      noteIds: ["n1"],
      children: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockStore.folders as any)["folder-A"] = folderA;

    await mockStore.loadFolders();

    const folderTreeElement = app.shadowRoot!.querySelector(
      "notention-folder-tree",
    )!;
    await (folderTreeElement as any).updateComplete;

    const folderElement =
      folderTreeElement.shadowRoot!.querySelector(".folder-item");
    expect(folderElement).not.toBeNull();
    fireEvent.click(folderElement!);

    await waitFor(() => {
      expect(setSearchFilterSpy).toHaveBeenCalledWith("folderId", "folder-A");
    });
  });

  it("should rename a folder when the edit button is clicked", async () => {
    const { app, mockStore } = await setupTest();
    const updateFolderSpy = vi.spyOn(mockStore, "updateFolder");
    const folderId = "folder-to-edit";
    const originalName = "Old Folder Name";
    const newName = "New Folder Name";
    const folder: Folder = {
      id: folderId,
      name: originalName,
      noteIds: [],
      children: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockStore.folders as any)[folderId] = folder;
    window.prompt = vi.fn(() => newName);

    await mockStore.loadFolders();

    const folderTreeElement = app.shadowRoot!.querySelector(
      "notention-folder-tree",
    )!;
    await (folderTreeElement as any).updateComplete;

    const folderItem = folderTreeElement.shadowRoot!.querySelector(
      `[data-folder-id="${folderId}"]`,
    );
    const editButton = folderItem!.querySelector(".edit-folder-button");
    expect(editButton).not.toBeNull();
    fireEvent.click(editButton!);

    await waitFor(() => {
      expect(updateFolderSpy).toHaveBeenCalledWith(folderId, { name: newName });
    });
  });

  it("should delete a folder when the delete button is clicked", async () => {
    const { app, mockStore } = await setupTest();
    const deleteFolderSpy = vi.spyOn(mockStore, "deleteFolder");
    const folderId = "folder-to-delete";
    const folderName = "Folder to Delete";
    const folder: Folder = {
      id: folderId,
      name: folderName,
      noteIds: [],
      children: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockStore.folders as any)[folderId] = folder;
    window.confirm = vi.fn(() => true);

    await mockStore.loadFolders();

    const folderTreeElement = app.shadowRoot!.querySelector(
      "notention-folder-tree",
    )!;
    await (folderTreeElement as any).updateComplete;

    const folderItem = folderTreeElement.shadowRoot!.querySelector(
      `[data-folder-id="${folderId}"]`,
    );
    const deleteButton = folderItem!.querySelector(".delete-folder-button");
    expect(deleteButton).not.toBeNull();
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(deleteFolderSpy).toHaveBeenCalledWith(folderId);
    });
  });
});
