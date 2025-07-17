import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIService } from "./AIService";

describe("AIService", () => {
  const defaultUserProfilePreferences = {
    aiEnabled: false,
    ollamaApiEndpoint: "",
    ollamaChatModel: "llama3",
    ollamaEmbeddingModel: "nomic-embed-text",
    geminiApiKey: "",
    geminiChatModel: "gemini-pro",
    geminiEmbeddingModel: "embedding-001",
    aiProviderPreference: "gemini" as "ollama" | "gemini",
  };

  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService(defaultUserProfilePreferences);
  });

  describe("AI Feature Methods", () => {
    it("should return suggestions when AI is enabled", async () => {
      aiService = new AIService({
        ...defaultUserProfilePreferences,
        aiEnabled: true,
      });
      const suggestions = await aiService.getOntologySuggestions({} as any);
      expect(suggestions).toEqual([{ label: "Suggestion" }]);
    });

    it("should return empty array for suggestions when AI is disabled", async () => {
      const suggestions = await aiService.getOntologySuggestions({} as any);
      expect(suggestions).toEqual([]);
    });

    it("should return tags when AI is enabled", async () => {
      aiService = new AIService({
        ...defaultUserProfilePreferences,
        aiEnabled: true,
      });
      const tags = await aiService.autoTag("content");
      expect(tags).toEqual(["#tag"]);
    });

    it("should return empty array for tags when AI is disabled", async () => {
      const tags = await aiService.autoTag("content");
      expect(tags).toEqual([]);
    });

    it("should return summary when AI is enabled", async () => {
      aiService = new AIService({
        ...defaultUserProfilePreferences,
        aiEnabled: true,
      });
      const summary = await aiService.summarize("content");
      expect(summary).toEqual("Summary");
    });

    it("should return empty string for summary when AI is disabled", async () => {
      const summary = await aiService.summarize("content");
      expect(summary).toEqual("");
    });
  });

  describe("getEmbeddingVector", () => {
    it("should return embedding vector when AI is enabled", async () => {
      aiService = new AIService({
        ...defaultUserProfilePreferences,
        aiEnabled: true,
      });
      const vector = await aiService.getEmbeddingVector("text");
      expect(vector).toEqual([0.1, 0.2, 0.3]);
    });

    it("should return empty array for embedding vector when AI is disabled", async () => {
      const vector = await aiService.getEmbeddingVector("text");
      expect(vector).toEqual([]);
    });
  });
});
