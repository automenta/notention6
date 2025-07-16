import { html, render } from "lit-html";

export class Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const template = html`
      <link rel="stylesheet" href="src/ui/Card.css" />
      <div class="card">
        <slot></slot>
      </div>
    `;
    render(template, this.shadowRoot!);
  }
}

customElements.define("ui-card", Card);
