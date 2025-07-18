// src/lib/templates.ts
import { NotentionTemplate, TemplateField } from "../../shared/types";

export const templates: NotentionTemplate[] = [
  {
    id: "meeting-note",
    name: "Meeting Note",
    description: "Template for meeting notes with agenda and attendees",
    fields: [
      { name: "Date", type: "date", required: true },
      { name: "Location", type: "text", required: false },
      { name: "Organizer", type: "text", required: false },
    ],
    defaultTags: ["#meeting"],
    defaultValues: {
      status: "scheduled",
    },
  },
  {
    id: "project-plan",
    name: "Project Plan",
    description: "Template for project planning and tracking",
    fields: [
      { name: "Project Lead", type: "text", required: true },
      {
        name: "Status",
        type: "select",
        required: true,
        options: ["Not Started", "In Progress", "On Hold", "Completed"],
      },
      {
        name: "Priority",
        type: "select",
        required: false,
        options: ["Low", "Medium", "High", "Critical"],
      },
    ],
    defaultTags: ["#project"],
    defaultValues: {
      due: "",
      budget: "",
    },
  },
  {
    id: "daily-note",
    name: "Daily Note",
    description: "Template for daily notes and journaling",
    fields: [
      {
        name: "Mood",
        type: "select",
        required: false,
        options: ["Great", "Good", "Okay", "Bad", "Terrible"],
      },
      { name: "Weather", type: "text", required: false },
    ],
    defaultTags: ["#daily", "#journal"],
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  },
];
