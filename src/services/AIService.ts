import { UserProfile, OntologyTree } from "../../shared/types";

type AIPreferences = UserProfile["preferences"];

export class AIService {
  public preferences: AIPreferences | undefined;

  constructor(preferences?: AIPreferences) {
    this.preferences = preferences;
  }

  public reinitializeModels() {
    // No-op
  }

  public isAIEnabled(): boolean {
    return !!this.preferences?.aiEnabled;
  }

  public async getOntologySuggestions(
    existingOntology: OntologyTree,
    context?: string,
  ): Promise<any[]> {
    if (!this.isAIEnabled()) return [];
    return Promise.resolve([{ label: "Suggestion" }]);
  }

  public async autoTag(
    noteContent: string,
    noteTitle?: string,
    existingOntology?: OntologyTree,
  ): Promise<string[]> {
    if (!this.isAIEnabled()) return [];
    return Promise.resolve(["#tag"]);
  }

  public async summarize(
    noteContent: string,
    noteTitle?: string,
  ): Promise<string> {
    if (!this.isAIEnabled()) return "";
    return Promise.resolve("Summary");
  }

  public async getEmbeddingVector(text: string): Promise<number[]> {
    if (!this.isAIEnabled()) return [];
    return Promise.resolve([0.1, 0.2, 0.3]);
  }
}
