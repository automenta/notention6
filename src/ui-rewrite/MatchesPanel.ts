// src/ui-rewrite/MatchesPanel.ts
import { useAppStore } from "../store";
import { Match } from "../../shared/types";
import "./MatchesPanel.css";

export function createMatchesPanel(): HTMLElement {
  const { matches, notes } = useAppStore.getState();

  const container = document.createElement("div");
  container.className = "matches-panel";

  const header = document.createElement("h2");
  header.textContent = "Network Matches";
  container.appendChild(header);

  if (matches.length === 0) {
    container.innerHTML += "<p>No matches found yet.</p>";
    return container;
  }

  const list = document.createElement("ul");
  list.className = "matches-list";

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

    list.appendChild(listItem);
  });

  container.appendChild(list);

  return container;
}
