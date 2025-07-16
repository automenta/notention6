import { html, render } from "lit-html";

export class Modal extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(isOpen) {
    if (isOpen) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }

  render() {
    if (!this.open) {
      render(html``, this.shadowRoot!);
      return;
    }

    const template = html`
      <link rel="stylesheet" href="src/ui/Modal.css" />
      <div class="backdrop" @click=${() => this.close()}></div>
      <div class="modal">
        <button class="close-button" @click=${() => this.close()}>
          &times;
        </button>
        <slot></slot>
      </div>
    `;
    render(template, this.shadowRoot!);
  }
}

customElements.define("ui-modal", Modal);
