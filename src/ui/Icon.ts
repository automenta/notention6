import { html, render } from "lit-html";
import { unsafeSVG } from "lit-html/directives/unsafe-svg.js";
import { icons } from "./icons";

export class Icon extends HTMLElement {
  static get observedAttributes() {
    return ["icon"];
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const iconName = this.getAttribute("icon") || "file-text";
    const iconSVG = icons[iconName] || icons["file-text"];
    const template = html`<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      ${unsafeSVG(iconSVG)}
    </svg>`;
    render(template, this);
  }
}

customElements.define("ui-icon", Icon);
