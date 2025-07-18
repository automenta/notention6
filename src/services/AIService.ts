import {OntologyTree, UserProfile} from "../../shared/types";
import {ChatOllama, OllamaEmbeddings} from "@langchain/ollama";

type AIPreferences = UserProfile["preferences"];

interface AIProvider {
    generateEmbedding(text: string): Promise<number[]>;

    generateText(prompt: string): Promise<string>;

    extractTags(text: string, ontology?: OntologyTree): Promise<string[]>;
}

// Basic fallback AI that uses simple heuristics
class FallbackAIProvider implements AIProvider {
    async generateEmbedding(text: string): Promise<number[]> {
        // Simple text-based embedding using character frequency
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const embedding = new Array(128).fill(0);

        words.forEach((word, idx) => {
            const hash = this.simpleHash(word);
            embedding[hash % 128] += 1;
        });

        // Normalize the vector
        const magnitude = Math.sqrt(
            embedding.reduce((sum, val) => sum + val * val, 0),
        );
        return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
    }

    async generateText(prompt: string): Promise<string> {
        // Simple template-based text generation
        if (prompt.includes("summarize")) {
            return "This note discusses key points and important information.";
        }
        if (prompt.includes("suggest tags")) {
            return "#important #note #draft";
        }
        return "AI-generated response based on the provided content.";
    }

    async extractTags(text: string, ontology?: OntologyTree): Promise<string[]> {
        const tags: string[] = [];
        const words = text.toLowerCase().split(/\s+/);

        // Look for existing tags in text
        const hashTags = text.match(/#\w+/g) || [];
        tags.push(...hashTags);

        // Add common tags based on content
        if (words.some((w) => ["meeting", "call", "discussion"].includes(w))) {
            tags.push("#Meeting");
        }
        if (words.some((w) => ["project", "task", "todo"].includes(w))) {
            tags.push("#Project");
        }
        if (words.some((w) => ["idea", "brainstorm", "concept"].includes(w))) {
            tags.push("#Idea");
        }
        if (words.some((w) => ["research", "study", "analysis"].includes(w))) {
            tags.push("#Research");
        }

        // If ontology exists, try to match against existing tags
        if (ontology?.nodes) {
            Object.values(ontology.nodes).forEach((node) => {
                const nodeLabel = node.label.toLowerCase();
                if (
                    text
                        .toLowerCase()
                        .includes(nodeLabel.replace("#", "").replace("@", ""))
                ) {
                    tags.push(node.label);
                }
            });
        }

        return [...new Set(tags)]; // Remove duplicates
    }

    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

// Gemini AI Provider (cloud-based)
class GeminiAIProvider implements AIProvider {
    private readonly apiKey: string;
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/models/embedding-001:embedContent?key=${this.apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "models/embedding-001",
                        content: {
                            parts: [{text}],
                        },
                    }),
                },
            );

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.embedding?.values || [];
        } catch (error) {
            console.error("Gemini embedding generation failed:", error);
            // Fallback to simple embedding
            return new FallbackAIProvider().generateEmbedding(text);
        }
    }

    async generateText(prompt: string): Promise<string> {
        try {
            const response = await fetch(
                `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{text: prompt}],
                            },
                        ],
                    }),
                },
            );

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.statusText}`);
            }

            const data = await response.json();
            return (
                data.candidates?.[0]?.content?.parts?.[0]?.text ||
                "No response generated"
            );
        } catch (error) {
            console.error("Gemini text generation failed:", error);
            return new FallbackAIProvider().generateText(prompt);
        }
    }

    async extractTags(text: string, ontology?: OntologyTree): Promise<string[]> {
        const ontologyContext = ontology
            ? `Available tags in ontology: ${Object.values(ontology.nodes)
                .map((n) => n.label)
                .join(", ")}`
            : "";

        const prompt = `Analyze the following text and suggest relevant tags. ${ontologyContext}

Text: ${text}

Provide tags in the format: #tag1, #tag2, #tag3 (max 5 tags)`;

        try {
            const response = await this.generateText(prompt);
            const tags = response.match(/#\w+/g) || [];
            return tags.slice(0, 5); // Limit to 5 tags
        } catch (error) {
            console.error("Gemini tag extraction failed:", error);
            return new FallbackAIProvider().extractTags(text, ontology);
        }
    }
}

class OllamaAIProvider implements AIProvider {
    private chatModel: ChatOllama;
    private embeddingModel: OllamaEmbeddings;

