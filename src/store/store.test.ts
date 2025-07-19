import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "./index";
import {
  Note,
  OntologyTree,
  UserProfile,
} from "../../shared/types";

const initialNotes: Record<string, Note> = {};
const initialOntology: OntologyTree = {
  nodes: {},
  rootIds: [],
  updatedAt: new Date(),
};
const initialUserProfile: UserProfile = {
  nostrPubkey: "",
  sharedTags: [],
  preferences: { theme: "light", aiEnabled: false, defaultNoteStatus: "draft" },
  nostrRelays: ["wss://relay.example.com"],
  privacySettings: {
    sharePublicNotesGlobally: false,
    shareTagsWithPublicNotes: true,
    shareValuesWithPublicNotes: true,
    shareEmbeddingsWithPublicNotes: false,
  },
};

describe("App Store", () => {
  const baseInitialState = {
    notes: initialNotes,
    ontology: initialOntology,
    userProfile: initialUserProfile,
    folders: {},
    templates: {},
    currentNoteId: undefined,
    sidebarTab: "notes" as const,
    searchQuery: "",
    searchFilters: {},
    matches: [],
    directMessages: [],
    embeddingMatches: [],
    nostrRelays: ["wss://relay.example.com"],
    nostrConnected: false,
    activeNostrSubscriptions: {},
    activeTopicSubscriptions: {},
    topicNotes: {},
    editorContent: "",
    isEditing: false,
    loading: { notes: false, ontology: false, network: false, sync: false },
    errors: { sync: undefined },
    lastSyncTimestamp: undefined,
  };

  beforeEach(() => {
    useStore.setState(JSON.parse(JSON.stringify(baseInitialState)));
    vi.clearAllMocks();
  });

  it("should set the sidebar tab", () => {
    const { setSidebarTab } = useStore.getState();
    setSidebarTab("ontology");
    expect(useStore.getState().sidebarTab).toBe("ontology");
  });

  it("should toggle the sidebar", () => {
    const { toggleSidebar } = useStore.getState();
    const initialCollapsed = useStore.getState().sidebarCollapsed;
    toggleSidebar();
    expect(useStore.getState().sidebarCollapsed).toBe(!initialCollapsed);
  });

  it("should set the current note", () => {
    const { setCurrentNote } = useStore.getState();
    const noteId = "note1";
    useStore.setState({
      notes: {
        [noteId]: {
          id: noteId,
          title: "Test Note",
          content: "Test content",
          tags: [],
          values: {},
          fields: {},
          status: "draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });
    setCurrentNote(noteId);
    expect(useStore.getState().currentNoteId).toBe(noteId);
    expect(useStore.getState().editorContent).toBe("Test content");
  });
});
