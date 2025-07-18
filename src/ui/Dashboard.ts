// src/ui-rewrite/Dashboard.ts
import {useAppStore} from "../store";
import {createButton} from "./Button";
import "./Dashboard.css";
import {Match, Note} from "../../shared/types";

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

export function createDashboard(): HTMLElement {
    const {
        notes,
        userProfile,
        createNote,
        setCurrentNote,
        setSidebarTab,
        matches,
    } = useAppStore.getState();
    const notesArray = Object.values(notes);
    const contactsArray = userProfile?.contacts || [];

    const dashboard = document.createElement("div");
    dashboard.className = "dashboard";

    // Header
    const header = document.createElement("header");
    header.className = "dashboard-header";
    const title = document.createElement("h1");
    title.textContent = "Dashboard";
    header.appendChild(title);
    dashboard.appendChild(header);

    // Quick Actions
    const quickActions = document.createElement("div");
    quickActions.className = "dashboard-quick-actions";

    const newNoteButton = createButton({
        label: "New Note",
        onClick: () => {
            createNote({title: "New Note", content: ""}).then((newNoteId) => {
                setCurrentNote(newNoteId);
                setSidebarTab("notes");
            });
        },
        variant: "primary",
    });
    quickActions.appendChild(newNoteButton);

    const newContactButton = createButton({
        label: "New Contact",
        onClick: () => {
            setSidebarTab("contacts");
        },
        variant: "secondary",
    });
    quickActions.appendChild(newContactButton);

    dashboard.appendChild(quickActions);

    // Main Content Area
    const mainContent = document.createElement("div");
    mainContent.className = "dashboard-main-content";

    // Left Column
    const leftColumn = document.createElement("div");
    leftColumn.className = "dashboard-column";

    // Stats
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

    leftColumn.appendChild(statsContainer);

    // Recent Notes
    const recentNotesContainer = createRecentNotes(notesArray, setCurrentNote);
    leftColumn.appendChild(recentNotesContainer);

    // Right Column
    const rightColumn = document.createElement("div");
    rightColumn.className = "dashboard-column";

    // Recent Activity
    const recentActivityContainer = createRecentActivity(matches);
    rightColumn.appendChild(recentActivityContainer);

    mainContent.appendChild(leftColumn);
    mainContent.appendChild(rightColumn);
    dashboard.appendChild(mainContent);

    return dashboard;
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

function createRecentNotes(
    notes: Note[],
    onNoteClick: (id: string) => void,
): HTMLElement {
    const container = document.createElement("div");
    container.className = "dashboard-recent-notes";

    const title = document.createElement("h3");
    title.textContent = "Recent Notes";
    container.appendChild(title);

    const list = document.createElement("ul");
    const recentNotes = notes
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 5);

    if (recentNotes.length > 0) {
        recentNotes.forEach((note) => {
            const li = document.createElement("li");
            li.className = "recent-note-item";
            li.textContent = note.title || "Untitled Note";
            li.onclick = () => onNoteClick(note.id);
            list.appendChild(li);
        });
    } else {
        list.innerHTML = "<p>No recent notes.</p>";
    }

    container.appendChild(list);
    return container;
}

function createRecentActivity(matches: Match[]): HTMLElement {
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