    constructor(apiUrl: string) {
        this.chatModel = new ChatOllama({
            baseUrl: apiUrl,
            model: "llama3",
        });
        this.embeddingModel = new OllamaEmbeddings({
            baseUrl: apiUrl,
            model: "llama3",
        });
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            return await this.embeddingModel.embedQuery(text);
        } catch (error) {
            console.error("Ollama embedding generation failed:", error);
            return new FallbackAIProvider().generateEmbedding(text);
        }
    }

    async generateText(prompt: string): Promise<string> {
        try {
            const response = await this.chatModel.invoke(prompt);
            return response.content.toString();
        } catch (error) {
            console.error("Ollama text generation failed:", error);
            return new FallbackAIProvider().generateText(prompt);
        }
    }

    async extractTags(text: string, ontology?: OntologyTree): Promise<string[]> {
        const ontologyContext = ontology
            ? `Available tags in ontology: ${Object.values(ontology.nodes)
                .map((n) => n.label)
                .join(", ")}`
            : "";

        const prompt = `Analyze the following text and suggest relevant tags. ${ontologyContext}

Text: ${text}

Provide tags in the format: #tag1, #tag2, #tag3 (max 5 tags)`;

        try {
            const response = await this.generateText(prompt);
            const tags = response.match(/#\w+/g) || [];
            return tags.slice(0, 5);
        } catch (error) {
            console.error("Ollama tag extraction failed:", error);
            return new FallbackAIProvider().extractTags(text, ontology);
        }
    }
}

export class AIService {
    public preferences: AIPreferences | undefined;
    private provider: AIProvider;

    constructor(preferences?: AIPreferences) {
        this.preferences = preferences;
        this.provider = this.initializeProvider();
    }

    public reinitializeModels() {
        this.provider = this.initializeProvider();
    }

    public isAIEnabled(): boolean {
        return !!this.preferences?.aiEnabled;
    }

    public async getOntologySuggestions(
        existingOntology: OntologyTree,
        context?: string,
    ): Promise<any[]> {
        if (!this.isAIEnabled()) return [];

        try {
            const existingOntologyString = JSON.stringify(existingOntology, null, 2);
            const prompt = `Given the following ontology, suggest new nodes (with labels, attributes, and parentId if applicable) to expand it. Return a JSON array of suggestions.\n\nOntology:\n${existingOntologyString}\n\n${context ? `Context: ${context}\n\n` : ""}Suggestions:`;

            const response = await this.provider.generateText(prompt);

            return JSON.parse(
                response.match(/```json\n([\s\S]*?)\n```/)?.[1] || response,
            );
        } catch (error) {
            console.error("Failed to generate ontology suggestions:", error);
            return [];
        }
    }

    public async autoTag(
        noteContent: string,
        noteTitle?: string,
        existingOntology?: OntologyTree,
    ): Promise<string[]> {
        if (!this.isAIEnabled()) return [];

        const fullText = `${noteTitle || ""} ${noteContent}`.trim();
        if (!fullText) return [];

        try {
            return await this.provider.extractTags(fullText, existingOntology);
        } catch (error) {
            console.error("Auto-tagging failed:", error);
            return [];
        }
    }

    public async summarize(
        noteContent: string,
        noteTitle?: string,
    ): Promise<string> {
        if (!this.isAIEnabled()) return "";

        const fullText = `${noteTitle || ""} ${noteContent}`.trim();
        if (!fullText) return "";

        try {
            const prompt = `Summarize the following note in 2-3 sentences:\n\n${fullText}`;
            return await this.provider.generateText(prompt);
        } catch (error) {
            console.error("Summarization failed:", error);
            return "Unable to generate summary.";
        }
    }

    public async getEmbeddingVector(text: string): Promise<number[]> {
        if (!this.isAIEnabled() || !text.trim()) return [];

        try {
            return await this.provider.generateEmbedding(text);
        } catch (error) {
            console.error("Embedding generation failed:", error);
            return [];
        }
    }

    public async generateNoteContent(prompt: string): Promise<string> {
        if (!this.isAIEnabled()) return "";

        try {
            const fullPrompt = `Generate helpful note content based on this prompt: ${prompt}\n\nProvide well-structured, informative content.`;
            return await this.provider.generateText(fullPrompt);
        } catch (error) {
            console.error("Note content generation failed:", error);
            return "Unable to generate content.";
        }
    }

    private initializeProvider(): AIProvider {
        if (
            this.preferences?.aiProvider === "gemini" &&
            this.preferences?.geminiApiKey
        ) {
            return new GeminiAIProvider(this.preferences.geminiApiKey);
        }
        if (
            this.preferences?.aiProvider === "ollama" &&
            this.preferences?.ollamaApiUrl
        ) {
            return new OllamaAIProvider(this.preferences.ollamaApiUrl);
        }
        // Default to fallback provider
        return new FallbackAIProvider();
    }
}
