import { describe, it, expect, vi, beforeEach } from "vitest";
import { NoteService } from "./NoteService";
import { DBService } from "./db";
import { OntologyService } from "./ontology";
import { aiService } from "./AIService";
import { useAppStore } from "../store";
import {
  Note,
  OntologyTree,
  SearchFilters,
  UserProfile,
} from "../../shared/types";

vi.mock("./db", () => ({
  DBService: {
    getAllNotes: vi.fn(),
    getNote: vi.fn(),
    saveNote: vi.fn(),
    deleteNote: vi.fn(),
  },
}));

vi.mock("./ontology", () => ({
  OntologyService: {
    getSemanticMatches: vi.fn(),
  },
}));

vi.mock("./AIService", () => ({
  aiService: {
    isAIEnabled: vi.fn(),
    getEmbeddingVector: vi.fn(),
  },
}));

const mockUserProfile: UserProfile = {
  nostrPubkey: "test-pubkey",
  sharedTags: [],
  preferences: {
    theme: "light",
    aiEnabled: true,
    defaultNoteStatus: "draft",
    ollamaApiEndpoint: "http://localhost:11434",
    geminiApiKey: "test-gemini-key",
  },
  nostrRelays: [],
  privacySettings: {
    sharePublicNotesGlobally: false,
    shareTagsWithPublicNotes: true,
    shareValuesWithPublicNotes: true,
  },
};

vi.mock("../store", () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      userProfile: mockUserProfile,
    })),
  },
}));

describe("NoteService", () => {
  const mockNotes: Note[] = [
    {
      id: "1",
      title: "AI Note",
      content: "About artificial intelligence",
      tags: ["#AI", "#Tech"],
      values: {},
      fields: {},
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      title: "NLP Project",
      content: "Natural Language Processing task",
      tags: ["#NLP", "#Project"],
      values: { priority: "high" },
      fields: {},
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockOntology: OntologyTree = {
    nodes: {
      ai: { id: "ai", label: "#AI", children: ["nlp"] },
      nlp: { id: "nlp", label: "#NLP", parentId: "ai" },
    },
    rootIds: ["ai"],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (DBService.getAllNotes as vi.Mock).mockResolvedValue([...mockNotes]);
    (DBService.getNote as vi.Mock).mockImplementation(
      async (id: string) => mockNotes.find((n) => n.id === id) || null,
    );
    (OntologyService.getSemanticMatches as vi.Mock).mockImplementation(
      (ontology, tag) => (tag === "#AI" ? ["#AI", "#NLP"] : [tag]),
    );
    (aiService.isAIEnabled as vi.Mock).mockReturnValue(true);
    (aiService.getEmbeddingVector as vi.Mock).mockResolvedValue([
      0.1, 0.2, 0.3,
    ]);
    (useAppStore.getState as vi.Mock).mockReturnValue({
      userProfile: {
        ...mockUserProfile,
        preferences: { ...mockUserProfile.preferences, aiEnabled: true },
      },
    });
  });

  describe("semanticSearch", () => {
    it("should filter by text query in title or content", async () => {
      const results = await NoteService.semanticSearch(
        "artificial",
        mockOntology,
        {},
        mockNotes,
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });
  });

  describe("CRUD operations", () => {
    it("createNote should save a new note with defaults and generate embedding", async () => {
      const partialNote: Partial<Note> = { title: "New Test Note" };
      await NoteService.createNote(partialNote);

      expect(DBService.saveNote).toHaveBeenCalled();
      const savedArg = (DBService.saveNote as vi.Mock).mock.calls[0][0] as Note;
      expect(savedArg.title).toBe("New Test Note");
      expect(savedArg.embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it("createNote should not generate embedding if AI is disabled", async () => {
      (useAppStore.getState as vi.Mock).mockReturnValue({
        userProfile: {
          ...mockUserProfile,
          preferences: { ...mockUserProfile.preferences, aiEnabled: false },
        },
      });

      const partialNote: Partial<Note> = { title: "No AI Note" };
      await NoteService.createNote(partialNote);

      expect(aiService.getEmbeddingVector).not.toHaveBeenCalled();
      const savedArg = (DBService.saveNote as vi.Mock).mock.calls[0][0] as Note;
      expect(savedArg.embedding).toBeUndefined();
    });
  });
});
