import { StoreApi } from 'zustand';
import { AppState, Note, OntologyTree, UserProfile, Folder, NotentionTemplate, DirectMessage, NostrEvent, Contact, Match } from '../../shared/types';
import { DBService } from '../services/db';
import { FolderService } from '../services/FolderService';
import { OntologyService } from '../services/ontology';
import { NoteService } from '../services/NoteService';
import { nostrService, NostrService } from '../services/NostrService';
import { AIService } from '../services/AIService';
import { networkService, NetworkService } from '../services/NetworkService';
import { v4 as uuidv4 } from "uuid";
import DOMPurify from "dompurify";
import { Filter } from "nostr-tools";

export interface AppActions {
    initializeApp: () => Promise<void>;
    createNote: (partialNote?: Partial<Note>) => Promise<string>;
    updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    setCurrentNote: (id: string | undefined) => void;
    setSearchQuery: (query: string) => void;
    setSearchFilters: (filters: Partial<SearchFilters>) => void;
    moveNoteToFolder: (noteId: string, folderId: string | undefined) => Promise<void>;
    importNotes: (notes: Note[]) => Promise<void>;
    setOntology: (ontology: OntologyTree) => Promise<void>;
    updateUserProfile: (profileUpdates: Partial<UserProfile>) => Promise<void>;
    createProfileNote: () => Promise<void>;
    generateAndStoreNostrKeys: (privateKey?: string, publicKey?: string) => Promise<{ publicKey: string | null; privateKey?: string }>;
    logoutFromNostr: () => Promise<void>;
    loadFolders: () => Promise<void>;
    createFolder: (name: string, parentId?: string) => Promise<string | undefined>;
    updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
    createTemplate: (templateData: Omit<NotentionTemplate, "id">) => Promise<string>;
    updateTemplate: (id: string, updates: Partial<NotentionTemplate>) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    setSidebarTab: (tab: AppState["sidebarTab"]) => void;
    toggleSidebar: () => void;
    setEditorContent: (content: string) => void;
    setIsEditing: (editing: boolean) => void;
    setNoteView: (view: AppState["noteView"]) => void;
    setLoading: (key: keyof AppState["loading"], loading: boolean) => void;
    setError: (key: keyof AppState["errors"], error: string | undefined) => void;
    addNotification: (notification: Notification) => void;
    removeNotification: (id: string) => void;
    initializeNostr: () => Promise<void>;
    setNostrConnected: (status: boolean) => void;
    publishCurrentNoteToNostr: (options: { encrypt?: boolean; recipientPk?: string; relays?: string[]; }) => Promise<void>;
    subscribeToPublicNotes: (relays?: string[]) => string | null;
    subscribeToTopic: (topic: string, relays?: string[]) => string | null;
    unsubscribeFromNostr: (subscriptionId: string | any) => void;
    addDirectMessage: (message: DirectMessage) => void;
    setNostrRelays: (relays: string[]) => Promise<void>;
    addNostrRelay: (relay: string) => Promise<void>;
    removeNostrRelay: (relay: string) => Promise<void>;
    handleIncomingNostrEvent: (event: NostrEvent) => void;
    sendDirectMessage: (recipientPk: string, content: string) => Promise<void>;
    subscribeToDirectMessages: (relays?: string[]) => string | null;
    addTopicSubscription: (topic: string, subscriptionId: string) => void;
    removeTopicSubscription: (topic: string) => void;
    addNoteToTopic: (topic: string, note: NostrEvent) => void;
    syncWithNostr: (force?: boolean) => Promise<void>;
    setLastSyncTimestamp: (timestamp: Date) => void;
    findAndSetEmbeddingMatches: (noteId: string, similarityThreshold?: number) => Promise<void>;
    setContacts: (contacts: Contact[]) => void;
    addContact: (contact: Contact) => Promise<void>;
    removeContact: (pubkey: string) => Promise<void>;
    updateContactAlias: (pubkey: string, alias: string) => Promise<void>;
    syncContactsWithNostr: () => Promise<void>;
    moveOntologyNode: (nodeId: string, newParentId: string | undefined, newIndex: number) => void;
    moveFolder: (folderId: string, targetFolderId: string) => Promise<void>;
    getAIService: () => AIService;
    getNotesByFolder: (folderId: string) => Note[];
    addMatch: (match: Match) => void;
    nostrService: NostrService;
    networkService: NetworkService;
    setTheme: (theme: "light" | "dark" | "system" | "solarized" | "nord") => void;
}

