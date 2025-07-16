import { useAppStore } from "../store";
import { DirectMessage } from "../../shared/types";
import { nostrService } from "./NostrService";

export class ChatService {
  static async getMessages(
    pubkey: string,
    since?: Date,
  ): Promise<DirectMessage[]> {
    return nostrService.getDirectMessages(pubkey, since);
  }

  static async sendMessage(
    pubkey: string,
    content: string,
  ): Promise<DirectMessage> {
    const message = await nostrService.sendDirectMessage(pubkey, content);
    useAppStore.getState().addDirectMessage(message);
    return message;
  }
}
