
import { useAppStore } from "../store";
import { createChatPanel } from "./ChatPanel";
import { createContactsView } from "./ContactsView";
import { createNetworkPanel } from "./NetworkPanel";
import { createButton } from "./Button";
import "./NotentionApp.css";

export function createMessagingApp(): HTMLElement {
  const { messagingViewMode, setMessagingViewMode } = useAppStore.getState();

  const mainContainer = document.createElement("div");
  mainContainer.className = "two-panel-layout messaging-layout";

  const leftPanel = document.createElement("div");
  leftPanel.className = "left-panel";

  const toggleButton = createButton({
    label: messagingViewMode === "contacts" ? "Show Network" : "Show Contacts",
    onClick: () => {
      setMessagingViewMode(messagingViewMode === "contacts" ? "network" : "contacts");
    },
    variant: "secondary",
    className: "panel-toggle-btn"
  });
  leftPanel.appendChild(toggleButton);

  if (messagingViewMode === "network") {
    const networkPanel = createNetworkPanel();
    leftPanel.appendChild(networkPanel);
  } else {
    const contactsView = createContactsView();
    leftPanel.appendChild(contactsView);
  }

  const rightPanel = document.createElement("div");
  rightPanel.className = "right-panel";
  
  const chatPanel = createChatPanel();
  rightPanel.appendChild(chatPanel);

  mainContainer.appendChild(leftPanel);
  mainContainer.appendChild(rightPanel);
  
  return mainContainer;
}

