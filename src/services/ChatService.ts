import { DirectMessage, NostrEvent } from "../../shared/types";
import { useStore } from "../store";
import { nostrService } from "./NostrService";

export class ChatService {
  static async sendMessage(
    pubkey: string,
    content: string,
  ): Promise<DirectMessage> {
    const { nostrService: appNostrService } = useStore.getState();
    const nostr = appNostrService || nostrService;
    const event = await nostr.sendDirectMessage(pubkey, content);
    return {
      id: event.id,
      to: pubkey,
      from: nostr.getPublicKey()!,
      content,
      createdAt: new Date(event.created_at * 1000),
      encrypted: true,
    };
  }

  static subscribeToMessages(
    pubkey: string,
    onMessage: (message: DirectMessage) => void,
  ) {
    const { nostrService: appNostrService } = useStore.getState();
    const nostr = appNostrService || nostrService;
    nostr.subscribeToDirectMessages(pubkey, async (event) => {
      try {
        const content = await nostr.decryptMessage(
          event.content,
          event.pubkey,
        );
        onMessage({
          id: event.id,
          to: nostr.getPublicKey()!,
          from: event.pubkey,
          content,
          createdAt: new Date(event.created_at * 1000),
          encrypted: true,
        });
      } catch (error) {
        console.error("Failed to decrypt message:", error);
      }
    });
  }

  static async sendPublicMessage(content: string): Promise<DirectMessage> {
    const { nostrService: appNostrService } = useStore.getState();
    const nostr = appNostrService || nostrService;
    const eventIds = await nostr.publishEvent(42, content, [["c", "public"]]);
    return {
      id: eventIds[0],
      to: "public",
      from: nostr.getPublicKey()!,
      content,
      createdAt: new Date(),
      encrypted: false,
    };
  }

  static subscribeToPublicMessages(
    onMessage: (message: DirectMessage) => void,
  ) {
    const { nostrService: appNostrService } = useStore.getState();
    const nostr = appNostrService || nostrService;
    nostr.subscribeToEvents([{ kinds: [42], "#c": ["public"] }], (event) => {
      onMessage({
        id: event.id,
        to: "public",
        from: event.pubkey,
        content: event.content,
        createdAt: new Date(event.created_at * 1000),
        encrypted: false,
      });
    });
  }
}
