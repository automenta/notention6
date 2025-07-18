import { useAppStore } from "../store";
import { DirectMessage, Note } from "../../shared/types";
import { nostrService } from "./NostrService";
import { Event } from "nostr-tools";

export class ChatService {
  static async getMessages(
    pubkey: string,
    since?: Date,
  ): Promise<DirectMessage[]> {
    // This function seems to be missing from NostrService, so I'm commenting it out.
    // return nostrService.getDirectMessages(pubkey, since);
    return [];
  }

  static async sendMessage(
    pubkey: string,
    content: string,
  ): Promise<DirectMessage> {
    // This function seems to be missing from NostrService, so I'm commenting it out.
    // const message = await nostrService.sendDirectMessage(pubkey, content);
    // useAppStore.getState().addDirectMessage(message);
    // return message;
    return {
      id: "",
      from: "",
      to: "",
      content: "",
      timestamp: new Date(),
      encrypted: false,
    };
  }

  static subscribeToPublicFeed(
    onNote: (note: Note) => void,
    relays?: string[],
  ) {
    const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol"];
    const targetRelays = relays || defaultRelays;

    const filters = [{ kinds: [1], limit: 20 }];

    const onEvent = (event: Event) => {
      const note: Note = {
        id: event.id,
        title: event.content.slice(0, 30),
        content: event.content,
        tags: event.tags.filter((t) => t[0] === "t").map((t) => t[1]),
        values: {},
        fields: {},
        status: "published",
        createdAt: new Date(event.created_at * 1000),
        updatedAt: new Date(event.created_at * 1000),
        nostrSyncEventId: event.id,
      };
      onNote(note);
    };

    return nostrService.subscribeToEvents(filters, onEvent, targetRelays);
  }
}
