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
});
