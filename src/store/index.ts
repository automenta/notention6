import { create } from 'zustand';
import { AppState } from '../../shared/types';
import { createAppActions, AppActions } from './actions';
import { createSelectors } from './selectors';

export const isOnline = () => navigator.onLine;

const initialState: AppState = {
    notes: {},
    ontology: { nodes: {}, rootIds: [], updatedAt: new Date() },
    userProfile: undefined,
    folders: {},
    templates: {},
    currentNoteId: undefined,
    sidebarTab: "dashboard",
    sidebarCollapsed: false,
    searchQuery: "",
    searchFilters: {},
    noteView: "all",
    matches: [],
    directMessages: [],
    embeddingMatches: [],
    nostrRelays: [
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.snort.social",
    ],
    nostrConnected: false,
    activeNostrSubscriptions: {},
    activeTopicSubscriptions: {},
    topicNotes: {},
    editorContent: "",
    isEditing: false,
    loading: {
        notes: false,
        ontology: false,
        network: false,
        sync: false,
    },
    errors: {
        notes: undefined,
        ontology: undefined,
        network: undefined,
        sync: undefined,
    },
    notifications: [],
    lastSyncTimestamp: undefined,
};

const useAppStore = create<AppState & AppActions>((set, get) => ({
    ...initialState,
    ...createAppActions(set, get),
}));

export const useStore = createSelectors(useAppStore);
