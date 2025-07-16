import { html, render } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";

export class Input extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "disabled", "type", "value", "placeholder"];
  }

  get variant() {
    return this.getAttribute("variant") || "default";
  }

  get size() {
    return this.getAttribute("size") || "md";
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  get type() {
    return this.getAttribute("type") || "text";
  }

  get value() {
    return this.getAttribute("value") || "";
  }

  get placeholder() {
    return this.getAttribute("placeholder") || "";
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
      input: true,
      [`input-${this.variant}`]: true,
      [`input-${this.size}`]: true,
    };

    const template = html`
      <link rel="stylesheet" href="src/ui/Input.css" />
      <input
        class=${classMap(classes)}
        type=${this.type}
        .value=${this.value}
        placeholder=${this.placeholder}
        ?disabled=${this.disabled}
      />
    `;
    render(template, this.shadowRoot!);
  }
}

customElements.define("ui-input", Input);
