import { useAppStore } from "../store";
import { createNoteEditor } from "./NoteEditor";

export function createProfileEditor(): HTMLElement {
  const { userProfile, notes } = useAppStore.getState();

  if (!userProfile || !userProfile.profileNoteId) {
    const container = document.createElement("div");
    container.textContent = "User profile not found.";
    return container;
  }

  const profileNote = notes[userProfile.profileNoteId];

  if (!profileNote) {
    const container = document.createElement("div");
    container.textContent = "Profile note not found.";
    return container;
  }

  return createNoteEditor(profileNote.id);
}
