import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatService } from "./ChatService";
import { nostrService } from "./NostrService";
import { useAppStore } from "../store";
import { DirectMessage } from "../../shared/types";

vi.mock("./NostrService");
vi.mock("../store");

describe("ChatService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const mockState = {
      nostrService: nostrService,
    };
    (useAppStore.getState as vi.Mock).mockReturnValue(mockState);
  });

  it("should send a direct message", async () => {
    const recipient = "test-recipient";
    const content = "Hello, world!";
    const event = {
      id: "test-event-id",
      pubkey: "test-pubkey",
      created_at: Date.now() / 1000,
    };
    (nostrService.sendDirectMessage as vi.Mock).mockResolvedValue(event);

    const message = await ChatService.sendMessage(recipient, content);

    expect(nostrService.sendDirectMessage).toHaveBeenCalledWith(
      recipient,
      content,
    );
    expect(message.to).toBe(recipient);
    expect(message.content).toBe(content);
    expect(message.encrypted).toBe(true);
  });

  it("should send a public message", async () => {
    const content = "Public message";
    (nostrService.publishEvent as vi.Mock).mockResolvedValue(["test-event-id"]);
    (nostrService.getPublicKey as vi.Mock).mockReturnValue("test-pubkey");

    const message = await ChatService.sendPublicMessage(content);

    expect(nostrService.publishEvent).toHaveBeenCalledWith(42, content, [
      ["c", "public"],
    ]);
    expect(message.to).toBe("public");
    expect(message.content).toBe(content);
    expect(message.encrypted).toBe(false);
  });

  it("should subscribe to public messages", () => {
    const onMessage = vi.fn();
    ChatService.subscribeToPublicMessages(onMessage);

    expect(nostrService.subscribeToEvents).toHaveBeenCalledWith(
      [{ kinds: [42], "#c": ["public"] }],
      expect.any(Function),
    );
  });

  it("should subscribe to direct messages", () => {
    const onMessage = vi.fn();
    const pubkey = "test-pubkey";
    ChatService.subscribeToMessages(pubkey, onMessage);

    expect(nostrService.subscribeToDirectMessages).toHaveBeenCalledWith(
      pubkey,
      expect.any(Function),
    );
  });
});
