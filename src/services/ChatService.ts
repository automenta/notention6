import { useAppStore } from "../store";
import { DirectMessage } from "../../shared/types";
import { nostrService } from "./NostrService";
import { nip04 } from "nostr-tools";

export class ChatService {
  static async sendMessage(
    pubkey: string,
    content: string,
  ): Promise<DirectMessage | null> {
    try {
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
    } catch (error) {
      console.error("Failed to send direct message:", error);
      return null;
    }
  }

  static subscribeToMessages(
    pubkey: string,
    onMessage: (message: DirectMessage) => void,
  ) {
    try {
      const { nostrService: appNostrService } = useAppStore.getState();
      const nostr = appNostrService || nostrService;
      nostr.subscribeToDirectMessages(pubkey, async (event) => {
        try {
          const privateKey = nostr.getPrivateKey();
          if (privateKey) {
            const content = nip04.decrypt(
              privateKey,
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
        } catch (error) {
          console.error("Failed to decrypt message:", error);
        }
      });
    } catch (error) {
      console.error("Failed to subscribe to direct messages:", error);
    }
  }

  static async sendPublicMessage(
    content: string,
  ): Promise<DirectMessage | null> {
    try {
      const { nostrService: appNostrService } = useAppStore.getState();
      const nostr = appNostrService || nostrService;
      const eventIds = await nostr.publishEvent(1, content, [["t", "public-chat"]]); // Kind 1 for public notes/messages, with a specific tag
      return {
        id: eventIds[0] || "",
        from: nostr.getPublicKey() || "",
        to: "public",
        content,
        timestamp: new Date(),
        encrypted: false,
      };
    } catch (error) {
      console.error("Failed to send public message:", error);
      return null;
    }
  }

  static subscribeToPublicMessages(
    onMessage: (message: DirectMessage) => void,
  ) {
    try {
      const { nostrService: appNostrService } = useAppStore.getState();
      const nostr = appNostrService || nostrService;
      nostr.subscribeToEvents([{ kinds: [1], "#t": ["public-chat"] }], (event) => {
        const message: DirectMessage = {
          id: event.id,
          from: event.pubkey,
          to: "public",
          content: event.content,
          timestamp: new Date(event.created_at * 1000),
          encrypted: false,
        };
        onMessage(message);
      });
    } catch (error) {
      console.error("Failed to subscribe to public messages:", error);
    }
  }
}
