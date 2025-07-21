// src/ui-rewrite/NetworkPanel.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./NetworkPanel.css";
import { Note } from "../../shared/types";
import { nostrService } from "../services/NostrService";

export function createNetworkPanel(): HTMLElement {
  const {
    matches,
    nostrRelays,
    addNostrRelay,
    removeNostrRelay,
    nostrService: appNostrService,
    addMatch,
  } = useAppStore.getState();

  const container = document.createElement("div");
  container.className = "network-panel-container";

  // Header
  const header = document.createElement("header");
  header.className = "network-panel-header";
  const title = document.createElement("h1");
  title.textContent = "Network";
  header.appendChild(title);
  container.appendChild(header);

  // Public Feed Section
  const publicFeedContainer = document.createElement("div");
  publicFeedContainer.className = "public-feed-container";
  const publicFeedTitle = document.createElement("h2");
  publicFeedTitle.textContent = "Public Feed";
  publicFeedContainer.appendChild(publicFeedTitle);

  const publicFeedList = document.createElement("ul");
  publicFeedList.className = "public-feed-list";
  publicFeedContainer.appendChild(publicFeedList);
  container.appendChild(publicFeedContainer);

  const state: { publicFeedNotes: Note[] } = {
    publicFeedNotes: [],
  };

  const renderPublicFeed = () => {
    publicFeedList.innerHTML = "";
    if (state.publicFeedNotes.length > 0) {
      state.publicFeedNotes.forEach((note) => {
        const listItem = document.createElement("li");
        listItem.className = "feed-item";
        listItem.innerHTML = `
          <p><strong>${note.title}</strong></p>
          <span>${note.content.substring(0, 100)}...</span>
        `;
        publicFeedList.appendChild(listItem);
      });
    } else {
      const noFeedMessage = document.createElement("p");
      noFeedMessage.textContent = "No public notes found.";
      publicFeedList.appendChild(noFeedMessage);
    }
  };

  const nostr = appNostrService || nostrService;

  // This flag prevents re-subscribing on every render
  let isSubscribed = false;

  if (!isSubscribed) {
    isSubscribed = true;

    state.publicFeedNotes = [];

    nostr.subscribeToEvents([{ kinds: [1], limit: 20 }], (event) => {
      const note: Note = {
        id: event.id,
        title: event.tags.find((t) => t[0] === "title")?.[1] || "Untitled",
        content: event.content,
        createdAt: new Date(event.created_at * 1000),
        updatedAt: new Date(event.created_at * 1000),
        status: "published",
        tags: event.tags.filter((t) => t[0] === "t").map((t) => `#${t[1]}`),
        values: {},
        fields: {},
        pinned: false,
        archived: false,
      };
      state.publicFeedNotes = [...state.publicFeedNotes, note];
      renderPublicFeed();
    });

    renderPublicFeed();

    const { ontology, notes } = useAppStore.getState();
    const allNotes = Object.values(notes);
    nostr.findMatchingNotes(
      ontology,
      (localNote, remoteNote, similarity) => {
        addMatch({
          localNoteId: localNote.id,
          targetNoteId: remoteNote.id,
          similarity,
        });
      },
      allNotes,
    );
  }

  // Matches Section
  const matchesContainer = document.createElement("div");
  matchesContainer.className = "matches-container";
  const matchesTitle = document.createElement("h2");
  matchesTitle.textContent = "Matches";
  matchesContainer.appendChild(matchesTitle);

  const matchesList = document.createElement("ul");
  matchesList.className = "matches-list";

  if (matches.length > 0) {
    const { notes } = useAppStore.getState();
    matches.forEach(async (match) => {
      const localNote = notes[match.localNoteId];
      if (!localNote) return;

      const listItem = document.createElement("li");
      listItem.className = "match-item";
      listItem.innerHTML = `
        <div class="match-info">
          <p>Match found with similarity: <strong>${match.similarity.toFixed(2)}</strong></p>
        </div>
        <div class="match-notes">
          <div class="match-note">
            <h4>Your Note: ${localNote.title}</h4>
            <p>${localNote.content.substring(0, 100)}...</p>
          </div>
          <div class="match-note" id="remote-note-${match.targetNoteId}">
            <h4>Remote Note:</h4>
            <p>Loading...</p>
          </div>
        </div>
      `;
      matchesList.appendChild(listItem);

      const remoteNoteEvent = await nostr.getEventById(match.targetNoteId);
      const remoteNoteContainer = listItem.querySelector(
        `#remote-note-${match.targetNoteId}`,
      );
      if (remoteNoteEvent && remoteNoteContainer) {
        const remoteNote: Note = {
          id: remoteNoteEvent.id,
          title:
            remoteNoteEvent.tags.find((t) => t[0] === "title")?.[1] ||
            "Untitled",
          content: remoteNoteEvent.content,
          createdAt: new Date(remoteNoteEvent.created_at * 1000),
          updatedAt: new Date(remoteNoteEvent.created_at * 1000),
          status: "published",
          tags: remoteNoteEvent.tags
            .filter((t) => t[0] === "t")
            .map((t) => `#${t[1]}`),
          values: {},
          fields: {},
          pinned: false,
          archived: false,
        };
        remoteNoteContainer.innerHTML = `
          <h4>Remote Note: ${remoteNote.title}</h4>
          <p>${remoteNote.content.substring(0, 100)}...</p>
        `;
      } else if (remoteNoteContainer) {
        remoteNoteContainer.innerHTML = `
          <h4>Remote Note:</h4>
          <p>Could not load note.</p>
        `;
      }
    });
  } else {
    const noMatchesMessage = document.createElement("p");
    noMatchesMessage.textContent = "No matches found.";
    matchesList.appendChild(noMatchesMessage);
  }
  matchesContainer.appendChild(matchesList);
  container.appendChild(matchesContainer);

  // Relays Section
  const relaysContainer = document.createElement("div");
  relaysContainer.className = "relays-container";
  const relaysTitle = document.createElement("h2");
  relaysTitle.textContent = "Nostr Relays";
  relaysContainer.appendChild(relaysTitle);

  const relaysList = document.createElement("ul");
  relaysList.className = "relays-list";

  nostrRelays.forEach((relay) => {
    const listItem = document.createElement("li");
    listItem.className = "relay-item";
    const relayUrl = document.createElement("span");
    relayUrl.textContent = relay;
    listItem.appendChild(relayUrl);

    const removeButton = createButton({
      label: "Remove",
      onClick: () => removeNostrRelay(relay),
      variant: "danger",
    });
    listItem.appendChild(removeButton);
    relaysList.appendChild(listItem);
  });
  relaysContainer.appendChild(relaysList);

  const addRelayForm = document.createElement("form");
  addRelayForm.className = "add-relay-form";
  addRelayForm.onsubmit = (e) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem(
      "relayUrl",
    ) as HTMLInputElement;
    const newRelay = input.value.trim();
    if (newRelay) {
      addNostrRelay(newRelay);
      input.value = "";
    }
  };

  const relayUrlInput = document.createElement("input");
  relayUrlInput.type = "text";
  relayUrlInput.name = "relayUrl";
  relayUrlInput.placeholder = "wss://relay.example.com";
  addRelayForm.appendChild(relayUrlInput);

  const addRelayButton = createButton({
    label: "Add Relay",
    onClick: () => addRelayForm.requestSubmit(),
    variant: "primary",
  });
  addRelayForm.appendChild(addRelayButton);

  relaysContainer.appendChild(addRelayForm);
  container.appendChild(relaysContainer);

  // Topic Channels Section
  const topicsContainer = document.createElement("div");
  topicsContainer.className = "topics-container";
  const topicsTitle = document.createElement("h2");
  topicsTitle.textContent = "Topic Channels";
  topicsContainer.appendChild(topicsTitle);

  const addTopicForm = document.createElement("form");
  addTopicForm.className = "add-topic-form";
  addTopicForm.onsubmit = (e) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem(
      "topicName",
    ) as HTMLInputElement;
    const newTopic = input.value.trim();
    if (newTopic) {
      useAppStore.getState().subscribeToTopic(newTopic);
      input.value = "";
    }
  };

  const topicNameInput = document.createElement("input");
  topicNameInput.type = "text";
  topicNameInput.name = "topicName";
  topicNameInput.placeholder = "#topic";
  addTopicForm.appendChild(topicNameInput);

  const addTopicButton = createButton({
    label: "Subscribe to Topic",
    onClick: () => addTopicForm.requestSubmit(),
    variant: "primary",
  });
  addTopicForm.appendChild(addTopicButton);
  topicsContainer.appendChild(addTopicForm);

  const topicNotesContainer = document.createElement("div");
  topicNotesContainer.className = "topic-notes-container";
  topicsContainer.appendChild(topicNotesContainer);

  useAppStore.subscribe(
    (state) => state.topicNotes,
    (topicNotes) => {
      topicNotesContainer.innerHTML = "";
      for (const topic in topicNotes) {
        const topicSection = document.createElement("div");
        topicSection.className = "topic-section";
        const topicTitle = document.createElement("h3");
        topicTitle.textContent = topic;
        topicSection.appendChild(topicTitle);

        const notesList = document.createElement("ul");
        notesList.className = "topic-notes-list";
        topicNotes[topic].forEach((note) => {
          const listItem = document.createElement("li");
          listItem.className = "feed-item";
          listItem.innerHTML = `
            <p><strong>${note.id}</strong></p>
            <span>${note.content.substring(0, 100)}...</span>
          `;
          notesList.appendChild(listItem);
        });
        topicSection.appendChild(notesList);
        topicNotesContainer.appendChild(topicSection);
      }
    },
  );

  container.appendChild(topicsContainer);

  return container;
}
