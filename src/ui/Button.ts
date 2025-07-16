import { html, render } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";

export class Button extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "disabled"];
  }

  get variant() {
    return this.getAttribute("variant") || "primary";
  }

  get size() {
    return this.getAttribute("size") || "md";
  }

  get disabled() {
    return this.hasAttribute("disabled");
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

  render() {
    const classes = {
      btn: true,
      [`btn-${this.variant}`]: true,
      [`btn-${this.size}`]: true,
    };

    const template = html`
      <link rel="stylesheet" href="src/ui/Button.css" />
      <button class=${classMap(classes)} ?disabled=${this.disabled}>
        <slot></slot>
      </button>
    `;
    render(template, this.shadowRoot!);
  }
}

customElements.define("ui-button", Button);
