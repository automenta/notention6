import { useAppStore } from "../store";
import { DirectMessage } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { ChatService } from "../services/ChatService";
import "./Card";
import "./Button";
import "./Input";
import "./Textarea";

export class ChatPanel extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private messages: DirectMessage[] = [];
  private currentContactPubkey: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        directMessages: state.directMessages,
        currentContactPubkey: state.currentContactPubkey,
      }),
      ({ directMessages, currentContactPubkey }) => {
        if (currentContactPubkey) {
          this.currentContactPubkey = currentContactPubkey;
          this.messages = directMessages.filter(
            (dm) =>
              dm.from === currentContactPubkey || dm.to === currentContactPubkey,
          );
          this.render();
        }
      },
      {
        equalityFn: (a, b) =>
          a.directMessages === b.directMessages &&
          a.currentContactPubkey === b.currentContactPubkey,
      },
    );
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  private async sendMessage() {
    const textarea = this.shadowRoot?.querySelector<HTMLTextAreaElement>("#new-message");
    const content = textarea?.value;
    if (content && this.currentContactPubkey) {
      await ChatService.sendMessage(this.currentContactPubkey, content);
      textarea.value = "";
    }
  }

  render() {
    if (!this.shadowRoot) return;

    if (!this.currentContactPubkey) {
      render(html`<div>Select a contact to start chatting</div>`, this.shadowRoot);
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
                class="message ${message.from === this.currentContactPubkey
                  ? "incoming"
                  : "outgoing"}"
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
