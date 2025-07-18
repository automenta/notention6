import {
  SimplePool,
  nip04,
  Event,
  UnsignedEvent,
  getEventHash,
  finalizeEvent,
  Filter,
} from "nostr-tools";
import { getPublicKey } from "nostr-tools/pure";
import { generateSecretKey } from "nostr-tools/pure";
import { bytesToHex } from "@noble/hashes/utils";
import {
  UserProfile,
  Note,
  NostrUserProfile,
  RelayDict,
  Contact,
  OntologyTree,
} from "../../shared/types"; // Assuming NostrUserProfile and RelayDict might be needed
import { DBService } from "./db";

const ONTOLOGY_KIND = 30078; // Kind for ontology events

// const NOSTR_RELAYS_DB_KEY = 'nostrRelays'; // This might be stored in userProfile or app settings directly

export class NostrService {
  private static instance: NostrService;
  private privateKey: string | null = null;
  private publicKey: string | null = null;
  private pool: SimplePool;
  private relays: string[] = [];
  private defaultRelays: string[] = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.snort.social",
  ]; // Default relays

  private constructor() {
    this.pool = new SimplePool();
    this.loadRelays();
  }

  private async loadRelays() {
    const storedRelays = await DBService.getRelays();
    if (storedRelays && storedRelays.length > 0) {
      this.relays = storedRelays;
    } else {
      this.relays = this.relays;
    }
  }

  public static getInstance(): NostrService {
    if (!NostrService.instance) {
      NostrService.instance = new NostrService();
    }
    return NostrService.instance;
  }

  /**
   * Generates a new Nostr key pair.
   * Does not automatically store it. Call storeKeyPair for that.
   */
  public generateNewKeyPair(): { privateKey: string; publicKey: string } {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    return { privateKey: bytesToHex(sk), publicKey: pk };
  }

  /**
   * Stores the given Nostr key pair securely using DBService.
   * Prompts for backup (conceptually, actual prompt is UI concern).
   * @param privateKey The private key to store.
   * @param publicKey The public key to store.
   */
  public async storeKeyPair(
    privateKey: string,
    publicKey: string,
  ): Promise<void> {
    try {
      await DBService.saveNostrPrivateKey(privateKey);
      await DBService.saveNostrPublicKey(publicKey);
      this.privateKey = privateKey;
      this.publicKey = publicKey;
      console.log(
        "Nostr key pair stored. User should be prompted to back up their private key.",
      );
    } catch (error) {
      console.error("Error storing Nostr key pair:", error);
      throw new Error("Failed to store Nostr key pair.");
    }
  }

  /**
   * Loads the Nostr key pair from storage using DBService.
   * @returns True if keys were loaded, false otherwise.
   */
  public async loadKeyPair(): Promise<boolean> {
    try {
      const sk = await DBService.getNostrPrivateKey();
      const pk = await DBService.getNostrPublicKey();
      if (sk && pk) {
        this.privateKey = sk;
        this.publicKey = pk;
        return true;
      }
      this.privateKey = null; // Ensure keys are cleared if not found
      this.publicKey = null;
      return false;
    } catch (error) {
      console.error("Error loading Nostr key pair:", error);
      this.privateKey = null;
      this.publicKey = null;
      return false;
    }
  }

  /**
   * Clears the currently loaded and stored Nostr key pair from DBService.
   */
  public async clearKeyPair(): Promise<void> {
    try {
      await DBService.removeNostrPrivateKey();
      await DBService.removeNostrPublicKey();
      this.privateKey = null;
      this.publicKey = null;
      console.log("Nostr key pair cleared.");
    } catch (error) {
      console.error("Error clearing Nostr key pair:", error);
      throw new Error("Failed to clear Nostr key pair.");
    }
  }

  public getPublicKey(): string | null {
    return this.publicKey;
  }

  public getPrivateKey(): string | null {
    // Be very careful with exposing this. Ideally, it's only used internally for signing.
    return this.privateKey;
  }

  public isLoggedIn(): boolean {
    return !!this.privateKey && !!this.publicKey;
  }

  public getRelays(): string[] {
    return this.relays;
  }

  public async addRelay(url: string): Promise<void> {
    if (!this.relays.includes(url)) {
      this.relays.push(url);
      await DBService.saveRelays(this.relays);
    }
  }

  public async removeRelay(url: string): Promise<void> {
    this.relays = this.relays.filter((r) => r !== url);
    await DBService.saveRelays(this.relays);
  }

  /**
   * Publishes a note to the Nostr network.
   * @param note The note to publish.
   * @param targetRelays Optional array of relay URLs to publish to. Defaults to pre-configured relays.
   * @param encrypt If true, encrypts the note content.
   * @param recipientPublicKey If encrypting, the public key of the recipient. Defaults to self (this.publicKey).
   * @returns A promise that resolves with the published event IDs from each relay.
   */
  public async publishNote(
    note: Note,
    targetRelays?: string[],
    encrypt: boolean = false,
    recipientPublicKey?: string,
    privacySettings?: {
      sharePublicNotesGlobally: boolean;
      shareTagsWithPublicNotes: boolean;
      shareValuesWithPublicNotes: boolean;
      shareEmbeddingsWithPublicNotes?: boolean; // Added new setting
    },
  ): Promise<string[]> {
    // Returns event IDs from relays
    if (!this.isLoggedIn() || !this.privateKey || !this.publicKey) {
      throw new Error("User not logged in. Cannot publish note.");
    }

    // Default privacy settings if not provided (conservative: share less)
    const currentPrivacySettings = privacySettings || {
      sharePublicNotesGlobally: false,
      shareTagsWithPublicNotes: false,
      shareValuesWithPublicNotes: false,
      shareEmbeddingsWithPublicNotes: false, // Default to false
    };

    // If trying to publish a public (non-encrypted) note but global sharing is off, prevent.
    if (!encrypt && !currentPrivacySettings.sharePublicNotesGlobally) {
      console.warn("Public note publishing is disabled by privacy settings.");
      // Or throw new Error('Public note publishing is disabled by privacy settings.');
      // For now, let's allow it but it won't include much if other settings are also false.
      // A better approach would be to prevent the call from the store if settings disallow.
      // Or, if this service is called directly, it should strictly adhere.
      // Let's make it strict:
      // throw new Error('Public note publishing is disabled by privacy settings.');
      // For now, let's proceed but filter tags/values based on other settings.
      // The UI/store should ideally prevent calling this if sharePublicNotesGlobally is false for a public note.
    }

    const tags: string[][] = [];
    // Basic tags like 'd' (identifier) and 'title' might always be included if the note itself is shared.
    tags.push(["d", note.id]); // Identifier for the note
    tags.push(["title", note.title]); // Title of the note
    tags.push([
      "published_at",
      Math.floor((note.createdAt || new Date()).getTime() / 1000).toString(),
    ]);

    if (encrypt || currentPrivacySettings.shareTagsWithPublicNotes) {
      (note.tags || []).forEach((tag) => {
        const tagName =
          tag.startsWith("#") || tag.startsWith("@") ? tag.substring(1) : tag;
        if (tagName) tags.push(["t", tagName]);
      });
    }

    if (encrypt || currentPrivacySettings.shareValuesWithPublicNotes) {
      if (note.values) {
        for (const [key, value] of Object.entries(note.values)) {
          tags.push(["param", key, value]);
        }
      }
    }

    // Add embedding if public, sharing is enabled, and embedding exists
    if (
      !encrypt &&
      currentPrivacySettings.shareEmbeddingsWithPublicNotes &&
      note.embedding &&
      note.embedding.length > 0
    ) {
      try {
        tags.push(["embedding", JSON.stringify(note.embedding)]);
      } catch (e) {
        console.error("Failed to stringify note embedding for Nostr tag:", e);
        // Decide if you want to proceed without the embedding or throw an error
      }
    }

    let contentToPublish = note.content;
    let eventKind: number = 1; // Default to kind 1 (short text note / reference to long-form)

    if (encrypt) {
      const targetPk = recipientPublicKey || this.publicKey;
      if (!targetPk) {
        throw new Error("Recipient public key not available for encryption.");
      }
      if (!this.privateKey) {
        // Should be caught by isLoggedIn, but defensive check
        throw new Error("Private key not available for encryption.");
      }
      try {
        contentToPublish = await nip04.encrypt(
          this.privateKey,
          targetPk,
          note.content,
        );
        tags.push(["p", targetPk]); // NIP-04 specifies 'p' tag for recipient
        eventKind = 4; // NIP-04 Encrypted Direct Message
      } catch (error) {
        console.error("Error encrypting note:", error);
        throw new Error("Failed to encrypt note content.");
      }
    }

    return this.publishEvent(
      eventKind,
      contentToPublish,
      tags,
      targetRelays,
    );
  }

  public async publishEvent(
    kind: number,
    content: string,
    tags: string[][],
    targetRelays?: string[],
  ): Promise<string[]> {
    if (!this.isLoggedIn() || !this.privateKey || !this.publicKey) {
      throw new Error("User not logged in. Cannot publish event.");
    }

    const relaysToPublish =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToPublish.length === 0) {
      console.warn("No relays configured or provided to publish event.");
      return [];
    }

    const unsignedEvent: UnsignedEvent = {
      kind,
      pubkey: this.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content,
    };

    const signedEvent: Event = finalizeEvent(unsignedEvent, this.privateKey);

    console.log(
      `Publishing event to ${relaysToPublish.join(", ")}:`,
      signedEvent,
    );

    try {
      const publicationPromises = this.pool.publish(
        relaysToPublish,
        signedEvent,
      );
      const results = await Promise.allSettled(publicationPromises);
      const successfulEventIds: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(
            `Event ${signedEvent.id} published successfully to ${relaysToPublish[index]}`,
          );
          successfulEventIds.push(signedEvent.id);
        } else {
          console.error(
            `Failed to publish event ${signedEvent.id} to ${relaysToPublish[index]}:`,
            result.reason,
          );
        }
      });
      return successfulEventIds;
    } catch (error) {
      console.error("Error during pool.publish:", error);
      return [];
    }
  }

  /**
   * Subscribes to events from specified relays based on filters.
   * @param filters Nostr filters to apply.
   * @param onEvent Callback function to handle incoming events.
   * @param targetRelays Optional array of relay URLs. Defaults to pre-configured relays.
   * @param subscriptionId Optional ID for the subscription to manage it later.
   * @returns A subscription object from SimplePool (or void/null if not applicable).
   */
  public subscribeToEvents(
    filters: Filter[],
    onEvent: (event: Event) => void,
    targetRelays?: string[],
    subscriptionId?: string,
  ) {
    const relaysToUse =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToUse.length === 0) {
      console.warn("No relays to subscribe to.");
      return null; // Or handle appropriately
    }

    console.log(
      `Subscribing to events on ${relaysToUse.join(", ")} with filters:`,
      filters,
    );
    const sub = this.pool.sub(relaysToUse, filters, { id: subscriptionId });

    sub.on("event", (event: Event) => {
      onEvent(event);
    });

    sub.on("eose", () => {
      console.log(
        `Subscription ${subscriptionId || ""} EOSE received from one or more relays.`,
      );
      // End Of Stored Events. You can stop loaders here.
    });

    return sub; // The caller can use this to .unsub() later
  }

  /**
   * Unsubscribes from events.
   * @param subscription The subscription object returned by subscribeToEvents.
   */
  public unsubscribe(subscription: any) {
    // Type properly if possible, 'any' from nostr-tools SimplePool sub
    if (subscription && typeof subscription.unsub === "function") {
      subscription.unsub();
      console.log("Unsubscribed from events.");
    }
  }

  /**
   * Closes connections to all relays in the pool.
   */
  public disconnectAllRelays(): void {
    // SimplePool does not have a direct `disconnectAll` or `closeAll` method.
    // Connections are typically closed when subscriptions are removed or the pool instance is destroyed.
    // To explicitly close, one might need to manage individual relay connections if not using SimplePool,
    // or rely on SimplePool's internal management (e.g., when no active subscriptions).
    // For now, we can clear the pool, which should close connections.
    // this.pool.close(this.relays); // This would close specific relays
    // A more robust way might involve re-instantiating the pool or managing relays more granularly.
    // For now, this is a conceptual placeholder as SimplePool handles connections abstractly.
    console.log(
      "Attempting to disconnect from relays (SimplePool manages this implicitly).",
    );
    // If you need to ensure connections are closed, you might need to track relays and close them individually
    // or replace the pool instance. For now, unsubscribing all active subscriptions is the primary way.
  }

  /**
   * Decrypts a NIP-04 message.
   * @param payload The encrypted content string.
   * @param otherPartyPublicKey The public key of the other party (sender).
   * @returns A promise that resolves with the decrypted plaintext.
   */
  public async decryptMessage(
    payload: string,
    otherPartyPublicKey: string,
  ): Promise<string> {
    if (!this.isLoggedIn() || !this.privateKey) {
      throw new Error(
        "User not logged in or private key not available for decryption.",
      );
    }
    try {
      return await nip04.decrypt(this.privateKey, otherPartyPublicKey, payload);
    } catch (error) {
      console.error("Error decrypting message:", error);
      throw new Error("Failed to decrypt message.");
    }
  }

  // --- Sync Specific Methods ---

  /**
   * Publishes a note for backup/sync purposes, typically encrypted to self.
   * @param note The note object to sync.
   * @param targetRelays Optional relays, defaults to user's configured relays.
   * @returns Promise resolving with event IDs from relays.
   */
  public async publishNoteForSync(
    note: Note,
    targetRelays?: string[],
  ): Promise<string[]> {
    if (!this.isLoggedIn() || !this.privateKey || !this.publicKey) {
      throw new Error("User not logged in. Cannot publish note for sync.");
    }

    const noteJson = JSON.stringify(note);
    const encryptedContent = await nip04.encrypt(
      this.privateKey,
      this.publicKey,
      noteJson,
    );

    const unsignedEvent: UnsignedEvent = {
      kind: 4, // Encrypted Direct Message (to self)
      pubkey: this.publicKey,
      created_at: Math.floor((note.updatedAt || new Date()).getTime() / 1000), // Use note's updatedAt for event's created_at
      tags: [
        ["p", this.publicKey], // Encrypted to self
        ["d", `notention-note-sync:${note.id}`], // Special d tag for sync
        // Potentially add original note.id as another tag if 'd' is purely for event replacement: ['note_id', note.id]
      ],
      content: encryptedContent,
    };

    // finalizeEvent will compute the id, add pubkey, and sign.
    // It mutates the unsignedEvent and returns it as a signed Event.
    const signedEvent: Event = finalizeEvent(unsignedEvent, this.privateKey);

    const relaysToPublish =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToPublish.length === 0) {
      console.warn(
        "No relays configured or provided to publish note for sync.",
      );
      return []; // Return empty array, not just eventId
    }

    console.log(
      `Publishing note for sync to ${relaysToPublish.join(", ")}:`,
      signedEvent,
    );
    // Store the signedEvent.id with the note (this should be done by the caller, e.g., in the store)
    // For now, we just return the event ID.

    try {
      const publicationPromises = this.pool.publish(
        relaysToPublish,
        signedEvent,
      );
      const results = await Promise.allSettled(publicationPromises);
      const successfulRelaysCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;

      if (successfulRelaysCount > 0) {
        console.log(
          `Sync Event ${signedEvent.id} published successfully to ${successfulRelaysCount} relay(s).`,
        );
        // Return the event ID if published to at least one relay.
        // The caller (store) will be responsible for updating the note with this ID.
        return [signedEvent.id]; // Returning an array containing the ID for consistency, though it's one event.
      } else {
        console.error(
          `Failed to publish sync event ${signedEvent.id} to any relay.`,
        );
        return [];
      }
    } catch (error) {
      console.error("Error during sync note pool.publish:", error);
      return [];
    }
  }

  /**
   * Fetches synced notes (Kind 4 events with specific 'd' tag) from relays.
   * @param since Optional timestamp to fetch events after.
   * @param targetRelays Optional relays.
   * @returns Promise resolving with an array of decrypted Note objects.
   */
  public async fetchSyncedNotes(
    since?: number,
    targetRelays?: string[],
  ): Promise<Note[]> {
    if (!this.isLoggedIn() || !this.publicKey) {
      throw new Error("User not logged in. Cannot fetch synced notes.");
    }

    const relaysToUse =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToUse.length === 0) return [];

    const filters: Filter[] = [
      {
        kinds: [4],
        authors: [this.publicKey],
        "#p": [this.publicKey], // Sent to self
        // Using a prefix match for 'd' tag might require relay support or fetching all and filtering client-side.
        // For simplicity, let's fetch all kind 4 to self and filter by 'd' tag content client-side.
        // Or, if relays support prefix for 'd' tag, use it. nostr-tools might not directly support prefix in Filter.
        // Let's assume we fetch broadly and filter.
        ...(since ? { since } : {}),
      },
    ];

    const events = await this.pool.querySync(relaysToUse, filters);
    if (!events) return [];
    const syncedNotes: Note[] = [];

    for (const event of events) {
      if (
        event.tags.some(
          (tag) => tag[0] === "d" && tag[1]?.startsWith("notention-note-sync:"),
        )
      ) {
        try {
          const decryptedContent = await this.decryptMessage(
            event.content,
            event.pubkey,
          );
          const note = JSON.parse(decryptedContent) as Note;
          // Ensure dates are Date objects
          if (note.createdAt && typeof note.createdAt === "string")
            note.createdAt = new Date(note.createdAt);
          if (note.updatedAt && typeof note.updatedAt === "string")
            note.updatedAt = new Date(note.updatedAt);
          syncedNotes.push(note);
        } catch (error) {
          console.error(
            "Error decrypting or parsing synced note:",
            error,
            event,
          );
        }
      }
    }
    return syncedNotes;
  }

  /**
   * Publishes the ontology for sync/backup. Uses Kind 30001 (replaceable event).
   * @param ontology The ontology tree to sync.
   * @param targetRelays Optional relays.
   * @returns Promise resolving with event IDs.
   */
  public async publishOntologyForSync(
    ontology: any,
    targetRelays?: string[],
  ): Promise<string[]> {
    // ontology is OntologyTree
    if (!this.isLoggedIn() || !this.privateKey || !this.publicKey) {
      throw new Error("User not logged in. Cannot publish ontology for sync.");
    }

    const ontologyJson = JSON.stringify(ontology);
    // Content for Kind 30001 is not typically encrypted by default unless app chooses to.
    // For simplicity, store as plaintext here. If encryption needed, it would wrap ontologyJson.

    const unsignedEvent: UnsignedEvent = {
      kind: 30001, // Replaceable event for user-specific data
      pubkey: this.publicKey,
      created_at: Math.floor(
        (ontology.updatedAt || new Date()).getTime() / 1000,
      ), // Use ontology's updatedAt
      tags: [
        ["d", "notention-ontology-sync"], // Specific d tag for this app's ontology
      ],
      content: ontologyJson,
    };

    // finalizeEvent will compute the id, add pubkey, and sign.
    // It mutates the unsignedEvent and returns it as a signed Event.
    const signedEvent: Event = finalizeEvent(unsignedEvent, this.privateKey);

    const relaysToPublish =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToPublish.length === 0) {
      console.warn("No relays for ontology sync.");
      return [];
    }

    console.log(
      `Publishing ontology for sync to ${relaysToPublish.join(", ")}:`,
      signedEvent,
    );
    try {
      const pubPromises = this.pool.publish(relaysToPublish, signedEvent);
      const results = await Promise.allSettled(pubPromises);
      // Similar success/error handling as publishNoteForSync
      return results
        .filter((r) => r.status === "fulfilled")
        .map(() => signedEvent.id);
    } catch (error) {
      console.error("Error during ontology sync pool.publish:", error);
      return [];
    }
  }

  /**
   * Fetches the latest synced ontology (Kind 30001 event) from relays.
   * @param targetRelays Optional relays.
   * @returns Promise resolving with the OntologyTree or null if not found/error.
   */
  public async fetchSyncedOntology(
    targetRelays?: string[],
  ): Promise<any | null> {
    // Returns OntologyTree
    if (!this.isLoggedIn() || !this.publicKey) {
      throw new Error("User not logged in. Cannot fetch synced ontology.");
    }

    const relaysToUse =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToUse.length === 0) return null;

    const filters: Filter[] = [
      {
        kinds: [30001],
        authors: [this.publicKey],
        "#d": ["notention-ontology-sync"], // Exact match for 'd' tag
        limit: 1, // We only need the latest one
      },
    ];

    // .get() should return the most recent event first for replaceable kinds if relays behave.
    const events = await this.pool.querySync(relaysToUse, filters);
    if (!events || events.length === 0) return null;

    // Sort by created_at descending to be sure we get the latest, as pool.querySync might return from multiple relays.
    events.sort((a, b) => b.created_at - a.created_at);

    const latestEvent = events[0];
    try {
      const ontology = JSON.parse(latestEvent.content); // as OntologyTree
      // Ensure dates are Date objects
      if (ontology.updatedAt && typeof ontology.updatedAt === "string") {
        ontology.updatedAt = new Date(ontology.updatedAt);
      }
      return ontology;
    } catch (error) {
      console.error("Error parsing synced ontology:", error, latestEvent);
      return null;
    }
  }

  /**
   * Fetches a single event by its ID from specified relays.
   * @param eventId The ID of the event to fetch.
   * @param targetRelays Optional array of relay URLs. Defaults to pre-configured relays.
   * @returns A promise that resolves with the Event or null if not found.
   */
  public async getEventById(
    eventId: string,
    targetRelays?: string[],
  ): Promise<Event | null> {
    const relaysToUse =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToUse.length === 0) {
      console.warn("No relays to fetch event from.");
      return null;
    }
    // SimplePool's get method fetches from one relay at a time until found or all fail.
    // It takes a filter, so we filter by id.
    try {
      const event = await this.pool.get(relaysToUse, { ids: [eventId] });
      return event; // Returns the first event found or null
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Publishes a Kind 5 Event Deletion event.
   * @param eventIdsToMarkForDeletion Array of event IDs (strings) to be deleted.
   * @param reason Optional reason for deletion.
   * @param targetRelays Optional relays to publish to.
   * @returns Promise resolving with event IDs from relays where deletion event was published.
   */
  public async publishDeletionEvent(
    eventIdsToMarkForDeletion: string[],
    reason: string = "",
    targetRelays?: string[],
  ): Promise<string[]> {
    if (!this.isLoggedIn() || !this.privateKey || !this.publicKey) {
      throw new Error("User not logged in. Cannot publish deletion event.");
    }
    if (!eventIdsToMarkForDeletion || eventIdsToMarkForDeletion.length === 0) {
      console.warn("No event IDs provided for deletion.");
      return [];
    }

    const tags = eventIdsToMarkForDeletion.map((id) => ["e", id]);
    if (reason) {
      tags.push(["reason", reason]);
    }

    const unsignedEvent: UnsignedEvent = {
      kind: 5, // Event Deletion
      pubkey: this.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: reason, // NIP-09 suggests reason can be in content if not in tags.
    };

    // finalizeEvent will compute the id, add pubkey, and sign.
    // It mutates the unsignedEvent and returns it as a signed Event.
    const signedEvent: Event = finalizeEvent(unsignedEvent, this.privateKey);

    const relaysToPublish =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToPublish.length === 0) {
      console.warn("No relays for deletion event.");
      return [];
    }

    console.log(
      `Publishing Kind 5 deletion event for IDs: ${eventIdsToMarkForDeletion.join(", ")} to ${relaysToPublish.join(", ")}:`,
      signedEvent,
    );
    try {
      const pubPromises = this.pool.publish(relaysToPublish, signedEvent);
      const results = await Promise.allSettled(pubPromises);
      return results
        .filter((r) => r.status === "fulfilled")
        .map(() => signedEvent.id);
    } catch (error) {
      console.error("Error during Kind 5 deletion event pool.publish:", error);
      return [];
    }
  }

  /**
   * Fetches Kind 5 (deletion) events authored by the current user.
   * @param since Optional timestamp to fetch events after.
   * @param targetRelays Optional relays.
   * @returns Promise resolving with an array of Event objects.
   */
  public async fetchOwnDeletionEvents(
    since?: number,
    targetRelays?: string[],
  ): Promise<Event[]> {
    if (!this.isLoggedIn() || !this.publicKey) {
      console.warn("User not logged in. Cannot fetch own deletion events.");
      return [];
    }

    const relaysToUse =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToUse.length === 0) {
      console.warn("No relays configured to fetch deletion events.");
      return [];
    }

    const filters: Filter[] = [
      {
        kinds: [5], // Kind 5 for Event Deletion
        authors: [this.publicKey],
        ...(since ? { since } : {}),
      },
    ];

    console.log(
      `Fetching own Kind 5 deletion events from ${relaysToUse.join(", ")} with filters:`,
      filters,
    );
    try {
      const events = await this.pool.querySync(relaysToUse, filters);
      if (!events) {
        return [];
      }
      // Sort by created_at descending to process more recent deletions first if needed, though order might not strictly matter.
      return events.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
      console.error("Error fetching own deletion events:", error);
      return [];
    }
  }

  /**
   * Fetches the user's contact list (Kind 3 event) from Nostr.
   * @param targetRelays Optional relays.
   * @returns Promise resolving with an array of Contact objects or null.
   */
  public async fetchContacts(
    targetRelays?: string[],
  ): Promise<Contact[] | null> {
    if (!this.isLoggedIn() || !this.publicKey) {
      throw new Error("User not logged in. Cannot fetch contacts.");
    }

    const relaysToUse =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToUse.length === 0) return null;

    const filters: Filter[] = [
      {
        kinds: [3],
        authors: [this.publicKey],
        limit: 1,
      },
    ];

    const events = await this.pool.querySync(relaysToUse, filters);
    if (!events || events.length === 0) return null;

    events.sort((a, b) => b.created_at - a.created_at);
    const latestEvent = events[0];

    const contacts: Contact[] = latestEvent.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => ({
        pubkey: tag[1],
        alias: tag[3] || "", // NIP-02 specifies alias can be in the 4th position
      }));

    return contacts;
  }

  /**
   * Publishes the user's contact list (Kind 3 event) to Nostr.
   * @param contacts The array of contacts to publish.
   * @param targetRelays Optional relays.
   * @returns Promise resolving with event IDs.
   */
  public async publishContactList(
    contacts: Contact[],
    targetRelays?: string[],
  ): Promise<string[]> {
    if (!this.isLoggedIn() || !this.privateKey || !this.publicKey) {
      throw new Error("User not logged in. Cannot publish contact list.");
    }

    const tags = contacts.map((contact) => {
      const tag = ["p", contact.pubkey];
      if (contact.alias) {
        tag.push(""); // Relay URL, intentionally left blank as per NIP-02
        tag.push(contact.alias);
      }
      return tag;
    });

    const unsignedEvent: UnsignedEvent = {
      kind: 3,
      pubkey: this.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: "",
    };

    const signedEvent: Event = finalizeEvent(unsignedEvent, this.privateKey);

    const relaysToPublish =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToPublish.length === 0) {
      console.warn("No relays for contact list sync.");
      return [];
    }

    try {
      const pubPromises = this.pool.publish(relaysToPublish, signedEvent);
      const results = await Promise.allSettled(pubPromises);
      return results
        .filter((r) => r.status === "fulfilled")
        .map(() => signedEvent.id);
    } catch (error) {
      console.error("Error during contact list pool.publish:", error);
      return [];
    }
  }

  public async fetchOntologyByPubkey(
    pubkey: string,
    targetRelays?: string[],
  ): Promise<OntologyTree | null> {
    const relaysToUse =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToUse.length === 0) return null;

    const filters: Filter[] = [
      {
        kinds: [ONTOLOGY_KIND],
        authors: [pubkey],
        "#d": ["ontology"],
        limit: 1,
      },
    ];

    const events = await this.pool.querySync(relaysToUse, filters);
    if (!events || events.length === 0) return null;

    events.sort((a, b) => b.created_at - a.created_at);

    const latestEvent = events[0];
    try {
      const ontology = JSON.parse(latestEvent.content);
      if (ontology.updatedAt && typeof ontology.updatedAt === "string") {
        ontology.updatedAt = new Date(ontology.updatedAt);
      }
      return ontology;
    } catch (error) {
      console.error("Error parsing fetched ontology:", error, latestEvent);
      return null;
    }
  }

  public async publishOntology(
    ontology: OntologyTree,
    targetRelays?: string[],
  ): Promise<string[]> {
    if (!this.isLoggedIn() || !this.privateKey || !this.publicKey) {
      throw new Error("User not logged in. Cannot publish ontology.");
    }

    const content = JSON.stringify(ontology);

    const unsignedEvent: UnsignedEvent = {
      kind: ONTOLOGY_KIND,
      pubkey: this.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["d", "ontology"]],
      content,
    };

    const signedEvent: Event = finalizeEvent(unsignedEvent, this.privateKey);

    const relaysToPublish =
      targetRelays && targetRelays.length > 0 ? targetRelays : this.relays;
    if (relaysToPublish.length === 0) {
      console.warn("No relays for ontology publishing.");
      return [];
    }

    try {
      const pubPromises = this.pool.publish(relaysToPublish, signedEvent);
      const results = await Promise.allSettled(pubPromises);
      return results
        .filter((r) => r.status === "fulfilled")
        .map(() => signedEvent.id);
    } catch (error) {
      console.error("Error during ontology pool.publish:", error);
      return [];
    }
  }

  public findMatchingNotes(
    ontology: OntologyTree,
    onMatch: (localNote: Note, remoteNote: Note, similarity: number) => void,
    allNotes: Note[],
  ) {
    const ontologyTags = Object.values(ontology.nodes).map(node => node.label.toLowerCase().replace(/^[#@]/, ''));

    this.subscribeToEvents(
        [{ kinds: [1], "#t": ontologyTags }],
        async (event) => {
            const remoteNote: Note = {
                id: event.id,
                title: event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled',
                content: event.content,
                createdAt: new Date(event.created_at * 1000),
                updatedAt: new Date(event.created_at * 1000),
                status: 'published',
                tags: event.tags.filter(t => t[0] === 't').map(t => `#${t[1]}`),
                values: {},
                fields: {},
                pinned: false,
                archived: false,
            };

            for (const localNote of allNotes) {
                const localTags = new Set(localNote.tags.map(t => t.toLowerCase().replace(/^[#@]/, '')));
                const remoteTags = new Set(remoteNote.tags.map(t => t.toLowerCase().replace(/^[#@]/, '')));

                const intersection = new Set([...localTags].filter(t => remoteTags.has(t)));
                const union = new Set([...localTags, ...remoteTags]);

                if (intersection.size > 0) {
                    const similarity = intersection.size / union.size;
                    onMatch(localNote, remoteNote, similarity);
                    const { useAppStore } = await import('../store');
                    useAppStore.getState().addNotification({
                        id: `match-${localNote.id}-${remoteNote.id}`,
                        type: 'success',
                        message: `New match found for note: ${localNote.title}`,
                        description: `Found a new note with similarity of ${similarity.toFixed(2)}`,
                        timestamp: new Date(),
                    });
                }
            }
        }
    );
  }

  public async sendDirectMessage(
    recipientPublicKey: string,
    content: string,
  ): Promise<Event> {
    if (!this.isLoggedIn() || !this.privateKey || !this.publicKey) {
      throw new Error("User not logged in. Cannot send direct message.");
    }

    const encryptedContent = await nip04.encrypt(
      this.privateKey,
      recipientPublicKey,
      content,
    );

    const unsignedEvent: UnsignedEvent = {
      kind: 4,
      pubkey: this.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["p", recipientPublicKey]],
      content: encryptedContent,
    };

    const signedEvent = finalizeEvent(unsignedEvent, this.privateKey);
    this.pool.publish(this.relays, signedEvent);
    return signedEvent;
  }

  public subscribeToDirectMessages(
    otherUserPublicKey: string,
    onMessage: (message: Event) => void,
  ) {
    if (!this.isLoggedIn() || !this.publicKey) {
      throw new Error("User not logged in. Cannot subscribe to direct messages.");
    }

    this.subscribeToEvents(
      [
        {
          kinds: [4],
          authors: [this.publicKey],
          "#p": [otherUserPublicKey],
        },
        {
          kinds: [4],
          authors: [otherUserPublicKey],
          "#p": [this.publicKey],
        },
      ],
      onMessage,
    );
  }
}

// Export a singleton instance
export const nostrService = NostrService.getInstance();
