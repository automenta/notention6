import { useAppStore } from "../store";
import { createButton } from "./Button";

export function createSyncSettings(): HTMLElement {
  const container = document.createElement("div");
  container.className = "sync-settings-container";

  const title = document.createElement("h2");
  title.textContent = "Sync Settings";
  container.appendChild(title);

  const syncOntologyButton = createButton({
    label: "Sync Ontology",
    onClick: () => {
      useAppStore.getState().syncOntologyWithNostr();
    },
    variant: "primary",
  });
  container.appendChild(syncOntologyButton);

  return container;
}
