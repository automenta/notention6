import {useAppStore} from "../store";
import {Note, OntologyTree} from "../../shared/types";
import {nostrService} from "./NostrService";

export class NetworkService {
    private static instance: NetworkService;
    private unsubscribe: (() => void) | null = null;

    private constructor() {
    }

    public static getInstance(): NetworkService {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService();
        }
        return NetworkService.instance;
    }

    public startMatching(ontology: OntologyTree, allNotes: Note[]) {
        if (this.unsubscribe) {
            this.stopMatching();
        }

        const onMatch = (localNote: Note, remoteNote: Note, similarity: number) => {
            const {addMatch, addNotification} = useAppStore.getState();
            addMatch(localNote.id, remoteNote, similarity);
            addNotification({
                id: `match-${localNote.id}-${remoteNote.id}`,
                type: "success",
                message: `New match for "${localNote.title}"`,
                description: `Found a note with ${Math.round(
                    similarity * 100,
                )}% similarity.`,
                timestamp: new Date(),
            });
        };

        const sub = nostrService.findMatchingNotes(ontology, onMatch, allNotes);
        this.unsubscribe = () => sub.unsub();
    }

    public stopMatching() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

export const networkService = NetworkService.getInstance();
