import { useAppStore } from "../store";
import { DirectMessage } from "../../shared/types";
import { nostrService } from "./NostrService";
import { Event } from "nostr-tools";
import { nip04 } from "nostr-tools";

export class ChatService {
    static async sendMessage(
        pubkey: string,
        content: string,
    ): Promise<DirectMessage> {
        const { nostrService: appNostrService } = useAppStore.getState();
        const nostr = appNostrService || nostrService;
        const event = await nostr.sendDirectMessage(pubkey, content);
        return {
            id: event.id,
            from: event.pubkey,
            to: pubkey,
            content,
            timestamp: new Date(event.created_at * 1000),
            encrypted: true,
        };
    }

    static subscribeToMessages(
        pubkey: string,
        onMessage: (message: DirectMessage) => void,
    ) {
        const { nostrService: appNostrService } = useAppStore.getState();
        const nostr = appNostrService || nostrService;
        nostr.subscribeToDirectMessages(pubkey, async (event) => {
            const { userProfile } = useAppStore.getState();
            if (userProfile?.nostrPrivkey) {
                const content = await nip04.decrypt(
                    userProfile.nostrPrivkey,
                    event.pubkey,
                    event.content,
                );
                const message: DirectMessage = {
                    id: event.id,
                    from: event.pubkey,
                    to: pubkey,
                    content,
                    timestamp: new Date(event.created_at * 1000),
                    encrypted: true,
                };
                onMessage(message);
            }
        });
    }

    static sendPublicMessage(content: string): Promise<DirectMessage> {
        const { nostrService: appNostrService } = useAppStore.getState();
        const nostr = appNostrService || nostrService;
        return nostr.publishNote({
            id: '',
            title: '',
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'published',
            tags: [],
            values: {},
            fields: {},
            pinned: false,
            archived: false,
        }).then(event => {
            return {
                id: event[0],
                from: nostr.getPublicKey() || '',
                to: 'public',
                content,
                timestamp: new Date(),
                encrypted: false,
            };
        });
    }

    static subscribeToPublicMessages(onMessage: (message: DirectMessage) => void) {
        const { nostrService: appNostrService } = useAppStore.getState();
        const nostr = appNostrService || nostrService;
        nostr.subscribeToEvents([{ kinds: [1] }], (event) => {
            const message: DirectMessage = {
                id: event.id,
                from: event.pubkey,
                to: 'public',
                content: event.content,
                timestamp: new Date(event.created_at * 1000),
                encrypted: false,
            };
            onMessage(message);
        });
    }
}
