import { Note, OntologyTree, SearchFilters } from "../../shared/types";
import { DBService } from "./db";
import { OntologyService } from "./ontology";
import { useAppStore } from "../store"; // To access AI settings

export class NoteService {
  /**
   * Performs an enhanced search for notes, combining full-text search with structured filters.
   *
   * @param query - The main full-text search query (e.g., "meeting notes", "#AI").
   * @param ontology - The current ontology tree, used for semantic expansion of tags.
   * @param filters - Structured search filters (tags, values, fields, status, etc.).
   * @param allNotes - Optional: An array of all notes to search within. If not provided, fetches all notes from DB.
   * @returns A promise that resolves to an array of notes matching the criteria.
   */
  static async semanticSearch(
    query: string,
    ontology: OntologyTree,
    filters: SearchFilters = {},
    allNotes?: Note[],
  ): Promise<Note[]> {
    const sourceNotes = allNotes || (await DBService.getAllNotes());
    const trimmedQuery = query.trim();
    const normalizedQuery = trimmedQuery.toLowerCase();

    const { userProfile, getAIService } = useAppStore.getState();
    const aiService = getAIService();
    const aiEnabled = userProfile?.preferences.aiEnabled ?? false;
    const aiMatchingSensitivity =
      userProfile?.preferences.aiMatchingSensitivity ?? 0.7;

    let queryEmbedding: number[] | null = null;
    if (aiEnabled && trimmedQuery && aiService.isAIEnabled()) {
      try {
        queryEmbedding = await aiService.getEmbeddingVector(trimmedQuery);
      } catch (error) {
        console.error("Failed to generate query embedding:", error);
        queryEmbedding = null;
      }
    }

    const filterSemanticTagsSet = new Set<string>();
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((originalFilterTag) =>
        OntologyService.getSemanticMatches(ontology, originalFilterTag).forEach(
          (match) => filterSemanticTagsSet.add(match.toLowerCase()),
        ),
      );
    }

    const textSearchSemanticTagsSet = new Set<string>();
    if (normalizedQuery.startsWith("#") || normalizedQuery.startsWith("@")) {
      OntologyService.getSemanticMatches(ontology, trimmedQuery).forEach(
        (match) => textSearchSemanticTagsSet.add(match.toLowerCase()),
      );
    }

    const matchedNotes: Array<Note & { searchScore?: number }> = [];

    for (const note of sourceNotes) {
      let matchesFilters = true;
      // Apply structured filters first
      if (filters.status && note.status !== filters.status) {
        matchesFilters = false;
      }
      if (
        matchesFilters &&
        filters.folderId &&
        note.folderId !== filters.folderId
      ) {
        matchesFilters = false;
      }
      if (matchesFilters && filterSemanticTagsSet.size > 0) {
        if (
          !note.tags ||
          !note.tags.some((noteTag) =>
            filterSemanticTagsSet.has(noteTag.toLowerCase()),
          )
        ) {
          matchesFilters = false;
        }
      }
      if (matchesFilters && filters.values) {
        for (const [key, value] of Object.entries(filters.values)) {
          if (value === undefined || value === null || value === "") continue;
          const filterKeyLower = key.toLowerCase();
          const filterValueLower = value.toLowerCase();
          if (
            !note.values ||
            !Object.entries(note.values).some(
              ([noteValKey, noteVal]) =>
                noteValKey.toLowerCase() === filterKeyLower &&
                noteVal.toLowerCase().includes(filterValueLower),
            )
          ) {
            matchesFilters = false;
            break;
          }
        }
      }
      if (matchesFilters && filters.fields) {
        for (const [key, value] of Object.entries(filters.fields)) {
          if (value === undefined || value === null || value === "") continue;
          const filterKeyLower = key.toLowerCase();
          const filterValueLower = String(value).toLowerCase();
          if (
            !note.fields ||
            !Object.entries(note.fields).some(
              ([noteFieldKey, noteFieldValue]) =>
                noteFieldKey.toLowerCase() === filterKeyLower &&
                String(noteFieldValue).toLowerCase().includes(filterValueLower),
            )
          ) {
            matchesFilters = false;
            break;
          }
        }
      }

      if (!matchesFilters) {
        continue; // Skip to next note if it doesn't pass strict filters
      }

      // If no full-text query after passing structured filters, it's a match
      if (!normalizedQuery) {
        matchedNotes.push(note);
        continue;
      }

      let textMatchScore = 0;
      if (note.title.toLowerCase().includes(normalizedQuery))
        textMatchScore += 2; // Higher weight for title
      if (note.content.toLowerCase().includes(normalizedQuery))
        textMatchScore += 1;
      if (
        textSearchSemanticTagsSet.size > 0 &&
        note.tags &&
        note.tags.some((tag) =>
          textSearchSemanticTagsSet.has(tag.toLowerCase()),
        )
      ) {
        textMatchScore += 1.5; // Semantic tag match
      }
      if (
        note.values &&
        Object.entries(note.values).some(
          ([key, value]) =>
            key.toLowerCase().includes(normalizedQuery) ||
            value.toLowerCase().includes(normalizedQuery),
        )
      ) {
        textMatchScore += 0.5;
      }
      if (
        note.fields &&
        Object.entries(note.fields).some(
          ([key, value]) =>
            key.toLowerCase().includes(normalizedQuery) ||
            String(value).toLowerCase().includes(normalizedQuery),
        )
      ) {
        textMatchScore += 0.5;
      }

      let embeddingSimilarityScore = 0;
      if (queryEmbedding && note.embedding && note.embedding.length > 0) {
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          note.embedding,
        );
        if (similarity >= aiMatchingSensitivity) {
          embeddingSimilarityScore = similarity * 2; // Weight embedding similarity
        }
      }

