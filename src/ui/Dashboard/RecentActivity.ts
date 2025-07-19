import { useAppStore } from "../../store";
import { Match } from "../../../shared/types";

export function createRecentActivity(): HTMLElement {
  const { matches } = useAppStore.getState();

  const container = document.createElement("div");
  container.className = "dashboard-recent-activity";

  const title = document.createElement("h3");
  title.textContent = "Recent Activity";
  container.appendChild(title);

  const list = document.createElement("ul");
  const recentMatches = matches
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 5);

  if (recentMatches.length > 0) {
    recentMatches.forEach((match) => {
      const li = document.createElement("li");
      li.className = "recent-activity-item";
      li.innerHTML = `
        <p>New match for note: <strong>${match.localNoteId}</strong></p>
        <span>${new Date(match.timestamp).toLocaleDateString()}</span>
      `;
      list.appendChild(li);
    });
  } else {
    list.innerHTML = "<p>No recent activity.</p>";
  }

  container.appendChild(list);
  return container;
}
