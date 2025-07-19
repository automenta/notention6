// src/ui-rewrite/ChatPanel.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./ChatPanel.css";
import { Contact, DirectMessage } from "../../shared/types";
import { ChatService } from "../services/ChatService";

export function createChatPanel(): HTMLElement {
  const { userProfile, directMessages, sendDirectMessage, addDirectMessage } =
    useAppStore.getState();
  const contacts = userProfile?.contacts || [];
  let selectedContact:
    | Contact
    | null
    | { pubkey: "public"; alias: "Public Chat" } = null;

  const container = document.createElement("div");
  container.className = "chat-panel-container";

  // Header
  const header = document.createElement("header");
  header.className = "chat-panel-header";
  const title = document.createElement("h1");
  title.textContent = "Chat";
  header.appendChild(title);
  container.appendChild(header);

  const chatLayout = document.createElement("div");
  chatLayout.className = "chat-layout";

  // Contact List
  const contactListContainer = document.createElement("div");
  contactListContainer.className = "contact-list-container";
  const contactList = document.createElement("ul");
  contactList.className = "chat-contact-list";

  // Add Public Chat channel
  const publicChatListItem = document.createElement("li");
  publicChatListItem.textContent = "Public Chat";
  publicChatListItem.onclick = () => {
    selectedContact = { pubkey: "public", alias: "Public Chat" };
    renderMessageView();
  };
  contactList.appendChild(publicChatListItem);

  contacts.forEach((contact) => {
    const listItem = document.createElement("li");
    listItem.textContent =
      contact.alias || contact.pubkey.substring(0, 12) + "...";
    listItem.onclick = () => {
      selectedContact = contact;
      renderMessageView();
    };
    contactList.appendChild(listItem);
  });

  contactListContainer.appendChild(contactList);
  chatLayout.appendChild(contactListContainer);

  // Message View
  const messageViewContainer = document.createElement("div");
  messageViewContainer.className = "message-view-container";

  const renderMessageView = () => {
    messageViewContainer.innerHTML = "";
    if (!selectedContact) {
      messageViewContainer.textContent = "Select a contact to start chatting.";
      return;
    }

    const messageViewHeader = document.createElement("div");
    messageViewHeader.className = "message-view-header";
    messageViewHeader.textContent =
      selectedContact.alias || selectedContact.pubkey.substring(0, 12) + "...";
    messageViewContainer.appendChild(messageViewHeader);

    const messagesList = document.createElement("ul");
    messagesList.className = "messages-list";

    const renderMessages = () => {
      messagesList.innerHTML = "";
      let messagesToShow: DirectMessage[] = [];

      if (selectedContact?.pubkey === "public") {
        messagesToShow = directMessages.filter((dm) => !dm.encrypted);
      } else if (selectedContact) {
        messagesToShow = directMessages.filter(
          (dm) =>
            (dm.from === selectedContact?.pubkey &&
              dm.to === userProfile?.nostrPubkey) ||
            (dm.to === selectedContact?.pubkey &&
              dm.from === userProfile?.nostrPubkey),
        );
      }

      messagesToShow
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .forEach((dm) => {
          const listItem = document.createElement("li");
          listItem.className =
            dm.from === userProfile?.nostrPubkey ? "sent" : "received";

          const messageBubble = document.createElement("div");
          messageBubble.className = "message-bubble";
          messageBubble.textContent = dm.content;

          if (selectedContact?.pubkey === "public") {
            const sender = document.createElement("small");
            sender.className = "message-sender";
            sender.textContent =
              dm.from === userProfile?.nostrPubkey
                ? "You"
                : dm.from.substring(0, 8) + "...";
            listItem.appendChild(sender);
          }
          listItem.appendChild(messageBubble);
          messagesList.appendChild(listItem);
        });

      // Scroll to the bottom
      messagesList.scrollTop = messagesList.scrollHeight;
    };

    if (selectedContact?.pubkey === "public") {
      ChatService.subscribeToPublicMessages((message) => {
        addDirectMessage(message);
        renderMessages();
      });
    } else if (selectedContact) {
      ChatService.subscribeToMessages(selectedContact.pubkey, (message) => {
        addDirectMessage(message);
        renderMessages();
      });
    }

    renderMessages();

    messageViewContainer.appendChild(messagesList);

    const messageForm = document.createElement("form");
    messageForm.className = "message-form";
    messageForm.onsubmit = (e) => {
      e.preventDefault();
      const input = (e.target as HTMLFormElement).elements.namedItem(
        "message",
      ) as HTMLInputElement;
      const content = input.value.trim();
      if (content && selectedContact) {
        if (selectedContact.pubkey === "public") {
          ChatService.sendPublicMessage(content);
        } else {
          sendDirectMessage(selectedContact.pubkey, content);
        }
        input.value = "";
      }
    };

    const messageInput = document.createElement("input");
    messageInput.type = "text";
    messageInput.name = "message";
    messageInput.placeholder = "Type a message...";
    messageForm.appendChild(messageInput);

    const sendButton = createButton({
      label: "Send",
      onClick: () => messageForm.requestSubmit(),
      variant: "primary",
    });
    messageForm.appendChild(sendButton);

    messageViewContainer.appendChild(messageForm);
  };

  chatLayout.appendChild(messageViewContainer);
  container.appendChild(chatLayout);

  // Note: In a real implementation, we'd want to set up proper reactivity
  // For now, the component will be re-rendered when the main app state changes

  renderMessageView();

  return container;
}
