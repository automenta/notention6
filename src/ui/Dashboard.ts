// src/ui/Dashboard.ts
import { createQuickActions } from "./Dashboard/QuickActions";
import { createStats } from "./Dashboard/Stats";
import { createRecentNotes } from "./Dashboard/RecentNotes";
import { createRecentActivity } from "./Dashboard/RecentActivity";
import "./Dashboard.css";

export function createDashboard(): HTMLElement {
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
  const quickActions = createQuickActions();
  dashboard.appendChild(quickActions);

  // Main Content Area
  const mainContent = document.createElement("div");
  mainContent.className = "dashboard-main-content";

  // Left Column
  const leftColumn = document.createElement("div");
  leftColumn.className = "dashboard-column";

  // Stats
  const statsContainer = createStats();
  leftColumn.appendChild(statsContainer);

  // Recent Notes
  const recentNotesContainer = createRecentNotes();
  leftColumn.appendChild(recentNotesContainer);

  // Right Column
  const rightColumn = document.createElement("div");
  rightColumn.className = "dashboard-column";

  // Recent Activity
  const recentActivityContainer = createRecentActivity();
  rightColumn.appendChild(recentActivityContainer);

  mainContent.appendChild(leftColumn);
  mainContent.appendChild(rightColumn);
  dashboard.appendChild(mainContent);

  return dashboard;
}
