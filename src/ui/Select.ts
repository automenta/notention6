import { html, render } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";
import { repeat } from "lit-html/directives/repeat.js";

export class Select extends HTMLElement {
  static get observedAttributes() {
    return ["value", "disabled"];
  }

  get value() {
    return this.getAttribute("value") || "";
  }

  set value(val) {
    this.setAttribute("value", val);
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

  private getOptions() {
    return Array.from(this.querySelectorAll("option")).map((option) => ({
      value: option.value,
      label: option.textContent || option.value,
    }));
  }

  private handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.value = target.value;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value } }),
    );
  }

  render() {
    const options = this.getOptions();
    const classes = {
      select: true,
    };

    const template = html`
      <link rel="stylesheet" href="src/ui/Select.css" />
      <select
        class=${classMap(classes)}
        .value=${this.value}
        ?disabled=${this.disabled}
        @change=${this.handleChange}
      >
        ${repeat(
          options,
          (option) => option.value,
          (option) =>
            html`<option value=${option.value}>${option.label}</option>`,
        )}
      </select>
    `;
    render(template, this.shadowRoot!);
  }
}

customElements.define("ui-select", Select);