      // Combine scores: A note is included if it has any text match OR a strong embedding match.
      // The score helps in ranking.
      const totalScore = textMatchScore + embeddingSimilarityScore;

      if (totalScore > 0) {
        // Check if note is already added to avoid duplicates if logic changes
        if (!matchedNotes.find((n) => n.id === note.id)) {
          matchedNotes.push({ ...note, searchScore: totalScore });
        }
      }
    }

    // Sort by score in descending order
    matchedNotes.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));

    // Remove searchScore before returning
    return matchedNotes.map(({ searchScore, ...note }) => note);
  }

  // Basic CRUD operations
  static async getNotes(): Promise<Note[]> {
    return DBService.getAllNotes();
  }

  static async getNote(id: string): Promise<Note | null> {
    return DBService.getNote(id);
  }

  static async saveNote(note: Note): Promise<void> {
    const now = new Date(); // Use Date object directly, as DBService might expect it or types.ts defines it
    const noteToSave: Note = {
      ...note,
      updatedAt: now,
      createdAt: note.createdAt || now, // Ensure createdAt is also Date
    };
    // Ensure all date fields are consistently Date objects or ISO strings based on types.ts
    // For now, assuming types.ts Note dates are Date objects. If they are strings, adjust here.
    await DBService.saveNote(noteToSave);
  }

  static async createNote(partialNote: Partial<Note>): Promise<Note> {
    const now = new Date();
    let newNote: Note = {
      id: `note-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`,
      title: "Untitled Note",
      content: "",
      tags: [],
      values: {},
      fields: {},
      status: "private",
      createdAt: now,
      updatedAt: now,
      pinned: false,
      archived: false,
      ...partialNote,
    };

    newNote = await this.generateAndSetEmbedding(newNote);
    await DBService.saveNote(newNote);
    return newNote;
  }

  static async updateNote(
    id: string,
    updates: Partial<Note>,
  ): Promise<Note | null> {
    const { userProfile } = useAppStore.getState();
    if (id === userProfile?.profileNoteId && Object.prototype.hasOwnProperty.call(updates, "tags")) {
      throw new Error("Cannot change the tags of a profile note.");
    }
    const note = await DBService.getNote(id);
    if (!note) return null;

    let updatedNote = { ...note, ...updates, updatedAt: new Date() };

    // Check if content or title changed to regenerate embedding
    const contentChanged =
      "content" in updates && updates.content !== note.content;
    const titleChanged = "title" in updates && updates.title !== note.title;

    if (contentChanged || titleChanged) {
      updatedNote = await this.generateAndSetEmbedding(updatedNote);
    }

    await DBService.saveNote(updatedNote);
    return updatedNote;
  }

  static async deleteNote(id: string): Promise<void> {
    const { userProfile } = useAppStore.getState();
    if (id === userProfile?.profileNoteId) {
      throw new Error("Cannot delete a profile note.");
    }
    await DBService.deleteNote(id);
  }

  /**
   * Finds notes similar to a given note based on embedding vectors.
   * @param targetNote - The note to find similar matches for.
   * @param allNotes - An array of all notes to search within.
   * @param similarityThreshold - The minimum cosine similarity score to consider a match.
   * @returns A promise that resolves to an array of matched notes, sorted by similarity.
   */
  static async findSimilarNotesByEmbedding(
    targetNote: Note,
    allNotes: Note[],
    similarityThreshold: number = 0.7, // Default threshold
  ): Promise<Array<{ note: Note; similarity: number }>> {
    if (!targetNote.embedding || targetNote.embedding.length === 0) {
      return []; // Cannot find similar notes if the target has no embedding
    }

    const { userProfile } = useAppStore.getState();
    if (!userProfile?.preferences.aiEnabled) {
      return []; // AI features must be enabled
    }

    const similarNotes: Array<{ note: Note; similarity: number }> = [];

    for (const note of allNotes) {
      if (
        note.id === targetNote.id ||
        !note.embedding ||
        note.embedding.length === 0
      ) {
        continue; // Skip self or notes without embeddings
      }

      const similarity = this.cosineSimilarity(
        targetNote.embedding,
        note.embedding,
      );

      if (similarity >= similarityThreshold) {
        similarNotes.push({ note, similarity });
      }
    }

    // Sort by similarity in descending order
    similarNotes.sort((a, b) => b.similarity - a.similarity);

    return similarNotes;
  }

  /**
   * Finds notes similar to a given note ID by fetching all notes and using embedding vectors.
   * @param targetNoteId - The ID of the note to find similar matches for.
   * @param similarityThreshold - The minimum cosine similarity score to consider a match.
   * @returns A promise that resolves to an array of matched notes, sorted by similarity.
   */
  static async getSimilarNotesGlobally(
    targetNoteId: string,
    similarityThreshold: number = 0.7,
  ): Promise<Array<{ note: Note; similarity: number }>> {
    const targetNote = await DBService.getNote(targetNoteId);
    if (
      !targetNote ||
      !targetNote.embedding ||
      targetNote.embedding.length === 0
    ) {
      console.warn(
        `Target note ${targetNoteId} not found or has no embedding.`,
      );
      return [];
    }

    const { userProfile } = useAppStore.getState();
    if (!userProfile?.preferences.aiEnabled) {
      console.warn(
        "AI features are not enabled. Cannot perform embedding-based similarity search.",
      );
      return [];
    }

    const allNotes = await DBService.getAllNotes();
    // Filter out the targetNote itself from the list of notes to compare against
    const otherNotes = allNotes.filter((note) => note.id !== targetNoteId);

    return this.findSimilarNotesByEmbedding(
      targetNote,
      otherNotes,
      similarityThreshold,
    );
  }

  /**
   * Calculates the cosine similarity between two vectors.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @returns The cosine similarity, or 0 if inputs are invalid.
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private static async generateAndSetEmbedding(note: Note): Promise<Note> {
    const { userProfile, getAIService } = useAppStore.getState();
    const aiService = getAIService();
    if (userProfile?.preferences.aiEnabled && aiService.isAIEnabled()) {
      // Combine title and content for a richer embedding
      const textToEmbed = `${note.title}\n${note.content}`;
      if (textToEmbed.trim()) {
        try {
          const embedding = await aiService.getEmbeddingVector(textToEmbed);
          if (embedding && embedding.length > 0) {
            return { ...note, embedding };
          }
        } catch (error) {
          console.error(
            `Failed to generate embedding for note ${note.id}:`,
            error,
          );
        }
      }
    }
    // Return note without embedding or with previous embedding if generation failed
    return { ...note, embedding: note.embedding || undefined };
  }
}
