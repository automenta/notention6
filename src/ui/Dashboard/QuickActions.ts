import { useAppStore } from "../../store";
import { createButton } from "../Button";

export function createQuickActions(): HTMLElement {
  const { createNote, setCurrentNote, setSidebarTab } = useAppStore.getState();

  const quickActions = document.createElement("div");
  quickActions.className = "dashboard-quick-actions";

  const newNoteButton = createButton({
    label: "New Note",
    onClick: () => {
      createNote({ title: "New Note", content: "" }).then((newNoteId) => {
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

  return quickActions;
}
