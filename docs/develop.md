# Developer Guide

## 1. Introduction
This guide provides developers with the necessary information to understand, build, and contribute to the Notention project.

-   **Project Overview**: Notention is a lightweight, client-side PWA for decentralized note-taking using Nostr.
-   **Technology Stack**:
    -   **Frontend**: TypeScript, Web Components
    -   **Build Tool**: Vite
    -   **State Management**: Zustand
    -   **Networking**: nostr-tools for Nostr protocol integration
    -   **Editor**: Tiptap
    -   **Database**: LocalForage (IndexedDB wrapper)
    -   **AI (Optional)**: LangChain.js with Ollama/Gemini

## 2. Project Structure

-   `src/`: Main source code directory.
    -   `backend/`: Services that run in a separate worker (future).
    -   `components/`: Reusable UI components (deprecated, see `ui-rewrite`).
    -   `extensions/`: Custom Tiptap extensions.
    -   `lib/`: Utility functions.
    -   `services/`: Core application logic (database, Nostr, notes, etc.).
    -   `store/`: Zustand stores for state management.
    -   `ui-rewrite/`: The new component library built with Lit.
-   `public/`: Static assets.
-   `docs/`: Project documentation.
-   `shared/`: TypeScript types shared across the application.
-   `tests-e2e/`: End-to-end tests with Playwright.

## 3. Getting Started (Development Environment)

1.  **Prerequisites**:
    -   Node.js (LTS version)
    -   npm or yarn
2.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-repo/notention.git
    cd notention
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.
5.  **Build for Production**:
    ```bash
    npm run build
    ```
    The production-ready assets will be in the `dist/` directory.

## 4. Core Concepts and Architecture

### State Management (Zustand)
Zustand is used for simple, centralized state management.
-   **Key Stores**: The main store is located in `src/store/index.ts`. It manages application-level state such as the current user, settings, and active notes.
-   **Actions**: State is modified through actions, which are functions within the store.
-   **Async Operations**: Async actions (like fetching data from Nostr) are handled within the stores, often by calling a service.

### Data Persistence (`DBService`)
The `DBService` (`src/services/db.ts`) is a wrapper around `localforage`, providing a simple key-value store interface for IndexedDB. It's used to store all user data, including notes, ontology, and settings.

### Nostr Integration (`NostrService`)
The `NostrService` (`src/services/NostrService.ts`) handles all communication with the Nostr network.
-   **Key Management**: It manages the user's Nostr keypair.
-   **Event Publishing**: It sends notes and other events to Nostr relays.
-   **Event Subscription**: It subscribes to relays to receive events from other users.
-   **Syncing**: It includes logic for syncing local data with the network.

### Rich Text Editor (`NoteEditor.ts` with Tiptap)
The note editor is a custom web component (`src/ui-rewrite/NoteEditor.ts`) that uses Tiptap.
-   **Custom Extensions**: The `SemanticTag` extension (`src/extensions/SemanticTag.ts`) is a key component, allowing for the creation of inline tags that are linked to the ontology.
-   **Autocomplete**: Autocomplete functionality for tags is implemented within the editor component.

### Ontology System (`OntologyService`)
The `OntologyService` (`src/services/OntologyService.ts`) is responsible for managing the user's ontology.
-   **Structure**: The ontology is a tree of `OntologyNode` objects.
-   **Manipulation**: The service provides methods for adding, removing, and moving nodes in the tree.
-   **Semantic Matching**: It contains the logic for traversing the ontology graph to find related concepts, which is used for semantic search and network matching.

### PWA and Service Workers
Notention is a PWA, configured using `vite-plugin-pwa`. The service worker (`public/sw.js` if custom, or auto-generated) handles caching of application assets for offline use.

## 5. Coding Conventions and Style

-   **Linting and Formatting**: The project uses ESLint and Prettier for code quality and consistency. Run `npm run lint` and `npm run format` to check and fix your code.
-   **TypeScript Best Practices**: Use strong types, avoid `any`, and leverage modern TypeScript features.
-   **Naming Conventions**:
    -   Components: `PascalCase` (e.g., `NoteEditor`)
    -   Services: `PascalCase` (e.g., `NoteService`)
    -   Functions/Variables: `camelCase` (e.g., `getNoteById`)
    -   Types: `PascalCase` (e.g., `Note`)

## 6. Testing

-   **Unit Tests (Vitest)**:
    -   Run tests with `npm run test`.
    -   Test files are co-located with the source files they test (e.g., `NoteService.test.ts`).
    -   Dependencies are mocked to isolate the code under test.
-   **End-to-End Testing (Playwright)**:
    -   Run E2E tests with `npm run test:e2e`.
    -   Tests are located in the `tests-e2e/` directory.

## 7. Key Services Deep Dive

-   `NoteService.ts`: Manages all CRUD (Create, Read, Update, Delete) operations for notes, as well as semantic search.
-   `OntologyService.ts`: Manages the ontology tree structure and provides semantic matching capabilities.
-   `NostrService.ts`: Handles all interactions with the Nostr network, including encryption and data synchronization.
-   `DBService.ts`: A simple abstraction over `localforage` for persistent local storage.
-   `AIService.ts`: An optional service for integrating with AI models for features like auto-tagging and summarization.

## 8. Contributing

1.  **Report Bugs**: Use GitHub Issues to report any bugs you find.
2.  **Suggest Features**: Use GitHub Issues to suggest new features.
3.  **Pull Request Process**:
    1.  Fork the repository.
    2.  Create a new branch for your feature or bug fix.
    3.  Make your changes and commit them with a clear message.
    4.  Push your branch and open a pull request.

## 9. Deployment

Notention is a static PWA.
1.  Run `npm run build`.
2.  Deploy the contents of the `dist/` folder to any static web hosting service (e.g., Vercel, Netlify, GitHub Pages).
3.  Ensure your hosting service correctly serves the service worker with the appropriate headers.

## 10. Future Development / Roadmap

The project's roadmap includes:
-   Improved collaboration features.
-   Enhanced AI-powered suggestions.
-   Support for more complex ontology relationships.
-   A plugin system for third-party extensions.
