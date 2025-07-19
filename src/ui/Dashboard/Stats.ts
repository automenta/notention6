import { useStore } from "../../store";
import { Note } from "../../../shared/types";

function getUpcomingEventsCount(notes: Note[]): number {
  const now = new Date();
  return notes.filter((note) => {
    if (note.values && note.values.due) {
      const dueDate = new Date(note.values.due);
      return dueDate > now;
    }
    return false;
  }).length;
}

function createStatCard(title: string, value: string): HTMLElement {
  const statCard = document.createElement("div");
  statCard.className = "stat-card";
  statCard.innerHTML = `
    <h3>${title}</h3>
    <p>${value}</p>
  `;
  return statCard;
}

export function createStats(): HTMLElement {
  const notes = useStore.use.notes();
  const userProfile = useStore.use.userProfile();
  const notesArray = Object.values(notes);
  const contactsArray = userProfile?.contacts || [];

  const statsContainer = document.createElement("div");
  statsContainer.className = "dashboard-stats";

  const totalNotesStat = createStatCard("Total Notes", `${notesArray.length}`);
  statsContainer.appendChild(totalNotesStat);

  const upcomingEventsStat = createStatCard(
    "Upcoming Events",
    `${getUpcomingEventsCount(notesArray)}`,
  );
  statsContainer.appendChild(upcomingEventsStat);

  const contactsStat = createStatCard("Contacts", `${contactsArray.length}`);
  statsContainer.appendChild(contactsStat);

  return statsContainer;
}
