// src/ui-rewrite/MatchesPanel.ts
import { useAppStore } from "../store";
import { Match } from "../../shared/types";
import { createButton } from "./Button";
import "./MatchesPanel.css";

export function createMatchesPanel(): HTMLElement {
  const container = document.createElement("div");
  container.className = "matches-panel";

  const header = document.createElement("h2");
  header.textContent = "Network Matches";
  container.appendChild(header);

  const list = document.createElement("ul");
  list.className = "matches-list";
  container.appendChild(list);

  const renderMatches = () => {
    const { matches, notes, nostrService } = useAppStore.getState();
    list.innerHTML = "";

    if (matches.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No matches found yet.";
      list.appendChild(emptyMessage);
      return;
    }

    matches.forEach((match) => {
      const localNote = notes[match.localNoteId];
      if (!localNote) return;

      const listItem = document.createElement("li");
      listItem.className = "match-item";

      const title = document.createElement("h3");
      title.textContent = `Match for: ${localNote.title}`;
      listItem.appendChild(title);

      const matchDetails = document.createElement("div");
      matchDetails.className = "match-details";
      matchDetails.innerHTML = `
        <p><strong>Remote Note ID:</strong> ${match.targetNoteId}</p>
        <p><strong>Author:</strong> ${match.targetAuthor}</p>
        <p><strong>Similarity:</strong> ${match.similarity.toFixed(2)}</p>
        <p><strong>Shared Tags:</strong> ${match.sharedTags.join(", ")}</p>
      `;
      listItem.appendChild(matchDetails);

      const viewNoteButton = createButton({
        label: "View Remote Note",
        onClick: async () => {
          const remoteNoteEvent = await nostrService.getEventById(
            match.targetNoteId,
          );
          if (remoteNoteEvent) {
            // For now, just log the event to the console.
            // A proper implementation would open a new read-only note editor.
            console.log("Remote Note Event:", remoteNoteEvent);
            alert(`Remote Note Content:\n\n${remoteNoteEvent.content}`);
          } else {
            alert("Could not fetch remote note.");
          }
        },
        variant: "secondary",
      });
      listItem.appendChild(viewNoteButton);

      list.appendChild(listItem);
    });
  };

  useAppStore.subscribe((state) => state.matches, renderMatches);

  renderMatches();

  return container;
}
