import { useAppStore } from "../store";
import { DirectMessage } from "../../shared/types";
import { nostrService } from "./NostrService";
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
      const privateKey = nostr.getPrivateKey();
      if (privateKey) {
        const content = nip04.decrypt(privateKey, event.pubkey, event.content);
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

  static async sendPublicMessage(content: string): Promise<DirectMessage> {
    const { nostrService: appNostrService } = useAppStore.getState();
    const nostr = appNostrService || nostrService;
    const eventIds = await nostr.publishEvent(42, content, [["c", "public"]]);
    return {
      id: eventIds[0] || "",
      from: nostr.getPublicKey() || "",
      to: "public",
      content,
      timestamp: new Date(),
      encrypted: false,
    };
  }

  static subscribeToPublicMessages(
    onMessage: (message: DirectMessage) => void,
  ) {
    const { nostrService: appNostrService } = useAppStore.getState();
    const nostr = appNostrService || nostrService;
    nostr.subscribeToEvents([{ kinds: [42], "#c": ["public"] }], (event) => {
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
  }
}
