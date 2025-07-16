import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIService, aiService, setupAiServiceStoreListener } from "./AIService";
import { useAppStore } from "../store";
import { Ollama } from "@langchain/community/llms/ollama";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { StringOutputParser } from "@langchain/core/output_parsers";

let capturedPromptMessages: any[] = [];
const mockStringOutputParserInstance = {
  parse: vi.fn((x) => x),
};
const mockChatPromptTemplateInstance = {
  pipe: vi.fn().mockReturnThis(),
  invoke: vi.fn(),
};

vi.mock("@langchain/community/llms/ollama");
vi.mock("@langchain/community/embeddings/ollama");
vi.mock("@langchain/google-genai");
vi.mock("@langchain/core/output_parsers", () => ({
  StringOutputParser: vi.fn(() => mockStringOutputParserInstance),
}));

vi.mock("@langchain/core/prompts", async () => {
  const actual = (await vi.importActual("@langchain/core/prompts")) as any;
  return {
    ...actual,
    ChatPromptTemplate: {
      ...actual.ChatPromptTemplate,
      fromMessages: vi.fn((messages) => {
        capturedPromptMessages = messages;
        mockChatPromptTemplateInstance.pipe.mockClear().mockReturnThis();
        mockChatPromptTemplateInstance.invoke.mockClear();
        return mockChatPromptTemplateInstance;
      }),
    },
  };
});

let mockStoreState: any;
let storeSubscribeCallback: ((state: any, prevState: any) => void) | null = null;

vi.mock("../store", () => ({
  useAppStore: {
    getState: vi.fn(() => mockStoreState),
    subscribe: vi.fn((callback) => {
      storeSubscribeCallback = callback;
      return () => {
        storeSubscribeCallback = null;
      };
    }),
  },
}));

const mockOllamaInstance = {
  pipe: vi.fn().mockReturnThis(),
  invoke: vi.fn(),
};
const mockOllamaEmbeddingsInstance = {
  embedQuery: vi.fn(),
};
const mockGeminiInstance = {
  pipe: vi.fn().mockReturnThis(),
  invoke: vi.fn(),
};
const mockGeminiEmbeddingsInstance = {
  embedQuery: vi.fn(),
};

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

  const setMockStoreUserProfile = (
    preferences: Partial<typeof defaultUserProfilePreferences>,
  ) => {
    mockStoreState = {
      userProfile: {
        preferences: { ...defaultUserProfilePreferences, ...preferences },
      },
    };
    aiService.preferences = mockStoreState.userProfile.preferences;
    aiService.reinitializeModels();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (Ollama as vi.Mock).mockImplementation(() => mockOllamaInstance);
    (OllamaEmbeddings as vi.Mock).mockImplementation(() => mockOllamaEmbeddingsInstance);
    (ChatGoogleGenerativeAI as vi.Mock).mockImplementation(() => mockGeminiInstance);
    (GoogleGenerativeAIEmbeddings as vi.Mock).mockImplementation(() => mockGeminiEmbeddingsInstance);
    (StringOutputParser as vi.Mock).mockImplementation(() => mockStringOutputParserInstance);

    vi.mocked(mockOllamaInstance.invoke).mockReset();
    vi.mocked(mockOllamaInstance.pipe).mockClear().mockReturnThis();
    vi.mocked(mockOllamaEmbeddingsInstance.embedQuery).mockReset();
    vi.mocked(mockGeminiInstance.invoke).mockReset();
    vi.mocked(mockGeminiInstance.pipe).mockClear().mockReturnThis();
    vi.mocked(mockGeminiEmbeddingsInstance.embedQuery).mockReset();
    vi.mocked(mockStringOutputParserInstance.parse).mockClear();

    capturedPromptMessages = [];
    setMockStoreUserProfile({ aiEnabled: false });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore();
    vi.mocked(console.warn).mockRestore();
    vi.mocked(console.log).mockRestore();
  });

  describe("AI Feature Methods", () => {
    const testCases = [
      {
        method: "getOntologySuggestions",
        args: [{}, "context"],
        expectedResultOnError: [],
        mockReturn: JSON.stringify([{ label: "Suggestion" }]),
      },
      {
        method: "autoTag",
        args: ["content"],
        expectedResultOnError: [],
        mockReturn: JSON.stringify(["#tag"]),
      },
      {
        method: "summarize",
        args: ["content"],
        expectedResultOnError: "",
        mockReturn: "Summary",
      },
    ];

    testCases.forEach(({ method, args, expectedResultOnError, mockReturn }) => {
      describe(method, () => {
        it(`should call preferred model (Gemini) and return parsed response for ${method}`, async () => {
          setMockStoreUserProfile({
            aiEnabled: true,
            geminiApiKey: "gemini-key",
            aiProviderPreference: "gemini",
          });
          vi.mocked(mockGeminiInstance.invoke).mockResolvedValue(mockReturn);

          await (aiService as any)[method](...args);
          expect(mockChatPromptTemplateInstance.pipe).toHaveBeenCalledWith(
            mockGeminiInstance,
          );
          expect(mockChatPromptTemplateInstance.pipe).toHaveBeenCalledWith(
            mockStringOutputParserInstance,
          );
          expect(mockGeminiInstance.invoke).toHaveBeenCalled();
        });

        it(`should call preferred model (Ollama) and return parsed response for ${method}`, async () => {
          setMockStoreUserProfile({
            aiEnabled: true,
            ollamaApiEndpoint: "ollama-ep",
            aiProviderPreference: "ollama",
          });
          vi.mocked(mockOllamaInstance.invoke).mockResolvedValue(mockReturn);

          await (aiService as any)[method](...args);
          expect(mockChatPromptTemplateInstance.pipe).toHaveBeenCalledWith(
            mockOllamaInstance,
          );
          expect(mockChatPromptTemplateInstance.pipe).toHaveBeenCalledWith(
            mockStringOutputParserInstance,
          );
          expect(mockOllamaInstance.invoke).toHaveBeenCalled();
        });

        it(`should handle errors gracefully for ${method}`, async () => {
          setMockStoreUserProfile({
            aiEnabled: true,
            geminiApiKey: "gemini-key",
          });
          const expectedError = new Error("AI API Error");
          vi.mocked(mockGeminiInstance.invoke).mockRejectedValue(expectedError);

          const result = await (aiService as any)[method](...args);
          expect(result).toEqual(expectedResultOnError);
        });
      });
    });
  });

  describe("getEmbeddingVector", () => {
    it("should return empty array if no embedding model is active", async () => {
      setMockStoreUserProfile({ aiEnabled: true });
      const vector = await aiService.getEmbeddingVector("test text");
      expect(vector).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(
        "AIService: getEmbeddingVector - No active embedding model configured or initialized.",
      );
    });
  });
});