export const createAppActions = (set: StoreApi<AppState>['setState'], get: StoreApi<AppState>['getState']): AppActions => ({
    initializeApp: async () => {
        const state = get();

        try {
            // Load all data from IndexedDB
            state.setLoading("notes", true);
            state.setLoading("ontology", true);

            const notesList = await DBService.getAllNotes();
            const notesMap: { [id: string]: Note } = {};
            notesList.forEach((note) => {
                if (note.createdAt && typeof note.createdAt === "string")
                    note.createdAt = new Date(note.createdAt);
                if (note.updatedAt && typeof note.updatedAt === "string")
                    note.updatedAt = new Date(note.updatedAt);
                notesMap[note.id] = note;
            });

            let ontologyData = await DBService.getOntology();
            if (!ontologyData) {
                ontologyData = await DBService.getDefaultOntology();
                await DBService.saveOntology(ontologyData);
                ontologyData = (await DBService.getOntology()) || ontologyData;
            } else if (
                ontologyData.updatedAt &&
                typeof ontologyData.updatedAt === "string"
            ) {
                ontologyData.updatedAt = new Date(ontologyData.updatedAt);
            }

            let userProfileData = await DBService.getUserProfile();
            const defaultRelays = [
                "wss://relay.damus.io",
                "wss://nos.lol",
                "wss://relay.snort.social",
            ];
            let relaysToUseInStore = defaultRelays;

            if (!userProfileData) {
                userProfileData = {
                    nostrPubkey: "",
                    sharedTags: [],
                    preferences: {
                        theme: "system",
                        aiEnabled: false,
                        defaultNoteStatus: "draft",
                        ollamaApiEndpoint: "",
                        geminiApiKey: "",
                        aiMatchingSensitivity: 0.7,
                    },
                    nostrRelays: defaultRelays,
                    privacySettings: {
                        sharePublicNotesGlobally: false,
                        shareTagsWithPublicNotes: true,
                        shareValuesWithPublicNotes: true,
                    },
                    contacts: [],
                };
                await DBService.saveUserProfile(userProfileData);
            } else {
                if (
                    !userProfileData.nostrRelays ||
                    userProfileData.nostrRelays.length === 0
                ) {
                    userProfileData.nostrRelays = defaultRelays;
                }
                if (!userProfileData.privacySettings) {
                    userProfileData.privacySettings = {
                        sharePublicNotesGlobally: false,
                        shareTagsWithPublicNotes: true,
                        shareValuesWithPublicNotes: true,
                    };
                }
                if (!userProfileData.contacts) {
                    userProfileData.contacts = [];
                }
                relaysToUseInStore = userProfileData.nostrRelays;
            }
            userProfileData.preferences = {
                theme: "system",
                aiEnabled: false,
                defaultNoteStatus: "draft",
                ollamaApiEndpoint: "",
                geminiApiKey: "",
                aiMatchingSensitivity: 0.7,
                ...userProfileData.preferences,
            };

            const aiService = get().getAIService();
            aiService.preferences = userProfileData.preferences;
            aiService.reinitializeModels();

            const foldersList = await FolderService.getAllFolders();
            const foldersMap: { [id: string]: Folder } = {};
            foldersList.forEach((folder) => (foldersMap[folder.id] = folder));

            let templatesList = await DBService.getAllTemplates();
            if (templatesList.length === 0) {
                const defaultTemplates = await DBService.getDefaultTemplates();
                for (const template of defaultTemplates) {
                    await DBService.saveTemplate(template);
                }
                templatesList = defaultTemplates;
            }
            const templatesMap: { [id: string]: NotentionTemplate } = {};
            templatesList.forEach((template) => {
                templatesMap[template.id] = template;
            });

            set({
                notes: notesMap,
                ontology: ontologyData,
                userProfile: userProfileData,
                folders: foldersMap,
                templates: templatesMap,
                nostrRelays: relaysToUseInStore,
            });

            get().setTheme(userProfileData.preferences.theme);

            await get().initializeNostr();

            if (get().userProfile?.nostrPubkey) {
                await get().syncWithNostr(true);
            }

            if (get().userProfile?.nostrPubkey) {
                const { ontology, notes, networkService } = get();
                networkService.startMatching(ontology, Object.values(notes));
            }
        } catch (error: any) {
            console.error("Failed to initialize app:", error);
            get().setError("notes", `Failed to load data: ${error.message}`);
        } finally {
            get().setLoading("notes", false);
            get().setLoading("ontology", false);
        }

        window.addEventListener("online", () => {
            get().syncWithNostr();
        });
        window.addEventListener("offline", () => {
            get().setError("sync", "Application is offline. Sync paused.");
        });
    },
    createNote: async (partialNote?: Partial<Note>) => {
        const newNote = await NoteService.createNote(partialNote || {});
        set((state) => ({
            notes: { ...state.notes, [newNote.id]: newNote },
            currentNoteId: newNote.id,
            editorContent: newNote.content,
            isEditing: true,
        }));

        if (get().userProfile?.nostrPubkey && newNote.status !== "private") {
            try {
                const publishedEventIds = await nostrService.publishNoteForSync(
                    newNote,
                    get().userProfile?.nostrRelays || get().nostrRelays,
                );
                if (publishedEventIds.length > 0 && publishedEventIds[0]) {
                    const noteWithSyncId = {
                        ...newNote,
                        nostrSyncEventId: publishedEventIds[0],
                    };
                    await DBService.saveNote(noteWithSyncId);
                    set((state) => ({
                        notes: { ...state.notes, [newNote.id]: noteWithSyncId },
                    }));
                } else {
                    await DBService.addNoteToSyncQueue({
                        noteId: newNote.id,
                        action: "save",
                        timestamp: new Date(),
                        nostrEventId: newNote.nostrSyncEventId,
                    });
                }
            } catch (e) {
                await DBService.addNoteToSyncQueue({
                    noteId: newNote.id,
                    action: "save",
                    timestamp: new Date(),
                    nostrEventId: newNote.nostrSyncEventId,
                });
            }
        } else {
            await DBService.addNoteToSyncQueue({
                noteId: newNote.id,
                action: "save",
                timestamp: new Date(),
                nostrEventId: newNote.nostrSyncEventId,
            });
        }
        return newNote.id;
    },
    updateNote: async (id: string, updates: Partial<Note>) => {
        let updatedNote = await NoteService.updateNote(id, updates);
        if (updatedNote) {
            set((state) => ({
                notes: { ...state.notes, [id]: updatedNote! },
                ...(state.currentNoteId === id &&
                    state.editorContent !== updatedNote!.content && {
                    editorContent: updatedNote!.content,
                }),
            }));

            if (get().userProfile?.nostrPubkey && updatedNote.status !== "private") {
                try {
                    const publishedEventIds = await nostrService.publishNoteForSync(
                        updatedNote,
                        get().userProfile?.nostrRelays || get().nostrRelays,
                    );
                    if (publishedEventIds.length > 0 && publishedEventIds[0]) {
                        if (updatedNote.nostrSyncEventId !== publishedEventIds[0]) {
                            updatedNote = {
                                ...updatedNote,
                                nostrSyncEventId: publishedEventIds[0],
                            };
                            await DBService.saveNote(updatedNote);
                            set((state) => ({
                                notes: { ...state.notes, [id]: updatedNote! },
                            }));
                        }
                    } else {
                        await DBService.addNoteToSyncQueue({
                            noteId: id,
                            action: "save",
                            timestamp: new Date(),
                            nostrEventId: updatedNote.nostrSyncEventId,
                        });
                    }
                } catch (e) {
                    await DBService.addNoteToSyncQueue({
                        noteId: id,
                        action: "save",
                        timestamp: new Date(),
                        nostrEventId: updatedNote.nostrSyncEventId,
                    });
                }
            } else {
                await DBService.addNoteToSyncQueue({
                    noteId: id,
                    action: "save",
                    timestamp: new Date(),
                    nostrEventId: updatedNote.nostrSyncEventId,
                });
            }
        }
    },
    deleteNote: async (id: string) => {
        const noteToDelete = await DBService.getNote(id);
        const nostrEventIdToDelete = noteToDelete?.nostrSyncEventId;

        await NoteService.deleteNote(id);

        if (noteToDelete && noteToDelete.folderId) {
            const folder = get().folders[noteToDelete.folderId];
            if (folder) {
                const updatedFolder = {
                    ...folder,
                    noteIds: folder.noteIds.filter((nid) => nid !== id),
                    updatedAt: new Date(),
                };
                await FolderService.updateFolder(folder.id, {
                    noteIds: updatedFolder.noteIds,
                });
                set((s) => ({
                    folders: { ...s.folders, [folder.id]: updatedFolder },
                }));
            }
        }

        set((s) => {
            const newNotes = { ...s.notes };
            delete newNotes[id];
            return {
                notes: newNotes,
                currentNoteId: s.currentNoteId === id ? undefined : s.currentNoteId,
                editorContent: s.currentNoteId === id ? "" : s.editorContent,
                isEditing: s.currentNoteId === id ? false : s.isEditing,
            };
        });

        if (get().userProfile?.nostrPubkey) {
            if (nostrEventIdToDelete) {
                if (navigator.onLine) {
                    try {
                        await nostrService.publishDeletionEvent(
                            [nostrEventIdToDelete],
                            "Note deleted by user.",
                            get().userProfile?.nostrRelays || get().nostrRelays,
                        );
                        await DBService.removeNoteFromSyncQueue(id);
                    } catch (e) {
                        await DBService.addNoteToSyncQueue({
                            noteId: id,
                            action: "delete",
                            timestamp: new Date(),
                            nostrEventId: nostrEventIdToDelete,
                        });
                    }
                } else {
                    await DBService.addNoteToSyncQueue({
                        noteId: id,
                        action: "delete",
                        timestamp: new Date(),
                        nostrEventId: nostrEventIdToDelete,
                    });
                }
            } else {
                await DBService.removeNoteFromSyncQueue(id);
            }
        } else {
            if (nostrEventIdToDelete) {
                await DBService.addNoteToSyncQueue({
                    noteId: id,
                    action: "delete",
                    timestamp: new Date(),
                    nostrEventId: nostrEventIdToDelete,
                });
            } else {
                await DBService.removeNoteFromSyncQueue(id);
            }
        }
    },
    moveNoteToFolder: async (noteId: string, folderId: string | undefined) => {
        const note = get().notes[noteId];
        if (!note) return;

        const oldFolderId = note.folderId;

        const updatedNote = await NoteService.updateNote(noteId, { folderId });
        if (!updatedNote) return;

        let newFoldersState = { ...get().folders };

        if (oldFolderId) {
            const oldFolder = get().folders[oldFolderId];
            if (oldFolder) {
                const updatedOldFolder = {
                    ...oldFolder,
                    noteIds: oldFolder.noteIds.filter((id) => id !== noteId),
                    updatedAt: new Date(),
                };
                await FolderService.updateFolder(oldFolderId, {
                    noteIds: updatedOldFolder.noteIds,
                });
                newFoldersState = {
                    ...newFoldersState,
                    [oldFolderId]: updatedOldFolder,
                };
            }
        }

        if (folderId) {
            const newFolder = get().folders[folderId];
            if (newFolder) {
                const updatedNewFolder = {
                    ...newFolder,
                    noteIds: [...new Set([...newFolder.noteIds, noteId])],
                    updatedAt: new Date(),
                };
                await FolderService.updateFolder(folderId, {
                    noteIds: updatedNewFolder.noteIds,
                });
                newFoldersState = { ...newFoldersState, [folderId]: updatedNewFolder };
            }
        }

        set((s) => ({
            notes: { ...s.notes, [noteId]: updatedNote },
            folders: newFoldersState,
        }));
    },
    setCurrentNote: (id: string | undefined) => {
        const note = id ? get().notes[id] : undefined;
        set({
            currentNoteId: id,
            editorContent: note?.content || "",
            isEditing: !!id,
        });
    },
    setSearchQuery: (query: string) => {
        set({ searchQuery: query });
    },
    setSearchFilters: (filters: Partial<SearchFilters>) => {
        set((state) => ({ searchFilters: { ...state.searchFilters, ...filters } }));
    },
    importNotes: async (notesToImport: Note[]) => {
        const { notes } = get();
        const newNotes = { ...notes };
        for (const note of notesToImport) {
            newNotes[note.id] = note;
            await DBService.saveNote(note);
        }
        set({ notes: newNotes });
    },
    setOntology: async (ontologyData: OntologyTree) => {
        await DBService.saveOntology(ontologyData);
        const savedOntology = await DBService.getOntology();
        set({ ontology: savedOntology || ontologyData });

        if (get().userProfile?.nostrPubkey) {
            if (savedOntology) {
                nostrService
                    .publishOntologyForSync(
                        savedOntology,
                        get().userProfile?.nostrRelays || get().nostrRelays,
                    )
                    .catch((e) =>
                        console.warn(
                            "Live sync on setOntology failed, will queue or retry later",
                            e,
                        ),
                    );
            }
        } else {
            await DBService.setOntologyNeedsSync(true);
        }
    },
    createFolder: async (name: string, parentId?: string) => {
        try {
            const newFolder = await FolderService.createFolder(name, parentId);
            set((state) => ({
                folders: { ...state.folders, [newFolder.id]: newFolder },
            }));
            if (parentId && get().folders[parentId]) {
                const parentFolder = get().folders[parentId];
                const updatedParent = {
                    ...parentFolder,
                    children: [...(parentFolder.children || []), newFolder.id],
                    updatedAt: new Date(),
                };
                set((state) => ({
                    folders: { ...state.folders, [parentId]: updatedParent },
                }));
            }
            return newFolder.id;
        } catch (error) {
            console.error("Failed to create folder:", error);
            get().setError("notes", `Failed to create folder: ${(error as Error).message}`);
            return undefined;
        }
    },
    updateFolder: async (id: string, updates: Partial<Folder>) => {
        const oldFolder = get().folders[id];
        if (!oldFolder) return;

        const updatedFolder = await FolderService.updateFolder(id, updates);
        if (updatedFolder) {
            const newFoldersState = { ...get().folders, [id]: updatedFolder };

            const oldParentId = oldFolder.parentId;
            const newParentId = updatedFolder.parentId;

            if (newParentId !== oldParentId) {
                if (oldParentId && newFoldersState[oldParentId]) {
                    const oldParent = newFoldersState[oldParentId];
                    newFoldersState[oldParentId] = {
                        ...oldParent,
                        children: (oldParent.children || []).filter(
                            (childId) => childId !== id,
                        ),
                        updatedAt: new Date(),
                    };
                }
                if (newParentId && newFoldersState[newParentId]) {
                    const newParent = newFoldersState[newParentId];
                    newFoldersState[newParentId] = {
                        ...newParent,
                        children: [...new Set([...(newParent.children || []), id])],
                        updatedAt: new Date(),
                    };
                }
            }
            set({ folders: newFoldersState });
        }
    },
    deleteFolder: async (id: string) => {
        const folderToDelete = get().folders[id];
        if (!folderToDelete) return;

        const allFoldersMap = { ...get().folders };

        await FolderService.deleteFolder(id, allFoldersMap);

        const newFolders = { ...get().folders };
        const notesToUpdate = { ...get().notes };

        const folderIdsToDelete: string[] = [id];
        const collectChildren = (folderId: string) => {
            const children = newFolders[folderId]?.children;
            if (children) {
                children.forEach((childId) => {
                    folderIdsToDelete.push(childId);
                    collectChildren(childId);
                });
            }
        };
        collectChildren(id);

        folderIdsToDelete.forEach((fid) => delete newFolders[fid]);

        Object.values(get().notes).forEach((note) => {
            if (note.folderId && folderIdsToDelete.includes(note.folderId)) {
                notesToUpdate[note.id] = {
                    ...note,
                    folderId: undefined,
                    updatedAt: new Date(),
                };
            }
        });

        if (folderToDelete.parentId && newFolders[folderToDelete.parentId]) {
            const parentFolder = newFolders[folderToDelete.parentId];
            newFolders[folderToDelete.parentId] = {
                ...parentFolder,
                children: (parentFolder.children || []).filter(
                    (childId) => childId !== id,
                ),
                updatedAt: new Date(),
            };
        }

        set({ folders: newFolders, notes: notesToUpdate });
    },
    createTemplate: async (templateData: Omit<NotentionTemplate, "id">) => {
        const id = uuidv4();
        const template: NotentionTemplate = {
            ...templateData,
            id,
        };

        await DBService.saveTemplate(template);

        set((state) => ({
            templates: { ...state.templates, [id]: template },
        }));

        return id;
    },
    updateTemplate: async (id: string, updates: Partial<NotentionTemplate>) => {
        const existingTemplate = get().templates[id];
        if (!existingTemplate) return;

        const updatedTemplate: NotentionTemplate = {
            ...existingTemplate,
            ...updates,
        };

        await DBService.saveTemplate(updatedTemplate);

        set((state) => ({
            templates: { ...state.templates, [id]: updatedTemplate },
        }));
    },
    deleteTemplate: async (id: string) => {
        await DBService.deleteTemplate(id);

        set((state) => {
            const newTemplates = { ...state.templates };
            delete newTemplates[id];

            return { templates: newTemplates };
        });
    },
    setSidebarTab: (tab: AppState["sidebarTab"]) => {
        set({ sidebarTab: tab });
    },
    toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },
    setEditorContent: (content: string) => {
        set({ editorContent: content });
    },
    setIsEditing: (editing: boolean) => {
        set({ isEditing: editing });
    },
    setNoteView: (view: AppState["noteView"]) => {
        set({ noteView: view });
    },
    setLoading: (key: keyof AppState["loading"], loading: boolean) => {
        set((state) => ({
            loading: { ...state.loading, [key]: loading },
        }));
    },
    setError: (key: keyof AppState["errors"], error: string | undefined) => {
        set((state) => ({
            errors: { ...state.errors, [key]: error },
        }));
        if (error) {
            get().addNotification({
                id: uuidv4(),
                type: "error",
                message: `Error: ${key}`,
                description: error,
                timestamp: new Date(),
                timeout: 5000,
            });
        }
    },
    addNotification: (notification: Notification) => {
        set((state) => ({
            notifications: [...state.notifications, notification],
        }));
        if (notification.timeout) {
            setTimeout(() => {
                get().removeNotification(notification.id);
            }, notification.timeout);
        }
    },
    removeNotification: (id: string) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        }));
    },
    initializeNostr: async () => {
        get().setLoading("network", true);
        const userProfile = get().userProfile;
        const defaultRelays = get().nostrRelays;

        try {
            const loaded = await nostrService.loadKeyPair();
            if (loaded) {
                const pk = nostrService.getPublicKey();
                if (userProfile) {
                    userProfile.nostrPubkey = pk!;
                    if (
                        !userProfile.nostrRelays ||
                        userProfile.nostrRelays.length === 0
                    ) {
                        userProfile.nostrRelays = defaultRelays;
                    }
                    await DBService.saveUserProfile(userProfile);
                    set({
                        userProfile,
                        nostrConnected: true,
                        nostrRelays: userProfile.nostrRelays,
                    });
                } else {
                    const newProfile: UserProfile = {
                        nostrPubkey: pk!,
                        sharedTags: [],
                        preferences: {
                            theme: "system",
                            aiEnabled: false,
                            defaultNoteStatus: "draft",
                            ollamaApiEndpoint: "",
                            geminiApiKey: "",
                            aiMatchingSensitivity: 0.7,
                        },
                        nostrRelays: defaultRelays,
                        privacySettings: {
                            sharePublicNotesGlobally: false,
                            shareTagsWithPublicNotes: true,
                            shareValuesWithPublicNotes: true,
                        },
                    };
                    await DBService.saveUserProfile(newProfile);
                    set({
                        userProfile: newProfile,
                        nostrConnected: true,
                        nostrRelays: newProfile.nostrRelays,
                    });
                }
            } else {
                if (userProfile && userProfile.nostrPubkey) {
                    userProfile.nostrPubkey = "";
                    if (!userProfile.privacySettings) {
                        userProfile.privacySettings = {
                            sharePublicNotesGlobally: false,
                            shareTagsWithPublicNotes: true,
                            shareValuesWithPublicNotes: true,
                        };
                    }
                    await DBService.saveUserProfile(userProfile);
                    set({ userProfile, nostrConnected: false });
                } else if (userProfile && !userProfile.privacySettings) {
                    userProfile.privacySettings = {
                        sharePublicNotesGlobally: false,
                        shareTagsWithPublicNotes: true,
                        shareValuesWithPublicNotes: true,
                    };
                    await DBService.saveUserProfile(userProfile);
                    set({ userProfile, nostrConnected: false });
                } else {
                    set({ nostrConnected: false });
                }
            }
        } catch (error: any) {
            get().setError("network", `Failed to initialize Nostr: ${error.message}`);
            set({ nostrConnected: false });
        } finally {
            get().setLoading("network", false);
        }
    },
    setNostrConnected: (status: boolean) => {
        set({ nostrConnected: status });
    },
    generateAndStoreNostrKeys: async (providedSk?: string, providedPk?: string) => {
        get().setLoading("network", true);
        let userProfile = get().userProfile;
        const currentRelaysInStore = get().nostrRelays;
        const defaultPrivacySettings = {
            sharePublicNotesGlobally: false,
            shareTagsWithPublicNotes: true,
            shareValuesWithPublicNotes: true,
        };

        let skToStore: string;
        let pkToStore: string;
        let newlyGeneratedSk: string | undefined = undefined;

        try {
            if (providedSk) {
                skToStore = providedSk;
                pkToStore = providedPk || nostrService.getPublicKey(providedSk);
                if (!pkToStore) {
                    throw new Error(
                        "Could not derive public key from provided private key.",
                    );
                }
            } else {
                const { privateKey: newSk, publicKey: newPk } =
                    nostrService.generateNewKeyPair();
                skToStore = newSk;
                pkToStore = newPk;
                newlyGeneratedSk = newSk;
            }

            await nostrService.storeKeyPair(skToStore, pkToStore);

            if (userProfile) {
                userProfile.nostrPubkey = pkToStore;
                userProfile.nostrRelays =
                    userProfile.nostrRelays && userProfile.nostrRelays.length > 0
                        ? userProfile.nostrRelays
                        : currentRelaysInStore;
                userProfile.privacySettings =
                    userProfile.privacySettings || defaultPrivacySettings;
            } else {
                userProfile = {
                    nostrPubkey: pkToStore,
                    sharedTags: [],
                    preferences: {
                        theme: "system",
                        aiEnabled: false,
                        defaultNoteStatus: "draft",
                        ollamaApiEndpoint: "",
                        geminiApiKey: "",
                        aiMatchingSensitivity: 0.7,
                    },
                    nostrRelays: currentRelaysInStore,
                    privacySettings: defaultPrivacySettings,
                };
            }

            await DBService.saveUserProfile(userProfile);
            set({
                userProfile,
                nostrConnected: true,
                nostrRelays: userProfile.nostrRelays,
            });
            get().setError("network", undefined);
            return { publicKey: pkToStore, privateKey: newlyGeneratedSk };
        } catch (error: any) {
            get().setError(
                "network",
                `Failed to generate/store Nostr keys: ${error.message}`,
            );
            return { publicKey: null, privateKey: undefined };
        } finally {
            get().setLoading("network", false);
        }
    },
    logoutFromNostr: async () => {
        get().setLoading("network", true);
        try {
            const subs = get().activeNostrSubscriptions;
            Object.values(subs).forEach((sub) => nostrService.unsubscribe(sub));

            await nostrService.clearKeyPair();
            set((state) => ({
                userProfile: state.userProfile
                    ? { ...state.userProfile, nostrPubkey: "", nostrPrivkey: undefined }
                    : undefined,
                nostrConnected: false,
                activeNostrSubscriptions: {},
                matches: [],
                directMessages: [],
            }));
            get().setError("network", undefined);
        } catch (error: any) {
            get().setError(
                "network",
                `Error logging out from Nostr: ${error.message}`,
            );
        } finally {
            get().setLoading("network", false);
        }
    },
    publishCurrentNoteToNostr: async (options: { encrypt?: boolean; recipientPk?: string; relays?: string[]; }) => {
        const { currentNoteId, notes, nostrRelays, userProfile } = get();
        if (!currentNoteId || !notes[currentNoteId]) {
            get().setError("network", "No current note selected to publish.");
            return;
        }
        if (
            !userProfile ||
            !userProfile.nostrPubkey ||
            !nostrService.isLoggedIn()
        ) {
            get().setError(
                "network",
                "Not logged in to Nostr. Please generate or load keys.",
            );
            return;
        }

        const privacySettings = userProfile.privacySettings || {
            sharePublicNotesGlobally: false,
            shareTagsWithPublicNotes: true,
            shareValuesWithPublicNotes: true,
        };

        if (!options.encrypt && !privacySettings.sharePublicNotesGlobally) {
            get().setError(
                "network",
                "Public sharing is disabled in your privacy settings.",
            );
            console.error(
                "Cannot publish note publicly: Public sharing is disabled in your privacy settings.",
            );
            return;
        }

        get().setLoading("network", true);
        get().setError("network", undefined);
        try {
            const noteToPublish = notes[currentNoteId];
            const relaysToUse = options.relays || nostrRelays;

            const recipient = options.encrypt
                ? options.recipientPk || userProfile.nostrPubkey
                : undefined;

            if (options.encrypt && !recipient) {
                throw new Error("Recipient public key is required for encryption.");
            }

            await nostrService.publishNote(
                noteToPublish,
                relaysToUse,
                options.encrypt,
                recipient,
                privacySettings,
            );

            if (!options.encrypt && privacySettings.sharePublicNotesGlobally) {
                await get().updateNote(currentNoteId, {
                    status: "published",
                    isSharedPublicly: true,
                });
            } else if (options.encrypt) {
                await get().updateNote(currentNoteId, { status: "published" });
            }
        } catch (error: any) {
            get().setError("network", `Failed to publish note: ${error.message}`);
            console.error(`Failed to publish note: ${error.message}`);
        } finally {
            get().setLoading("network", false);
        }
    },
    subscribeToPublicNotes: (relays?: string[]) => {
        if (!nostrService.isLoggedIn()) {
        }
        const relaysToUse = relays || get().nostrRelays;
        const filters: Filter[] = [{ kinds: [1], limit: 20 }];
        const subId = `public_notes_${Date.now()}`;

        try {
            const subscription = nostrService.subscribeToEvents(
                filters,
                (event) => get().handleIncomingNostrEvent(event as NostrEvent),
                relaysToUse,
                subId,
            );
            if (subscription) {
                set((state) => ({
                    activeNostrSubscriptions: {
                        ...state.activeNostrSubscriptions,
                        [subId]: subscription,
                    },
                }));
                return subId;
            }
            return null;
        } catch (error: any) {
            get().setError(
                "network",
                `Error subscribing to public notes: ${error.message}`,
            );
            return null;
        }
    },
    subscribeToTopic: (topic: string, relays?: string[]) => {
        if (!nostrService.isLoggedIn()) {
            get().setError("network", "Login to Nostr to subscribe to topics.");
            return null;
        }
        const relaysToUse = relays || get().nostrRelays;
        const filters: Filter[] = [
            {
                kinds: [1],
                "#t": [topic.startsWith("#") ? topic.substring(1) : topic],
                limit: 50,
            },
        ];
        const subId = `topic_${topic.replace("#", "")}_${Date.now()}`;

        try {
            const subscription = nostrService.subscribeToEvents(
                filters,
                (event) => get().handleIncomingNostrEvent(event as NostrEvent),
                relaysToUse,
                subId,
            );
            if (subscription) {
                set((state) => ({
                    activeNostrSubscriptions: {
                        ...state.activeNostrSubscriptions,
                        [subId]: subscription,
                    },
                }));
                return subId;
            }
            return null;
        } catch (error: any) {
            get().setError(
                "network",
                `Error subscribing to topic ${topic}: ${error.message}`,
            );
            return null;
        }
    },
    unsubscribeFromNostr: (subscriptionIdOrObject: string | any) => {
        const state = get();
        let subObject;
        let subKey = "";

        if (typeof subscriptionIdOrObject === "string") {
            subKey = subscriptionIdOrObject;
            subObject = state.activeNostrSubscriptions[subKey];
        } else if (
            subscriptionIdOrObject &&
            typeof subscriptionIdOrObject.unsub === "function"
        ) {
            subObject = subscriptionIdOrObject;
            const entry = Object.entries(state.activeNostrSubscriptions).find(
                ([, s]) => s === subObject,
            );
            if (entry) subKey = entry[0];
        }

        if (subObject) {
            nostrService.unsubscribe(subObject);
            if (subKey) {
                set((s) => {
                    const newSubs = { ...s.activeNostrSubscriptions };
                    delete newSubs[subKey];
                    return { activeNostrSubscriptions: newSubs };
                });
            }
        } else {
            console.warn(
                "Subscription not found or already unsubscribed:",
                subscriptionIdOrObject,
            );
        }
    },
    addDirectMessage: (message: DirectMessage) => {
        set((state) => ({ directMessages: [...state.directMessages, message] }));
        DBService.saveMessage(message);
    },
    setNostrRelays: async (newRelays: string[]) => {
        const state = get();
        const userProfile = state.userProfile;

        if (userProfile) {
            const updatedProfile = { ...userProfile, nostrRelays: newRelays };
            await state.updateUserProfile(updatedProfile);
            set({ nostrRelays: newRelays });
        } else {
            console.warn(
                "Attempted to set Nostr relays without an active user profile. Relays not persisted to profile.",
            );
            set({ nostrRelays: newRelays });
        }
    },
    addNostrRelay: async (relayUrl: string) => {
        if (!get().nostrRelays.includes(relayUrl)) {
            const newRelays = [...get().nostrRelays, relayUrl];
            await get().setNostrRelays(newRelays);
        }
    },
    removeNostrRelay: async (relayUrl: string) => {
        const newRelays = get().nostrRelays.filter((r) => r !== relayUrl);
        await get().setNostrRelays(newRelays);
    },
    handleIncomingNostrEvent: async (event: NostrEvent) => {
        console.log("Received Nostr Event:", event);
        const state = get();
        const currentUserPubkey = state.userProfile?.nostrPubkey;

        if (event.kind === 4 && currentUserPubkey) {
            const recipientTag = event.tags.find(
                (tag) => tag[0] === "p" && tag[1] === currentUserPubkey,
            );
            if (recipientTag) {
                try {
                    const decryptedContent = await nostrService.decryptMessage(
                        event.content,
                        event.pubkey,
                    );
                    const dm: DirectMessage = {
                        id: event.id,
                        from: event.pubkey,
                        to: currentUserPubkey,
                        content: decryptedContent,
                        timestamp: new Date(event.created_at * 1000),
                        encrypted: true,
                    };
                    state.addDirectMessage(dm);
                    await DBService.saveMessage(dm);
                } catch (error) {
                    console.error("Failed to decrypt DM:", error, event);
                }
            }
        }
        else if (event.kind === 1) {
            const eventTags = event.tags
                .filter((t) => t[0] === "t")
                .map((t) => `#${t[1]}`);
            const subscribedTopics = Object.keys(get().activeTopicSubscriptions);

            let matchedTopic: string | null = null;
            for (const topic of subscribedTopics) {
                if (
                    eventTags.includes(topic) ||
                    eventTags.includes(topic.substring(1))
                ) {
                    matchedTopic = topic;
                    break;
                }
            }

            if (matchedTopic) {
                get().addNoteToTopic(matchedTopic, event as NostrEvent);
            }

            const potentialNote: Partial<Note & { originalEvent: NostrEvent }> = {
                id: `nostr-${event.id}`,
                title:
                    event.tags.find((t) => t[0] === "title")?.[1] ||
                    event.content.substring(0, 30),
                content: event.content,
                tags: eventTags,
                status: "published",
                createdAt: new Date(event.created_at * 1000),
                updatedAt: new Date(event.created_at * 1000),
                originalEvent: event as NostrEvent,
            };

            if (
                currentUserPubkey &&
                event.pubkey !== currentUserPubkey &&
                potentialNote.tags &&
                potentialNote.tags.length > 0
            ) {
                const localNotesArray = Object.values(state.notes);
                const ontologyTree = state.ontology;
                let bestMatchForEvent: Match | null = null;

                for (const localNote of localNotesArray) {
                    if (localNote.tags && localNote.tags.length > 0) {
                        const localSemanticTags = new Set<string>();
                        localNote.tags.forEach((tag) =>
                            OntologyService.getSemanticMatches(ontologyTree, tag).forEach(
                                (st) => localSemanticTags.add(st.toLowerCase()),
                            ),
                        );

                        const incomingSemanticTags = new Set<string>();
                        (potentialNote.tags || []).forEach((tag) =>
                            OntologyService.getSemanticMatches(ontologyTree, tag).forEach(
                                (st) => incomingSemanticTags.add(st.toLowerCase()),
                            ),
                        );

                        const commonSemanticTags = [...localSemanticTags].filter((t) =>
                            incomingSemanticTags.has(t),
                        );

                        if (commonSemanticTags.length > 0) {
                            const literalSharedOriginalTags = (
                                potentialNote.tags || []
                            ).filter((incomingTag) =>
                                localNote.tags
                                    .map((lt) => lt.toLowerCase())
                                    .includes(incomingTag.toLowerCase()),
                            );

                            const unionSize = new Set([
                                ...localSemanticTags,
                                ...incomingSemanticTags,
                            ]).size;
                            const similarityScore =
                                unionSize > 0 ? commonSemanticTags.length / unionSize : 0;

                            if (
                                !bestMatchForEvent ||
                                similarityScore > bestMatchForEvent.similarity
                            ) {
                                const existingMatchForThisRemoteNote = state.matches.find(
                                    (m) => m.targetNoteId === event.id,
                                );
                                if (
                                    existingMatchForThisRemoteNote &&
                                    existingMatchForThisRemoteNote.similarity >= similarityScore
                                ) {
                                    continue;
                                }

                                bestMatchForEvent = {
                                    id: `match-${localNote.id}-${event.id}`,
                                    localNoteId: localNote.id,
                                    targetNoteId: event.id,
                                    targetAuthor: event.pubkey,
                                    similarity: similarityScore,
                                    sharedTags: literalSharedOriginalTags.slice(0, 5),
                                    sharedValues: [],
                                    timestamp: new Date(event.created_at * 1000),
                                    matchType: "nostr",
                                };
                            }
                        }
                    }
                }

                for (const localNote of localNotesArray) {
                    let bestTagMatchForThisPair: Match | null = null;

                    if (
                        potentialNote.tags &&
                        potentialNote.tags.length > 0 &&
                        localNote.tags &&
                        localNote.tags.length > 0
                    ) {
                        const localSemanticTags = new Set<string>();
                        localNote.tags.forEach((tag) =>
                            OntologyService.getSemanticMatches(ontologyTree, tag).forEach(
                                (st) => localSemanticTags.add(st.toLowerCase()),
                            ),
                        );
                        const incomingSemanticTags = new Set<string>();
                        (potentialNote.tags || []).forEach((tag) =>
                            OntologyService.getSemanticMatches(ontologyTree, tag).forEach(
                                (st) => incomingSemanticTags.add(st.toLowerCase()),
                            ),
                        );
                        const commonSemanticTags = [...localSemanticTags].filter((t) =>
                            incomingSemanticTags.has(t),
                        );

                        if (commonSemanticTags.length > 0) {
                            const literalSharedOriginalTags = (
                                potentialNote.tags || []
                            ).filter((incomingTag) =>
                                localNote.tags
                                    .map((lt) => lt.toLowerCase())
                                    .includes(incomingTag.toLowerCase()),
                            );
                            const unionSize = new Set([
                                ...localSemanticTags,
                                ...incomingSemanticTags,
                            ]).size;
                            const similarityScore =
                                unionSize > 0 ? commonSemanticTags.length / unionSize : 0;

                            if (similarityScore > 0.05) {
                                bestTagMatchForThisPair = {
                                    id: `match-${localNote.id}-${event.id}`,
                                    localNoteId: localNote.id,
                                    targetNoteId: event.id,
                                    targetAuthor: event.pubkey,
                                    similarity: similarityScore,
                                    sharedTags: literalSharedOriginalTags.slice(0, 5),
                                    sharedValues: [],
                                    timestamp: new Date(event.created_at * 1000),
                                    matchType: "nostr",
                                };
                            }
                        }
                    }

                    if (bestTagMatchForThisPair) {
                        const oldTagMatchIndex = state.matches.findIndex(
                            (m) =>
                                m.targetNoteId === event.id &&
                                m.localNoteId === localNote.id &&
                                m.matchType === "nostr",
                        );
                        if (oldTagMatchIndex !== -1) {
                            if (
                                state.matches[oldTagMatchIndex].similarity <
                                bestTagMatchForThisPair.similarity
                            ) {
                                state.matches.splice(oldTagMatchIndex, 1);
                                state.addMatch(bestTagMatchForThisPair);
                            }
                        } else {
                            state.addMatch(bestTagMatchForThisPair);
                        }
                    }

                    const remoteEmbeddingTagValue = event.tags.find(
                        (tag) => tag[0] === "embedding",
                    )?.[1];
                    if (
                        remoteEmbeddingTagValue &&
                        localNote.embedding &&
                        localNote.embedding.length > 0
                    ) {
                        try {
                            const remoteEmbedding = JSON.parse(
                                remoteEmbeddingTagValue,
                            ) as number[];
                            if (
                                Array.isArray(remoteEmbedding) &&
                                remoteEmbedding.length > 0 &&
                                remoteEmbedding.every((n) => typeof n === "number")
                            ) {
                                const similarity = NoteService.cosineSimilarity(
                                    remoteEmbedding,
                                    localNote.embedding,
                                );
                                const similarityThreshold =
                                    state.userProfile?.preferences.aiMatchingSensitivity ?? 0.7;

                                if (similarity >= similarityThreshold) {
                                    const existingEmbeddingMatchIndex = state.matches.findIndex(
                                        (m) =>
                                            m.targetNoteId === event.id &&
                                            m.localNoteId === localNote.id &&
                                            m.matchType === "embedding",
                                    );

                                    const embeddingMatch: Match = {
                                        id: `embedmatch-nostr-${localNote.id}-${event.id}`,
                                        localNoteId: localNote.id,
                                        targetNoteId: event.id,
                                        targetAuthor: event.pubkey,
                                        similarity: similarity,
                                        sharedTags: localNote.tags.filter((lt) =>
                                            (potentialNote.tags || []).includes(lt),
                                        ),
                                        sharedValues: [],
                                        timestamp: new Date(event.created_at * 1000),
                                        matchType: "embedding",
                                    };

                                    if (existingEmbeddingMatchIndex !== -1) {
                                        if (
                                            state.matches[existingEmbeddingMatchIndex].similarity <
                                            similarity
                                        ) {
                                            state.matches.splice(existingEmbeddingMatchIndex, 1);
                                            state.addMatch(embeddingMatch);
                                        }
                                    } else {
                                        state.addMatch(embeddingMatch);
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn(
                                "Failed to parse or process embedding from Nostr event tag for a local note:",
                                e,
                                event,
                            );
                        }
                    }
                }
            }
        }
    },
    setLastSyncTimestamp: (timestamp: Date) => {
        set({ lastSyncTimestamp: timestamp });
    },
    syncWithNostr: async (forceFullSync = false) => {
        const {
            setLoading,
            setError,
            userProfile,
            lastSyncTimestamp,
            notes,
            ontology,
            setLastSyncTimestamp: recordSyncTime,
        } = get();
        if (!navigator.onLine) {
            setError("sync", "Cannot sync: Application is offline.");
            return;
        }
        if (
            !userProfile ||
            !userProfile.nostrPubkey ||
            !nostrService.isLoggedIn()
        ) {
            setError("sync", "Cannot sync: User not logged into Nostr.");
            return;
        }
        if (!userProfile) {
            return;
        }

        setLoading("sync", true);
        setError("sync", undefined);

        try {
            const currentSyncTime = new Date();
            const relays = userProfile.nostrRelays || get().nostrRelays;

            const remoteOntology = await nostrService.fetchSyncedOntology(relays);
            if (remoteOntology && remoteOntology.updatedAt) {
                const localOntology = ontology;
                const remoteDate = new Date(remoteOntology.updatedAt);
                if (
                    !localOntology.updatedAt ||
                    remoteDate > new Date(localOntology.updatedAt)
                ) {
                    await DBService.saveOntology(remoteOntology);
                    set({ ontology: remoteOntology });
                } else if (
                    localOntology.updatedAt &&
                    new Date(localOntology.updatedAt) > remoteDate
                ) {
                    await nostrService.publishOntologyForSync(localOntology, relays);
                    await DBService.setOntologyNeedsSync(false);
                }
            } else {
                if (
                    (await DBService.getOntologyNeedsSync()) ||
                    (ontology.updatedAt && forceFullSync)
                ) {
                    await nostrService.publishOntologyForSync(ontology, relays);
                    await DBService.setOntologyNeedsSync(false);
                }
            }

            if (await DBService.getOntologyNeedsSync()) {
                const localOntology = (await DBService.getOntology()) || ontology;
                if (localOntology.updatedAt) {
                    await nostrService.publishOntologyForSync(localOntology, relays);
                    await DBService.setOntologyNeedsSync(false);
                }
            }

            const since = forceFullSync
                ? undefined
                : lastSyncTimestamp
                    ? Math.floor(lastSyncTimestamp.getTime() / 1000)
                    : undefined;
            const remoteNotes = await nostrService.fetchSyncedNotes(since, relays);
            let localNotesChanged = false;

            for (const remoteNote of remoteNotes) {
                const localNote = notes[remoteNote.id];
                const remoteNoteUpdatedAt = new Date(remoteNote.updatedAt || 0);

                if (
                    !localNote ||
                    remoteNoteUpdatedAt > new Date(localNote.updatedAt || 0)
                ) {
                    const sanitizedContent = DOMPurify.sanitize(remoteNote.content);
                    const noteToSave = { ...remoteNote, content: sanitizedContent };

                    await DBService.saveNote(noteToSave);
                    set((s) => ({ notes: { ...s.notes, [remoteNote.id]: noteToSave } }));
                    localNotesChanged = true;
                }
            }
            if (localNotesChanged) {
                const { currentNoteId, setCurrentNote } = get();
                if (currentNoteId && notes[currentNoteId]) {
                    setCurrentNote(currentNoteId);
                }
            }

            const pendingNoteOps = await DBService.getPendingNoteSyncOps();
            for (const op of pendingNoteOps) {
                if (op.action === "save") {
                    const noteToSync = await DBService.getNote(op.noteId);
                    if (noteToSync) {
                        const correspondingRemoteNote = remoteNotes.find(
                            (rn) => rn.id === noteToSync.id,
                        );
                        if (
                            correspondingRemoteNote &&
                            new Date(noteToSync.updatedAt) <
                            new Date(correspondingRemoteNote.updatedAt)
                        ) {
                            await DBService.removeNoteFromSyncQueue(op.noteId);
                            continue;
                        }
                        const publishedEventIds = await nostrService.publishNoteForSync(
                            noteToSync,
                            relays,
                        );
                        if (publishedEventIds.length > 0 && publishedEventIds[0]) {
                            if (noteToSync.nostrSyncEventId !== publishedEventIds[0]) {
                                const noteWithSyncId = {
                                    ...noteToSync,
                                    nostrSyncEventId: publishedEventIds[0],
                                };
                                await DBService.saveNote(noteWithSyncId);
                                set((s) => ({
                                    notes: { ...s.notes, [noteToSync.id]: noteWithSyncId },
                                }));
                            }
                            await DBService.removeNoteFromSyncQueue(op.noteId);
                        } else {
                        }
                    }
                } else if (op.action === "delete") {
                    const eventIdToDelete =
                        op.nostrEventId ||
                        (await DBService.getNote(op.noteId))?.nostrSyncEventId;
                    if (eventIdToDelete) {
                        try {
                            await nostrService.publishDeletionEvent(
                                [eventIdToDelete],
                                "Note deleted by user during sync.",
                                relays,
                            );
                            await DBService.removeNoteFromSyncQueue(op.noteId);
                        } catch (e) {
                        }
                    } else {
                        await DBService.removeNoteFromSyncQueue(op.noteId);
                    }
                }
            }
            recordSyncTime(currentSyncTime);

            if (userProfile) {
                const remoteContacts = await nostrService.fetchContacts(relays);
                if (remoteContacts) {
                    const localContacts = userProfile.contacts || [];
                    const newContacts = [...localContacts];
                    remoteContacts.forEach((rc) => {
                        if (!localContacts.some((lc) => lc.pubkey === rc.pubkey)) {
                            newContacts.push(rc);
                        }
                    });
                    if (newContacts.length > localContacts.length) {
                        await get().updateUserProfile({
                            ...userProfile,
                            contacts: newContacts,
                        });
                    }
                }
            }

            const remoteDeletionEvents = await nostrService.fetchOwnDeletionEvents(
                since,
                relays,
            );
            if (remoteDeletionEvents && remoteDeletionEvents.length > 0) {
                const currentNotes = get().notes;
                let notesWereDeleted = false;
                for (const deletionEvent of remoteDeletionEvents) {
                    const eventIdsToDelete = deletionEvent.tags
                        .filter((tag) => tag[0] === "e")
                        .map((tag) => tag[1]);
                    for (const eventIdToDelete of eventIdsToDelete) {
                        const noteIdToDeleteLocally = Object.keys(currentNotes).find(
                            (noteId) =>
                                currentNotes[noteId]?.nostrSyncEventId === eventIdToDelete,
                        );

                        if (noteIdToDeleteLocally) {
                            await DBService.deleteNote(noteIdToDeleteLocally);
                            set((s) => {
                                const newNotes = { ...s.notes };
                                delete newNotes[noteIdToDeleteLocally];
                                const newState: Partial<AppState> = { notes: newNotes };
                                if (s.currentNoteId === noteIdToDeleteLocally) {
                                    newState.currentNoteId = undefined;
                                    newState.editorContent = "";
                                    newState.isEditing = false;
                                }
                                return newState;
                            });
                            notesWereDeleted = true;
                            await DBService.removeNoteFromSyncQueue(noteIdToDeleteLocally);
                        }
                    }
                }
                if (notesWereDeleted) {
                }
            }
        } catch (error: any) {
            console.error("Nostr sync failed:", error);
            setError("sync", `Sync failed: ${error.message}`);
        } finally {
            setLoading("sync", false);
        }
    },
    sendDirectMessage: async (recipientPk: string, content: string) => {
        const { userProfile, nostrRelays, addDirectMessage } = get();
        if (
            !userProfile ||
            !userProfile.nostrPubkey ||
            !nostrService.isLoggedIn()
        ) {
            throw new Error("User not logged in or Nostr keys not available.");
        }
        if (!recipientPk || !content.trim()) {
            throw new Error("Recipient public key and message content are required.");
        }

        get().setLoading("network", true);
        get().setError("network", undefined);

        try {
            const tempNoteForDM: Note = {
                id: `dm-temp-${Date.now()}`,
                title: "",
                content: content.trim(),
                tags: [],
                values: {},
                fields: {},
                status: "draft",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const publishedEventIds = await nostrService.publishNote(
                tempNoteForDM,
                nostrRelays,
                true,
                recipientPk,
            );

            if (publishedEventIds.length === 0) {
                throw new Error("Message failed to publish to any relay.");
            }
            const eventId = publishedEventIds[0];

            const sentDm: DirectMessage = {
                id: eventId,
                from: userProfile.nostrPubkey,
                to: recipientPk,
                content: content.trim(),
                timestamp: new Date(),
                encrypted: true,
            };
            addDirectMessage(sentDm);
            await DBService.saveMessage(sentDm);
        } catch (error: any) {
            console.error("Failed to send direct message:", error);
            get().setError("network", `Failed to send DM: ${error.message}`);
            throw error;
        } finally {
            get().setLoading("network", false);
        }
    },
    subscribeToDirectMessages: (relays?: string[]) => {
        const { userProfile, nostrRelays, handleIncomingNostrEvent } = get();
        if (
            !userProfile ||
            !userProfile.nostrPubkey ||
            !nostrService.isLoggedIn()
        ) {
            get().setError("network", "Cannot subscribe to DMs: User not logged in.");
            return null;
        }

        const relaysToUse = relays || nostrRelays;
        if (relaysToUse.length === 0) {
            get().setError(
                "network",
                "Cannot subscribe to DMs: No relays configured.",
            );
            return null;
        }

        const filters: Filter[] = [
            { kinds: [4], "#p": [userProfile.nostrPubkey], limit: 50 },
            { kinds: [4], authors: [userProfile.nostrPubkey], limit: 50 },
        ];
        const subId = `direct_messages_${userProfile.nostrPubkey.substring(0, 8)}_${Date.now()}`;

        try {
            const subscription = nostrService.subscribeToEvents(
                filters,
                (event) => handleIncomingNostrEvent(event as NostrEvent),
                relaysToUse,
                subId,
            );
            if (subscription) {
                set((state) => ({
                    activeNostrSubscriptions: {
                        ...state.activeNostrSubscriptions,
                        [subId]: subscription,
                    },
                }));
                return subId;
            }
            return null;
        } catch (error: any) {
            get().setError(
                "network",
                `Error subscribing to direct messages: ${error.message}`,
            );
            console.error(`Error subscribing to direct messages: ${error.message}`);
            return null;
        }
    },
    addTopicSubscription: (topic: string, subscriptionId: string) => {
        set((state) => ({
            activeTopicSubscriptions: {
                ...state.activeTopicSubscriptions,
                [topic]: subscriptionId,
            },
            topicNotes: {
                ...state.topicNotes,
                [topic]: state.topicNotes[topic] || [],
            },
        }));
    },
    findAndSetEmbeddingMatches: async (
        noteId: string,
        similarityThreshold: number = 0.7,
    ) => {
        const { notes, setLoading, setError, userProfile } = get();
        const targetNote = notes[noteId];

        if (!targetNote) {
            setError("network", "Target note for embedding match not found.");
            return;
        }
        if (!userProfile?.preferences.aiEnabled) {
            setError(
                "network",
                "AI features are not enabled. Cannot find embedding matches.",
            );
            return;
        }
        if (!targetNote.embedding || targetNote.embedding.length === 0) {
            setError(
                "network",
                `Note "${targetNote.title}" does not have an embedding. Cannot find similar notes.`,
            );
            return;
        }

        setLoading("network", true);
        setError("network", undefined);

        try {
            const similarNoteResults = await NoteService.getSimilarNotesGlobally(
                targetNote.id,
                similarityThreshold,
            );

            const newEmbeddingMatches: Match[] = similarNoteResults.map((result) => ({
                id: `embedmatch-${targetNote.id}-${result.note.id}`,
                localNoteId: result.note.id,
                targetNoteId: result.note.id,
                targetAuthor: userProfile.nostrPubkey || "local",
                similarity: result.similarity,
                sharedTags: result.note.tags.filter((tag) =>
                    targetNote.tags.includes(tag),
                ),
                sharedValues: {},
                timestamp: result.note.updatedAt,
                matchType: "embedding",
            }));

            set({
                embeddingMatches: newEmbeddingMatches,
                loading: { ...get().loading, network: false },
            });
        } catch (error: any) {
            console.error("Failed to find embedding matches:", error);
            setError("network", `Failed to find embedding matches: ${error.message}`);
        } finally {
            setLoading("network", false);
        }
    },
    removeTopicSubscription: (topic: string) => {
        set((state) => {
            const newActiveTopicSubscriptions = { ...state.activeTopicSubscriptions };
            delete newActiveTopicSubscriptions[topic];
            return {
                activeTopicSubscriptions: newActiveTopicSubscriptions,
            };
        });
    },
    addNoteToTopic: (topic: string, note: NostrEvent) => {
        set((state) => {
            const currentNotesForTopic = state.topicNotes[topic] || [];
            if (currentNotesForTopic.find((n) => n.id === note.id)) {
                return state;
            }
            return {
                topicNotes: {
                    ...state.topicNotes,
                    [topic]: [note, ...currentNotesForTopic].slice(0, 100),
                },
            };
        });
    },
    setContacts: (contacts: Contact[]) => {
        const { userProfile, updateUserProfile } = get();
        if (userProfile) {
            updateUserProfile({ ...userProfile, contacts });
        }
    },
    addContact: async (contact: Contact) => {
        const { userProfile, updateUserProfile } = get();
        if (!userProfile) return;

        const existingContacts = userProfile.contacts || [];
        if (existingContacts.find((c) => c.pubkey === contact.pubkey)) {
            const updatedContacts = existingContacts.map((c) =>
                c.pubkey === contact.pubkey
                    ? { ...c, ...contact, lastContact: new Date() }
                    : c,
            );
            await updateUserProfile({ ...userProfile, contacts: updatedContacts });
            return;
        }

        const newContact = {
            ...contact,
            lastContact: contact.lastContact || new Date(),
        };
        const updatedContacts = [...existingContacts, newContact];
        await updateUserProfile({ ...userProfile, contacts: updatedContacts });
        await get().syncContactsWithNostr();
    },
    removeContact: async (pubkey: string) => {
        const { userProfile, updateUserProfile } = get();
        if (!userProfile || !userProfile.contacts) return;

        const updatedContacts = userProfile.contacts.filter(
            (c) => c.pubkey !== pubkey,
        );
        await updateUserProfile({ ...userProfile, contacts: updatedContacts });
        await get().syncContactsWithNostr();
    },
    updateContactAlias: async (pubkey: string, alias: string) => {
        const { userProfile, updateUserProfile } = get();
        if (!userProfile || !userProfile.contacts) return;

        const updatedContacts = userProfile.contacts.map((c) =>
            c.pubkey === pubkey ? { ...c, alias } : c,
        );
        await updateUserProfile({ ...userProfile, contacts: updatedContacts });
        await get().syncContactsWithNostr();
    },
    syncContactsWithNostr: async () => {
        const { userProfile, nostrRelays } = get();
        if (
            !userProfile ||
            !userProfile.nostrPubkey ||
            !nostrService.isLoggedIn()
        ) {
            return;
        }

        try {
            await nostrService.publishContactList(
                userProfile.contacts || [],
                nostrRelays,
            );
        } catch (error) {
            console.error("Failed to sync contacts with Nostr:", error);
        }
    },
    moveOntologyNode: (
        nodeId: string,
        newParentId: string | undefined,
        newIndex: number,
    ) => {
        const { ontology, setOntology } = get();
        if (!ontology) return;

        const newOntology = OntologyService.moveNode(
            ontology,
            nodeId,
            newParentId,
            newIndex,
        );

        setOntology(newOntology);
    },
    moveFolder: async (folderId: string, targetFolderId: string) => {
        const { updateFolder } = get();
        await updateFolder(folderId, { parentId: targetFolderId });
    },
    updateUserProfile: async (profileUpdates: Partial<UserProfile>) => {
        const { userProfile } = get();
        if (userProfile) {
            const updatedProfile = { ...userProfile, ...profileUpdates };
            await DBService.saveUserProfile(updatedProfile);
            set({ userProfile: updatedProfile });
            get().getAIService().preferences = updatedProfile.preferences;
            get().getAIService().reinitializeModels();
        }
    },
    createProfileNote: async () => {
        const { createNote, updateUserProfile, userProfile } = get();
        if (userProfile && !userProfile.profileNoteId) {
            const noteId = await createNote({
                title: "User Profile",
                tags: ["#profile"],
                content: "This is your user profile.",
            });
            await updateUserProfile({ profileNoteId: noteId });
        }
    },
    loadFolders: async () => {
        try {
            const foldersList = await FolderService.getAllFolders();
            const foldersMap: { [id: string]: Folder } = {};
            foldersList.forEach((folder) => (foldersMap[folder.id] = folder));
            set({ folders: foldersMap });
        } catch (error) {
            console.error("Failed to load folders:", error);
            get().setError("notes", `Failed to load folders: ${(error as Error).message}`);
        }
    },
    getAIService: () => {
        const aiService = new AIService();
        aiService.preferences = get().userProfile?.preferences;
        aiService.reinitializeModels();
        return aiService;
    },
    getNotesByFolder: (folderId: string) => {
        const { notes } = get();
        return Object.values(notes).filter((note) => note.folderId === folderId);
    },
    addMatch: (match: Match) => {
        set((state) => ({ matches: [...state.matches, match] }));
    },
    nostrService: nostrService,
    networkService: networkService,
    setTheme: (theme: "light" | "dark" | "system" | "solarized" | "nord") => {
        const { userProfile, updateUserProfile } = get();
        if (userProfile) {
            const newPreferences = { ...userProfile.preferences, theme };
            updateUserProfile({ ...userProfile, preferences: newPreferences });
        }
    },
});
