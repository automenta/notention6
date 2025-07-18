// src/lib/templates.ts
export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  fields: { [key: string]: string };
}

export const templates: NoteTemplate[] = [
  {
    id: 'meeting-note',
    name: 'Meeting Note',
    content: '<h2>Meeting Agenda</h2><ul><li></li></ul><h2>Attendees</h2><ul><li></li></ul><h2>Notes</h2><p></p>',
    fields: {
      'Date': '',
      'Location': ''
    }
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    content: '<h2>Project Overview</h2><p></p><h2>Goals</h2><ul><li></li></ul><h2>Timeline</h2><p></p>',
    fields: {
      'Project Lead': '',
      'Status': 'Not Started'
    }
  }
];
