import { useAppStore } from "../store";
import { DirectMessage } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { logger } from "../lib/utils";
import "./Button";
import "./Textarea";

const log = logger("chat-panel");

export class ChatPanel extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private messages: DirectMessage[] = [];
  private currentContactPubkey: string | null = null;
  private userPubkey: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        directMessages: state.directMessages,
        currentContactPubkey: state.currentContactPubkey,
        userPubkey: state.userProfile?.nostrPubkey,
      }),
      ({ directMessages, currentContactPubkey, userPubkey }) => {
        this.currentContactPubkey = currentContactPubkey;
        this.userPubkey = userPubkey || null;
        if (currentContactPubkey) {
          this.messages = directMessages.filter(
            (dm) =>
              (dm.from === currentContactPubkey && dm.to === this.userPubkey) ||
              (dm.to === currentContactPubkey && dm.from === this.userPubkey)
          );
        } else {
          this.messages = [];
        }
        this.render();
      },
      {
        equalityFn: (a, b) =>
          a.directMessages === b.directMessages &&
          a.currentContactPubkey === b.currentContactPubkey &&
          a.userPubkey === b.userPubkey,
      },
    );

    const initialState = useAppStore.getState();
    this.currentContactPubkey = initialState.currentContactPubkey;
    this.userPubkey = initialState.userProfile?.nostrPubkey || null;
    this.messages = this.currentContactPubkey
      ? initialState.directMessages.filter(
          (dm) =>
            (dm.from === this.currentContactPubkey && dm.to === this.userPubkey) ||
            (dm.to === this.currentContactPubkey && dm.from === this.userPubkey)
        )
      : [];
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
  }

  private async sendMessage() {
    const textarea = this.shadowRoot?.querySelector<HTMLTextAreaElement>("#new-message");
    const content = textarea?.value;
    if (content && this.currentContactPubkey) {
      await useAppStore.getState().sendDirectMessage(this.currentContactPubkey, content);
      textarea.value = "";
    }
  }

  render() {
    if (!this.shadowRoot) return;
    log("Rendering chat panel");

    if (!this.currentContactPubkey) {
      render(
        html`<div class="empty-state">Select a contact to start chatting</div>`,
        this.shadowRoot,
      );
      return;
    }

    const template = html`
      <link rel="stylesheet" href="src/ui/ChatPanel.css" />
      <div class="chat-panel-container">
        <div class="message-list">
          ${repeat(
            this.messages,
            (message) => message.id,
            (message) => html`
              <div
                class="message ${message.from === this.userPubkey ? "outgoing" : "incoming"}"
              >
                <p>${message.content}</p>
              </div>
            `,
          )}
        </div>
        <div class="message-input">
          <ui-textarea id="new-message" placeholder="Type a message"></ui-textarea>
          <ui-button @click=${() => this.sendMessage()}>Send</ui-button>
        </div>
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("notention-chat-panel", ChatPanel);
