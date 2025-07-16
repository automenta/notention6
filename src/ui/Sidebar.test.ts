import { screen, fireEvent, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { useAppStore } from "../store";
import { Note, Folder } from "../../shared/types";
import { NotentionApp } from "./NotentionApp";
import "./Sidebar";
import "./NotesList";

// Mock the Zustand store
vi.mock("../services/db", () => ({
  DBService: {
    getContacts: vi.fn().mockResolvedValue([]),
  },
}));

describe("Sidebar Component", () => {
  let app: NotentionApp;
  let sidebarElement: HTMLElement;
  let notesListElement: HTMLElement;

  beforeEach(async () => {
    // Reset mocks and state before each test
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

    app = new NotentionApp();
    document.body.innerHTML = "";
    document.body.appendChild(app);

    // Wait for components to render
    useAppStore.getState().setSidebarTab("notes");

    await waitFor(() => {
      sidebarElement = app.shadowRoot!.querySelector("notention-sidebar")!;
      notesListElement = app.shadowRoot!.querySelector("notention-notes-list")!;
      expect(sidebarElement).not.toBeNull();
      expect(notesListElement).not.toBeNull();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new note when "New Note" is clicked', async () => {
    const createNoteSpy = vi.spyOn(useAppStore.getState(), "createNote");

    await waitFor(() => {
      const newNoteButton =
        sidebarElement.shadowRoot!.querySelector(".new-note-button");
      expect(newNoteButton).not.toBeNull();
      fireEvent.click(newNoteButton!);
    });

    await waitFor(() => {
      expect(createNoteSpy).toHaveBeenCalled();
    });
  });

  it('should create a new folder when "Create New Folder" is clicked', async () => {
    const createFolderSpy = vi.spyOn(useAppStore.getState(), "createFolder");
    const folderName = "My New Folder";
    window.prompt = vi.fn(() => folderName);

    await waitFor(() => {
      const createFolderButton = sidebarElement.shadowRoot!.querySelector(
        ".create-folder-button",
      );
      expect(createFolderButton).not.toBeNull();
      fireEvent.click(createFolderButton!);
    });

    await waitFor(() => {
      expect(createFolderSpy).toHaveBeenCalledWith(folderName);
    });
  });

  it("should filter notes when a folder is clicked", async () => {
    const setSearchFilterSpy = vi.spyOn(
      useAppStore.getState(),
      "setSearchFilter",
    );
    const folderA: Folder = {
      id: "folder-A",
      name: "Folder A",
      noteIds: ["n1"],
      children: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (useAppStore.getState().folders as any)["folder-A"] = folderA;

    await useAppStore.getState().loadFolders();

    await waitFor(() => {
      const folderElement =
        sidebarElement.shadowRoot!.querySelector(".folder-item");
      expect(folderElement).not.toBeNull();
      fireEvent.click(folderElement!);
    });

    await waitFor(() => {
      expect(setSearchFilterSpy).toHaveBeenCalledWith("folderId", "folder-A");
    });
  });

  it("should rename a folder when the edit button is clicked", async () => {
    const updateFolderSpy = vi.spyOn(useAppStore.getState(), "updateFolder");
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
    (useAppStore.getState().folders as any)[folderId] = folder;
    window.prompt = vi.fn(() => newName);

    await useAppStore.getState().loadFolders();

    await waitFor(() => {
      const editButton = sidebarElement.shadowRoot!.querySelector(
        ".edit-folder-button",
      );
      expect(editButton).not.toBeNull();
      fireEvent.click(editButton!);
    });

    await waitFor(() => {
      expect(updateFolderSpy).toHaveBeenCalledWith(folderId, { name: newName });
    });
  });

  it("should delete a folder when the delete button is clicked", async () => {
    const deleteFolderSpy = vi.spyOn(useAppStore.getState(), "deleteFolder");
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
    (useAppStore.getState().folders as any)[folderId] = folder;
    window.confirm = vi.fn(() => true);

    await useAppStore.getState().loadFolders();

    await waitFor(() => {
      const deleteButton = sidebarElement.shadowRoot!.querySelector(
        ".delete-folder-button",
      );
      expect(deleteButton).not.toBeNull();
      fireEvent.click(deleteButton!);
    });

    await waitFor(() => {
      expect(deleteFolderSpy).toHaveBeenCalledWith(folderId);
    });
  });
});
