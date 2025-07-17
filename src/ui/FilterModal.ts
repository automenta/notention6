import { html, render } from "lit-html";
import { useAppStore } from "../store";
import { SearchFilters } from "../../shared/types";
import { logger } from "../lib/utils";
import "./Button";
import "./Input";

const log = logger("filter-modal");

export class FilterModal extends HTMLElement {
  private filters: SearchFilters = {};

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.filters = useAppStore.getState().searchFilters;
    this.render();
  }

  private handleApplyFilters() {
    useAppStore.getState().setSearchFilters(this.filters);
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private handleClearFilters() {
    useAppStore.getState().setSearchFilters({});
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    this.filters = { ...this.filters, [name]: value };
  }

  render() {
    if (!this.shadowRoot) return;

    const template = html`
      <link rel="stylesheet" href="src/ui/FilterModal.css" />
      <div class="modal-overlay">
        <div class="modal-content">
          <h3 class="modal-title">Filter Notes</h3>
          <div class="filter-section">
            <label for="tags-input">Tags (comma-separated)</label>
            <ui-input
              id="tags-input"
              name="tags"
              .value=${this.filters.tags?.join(", ") || ""}
              @input=${this.handleInputChange}
            ></ui-input>
          </div>
          <div class="modal-actions">
            <ui-button variant="secondary" @click=${this.handleClearFilters}>Clear</ui-button>
            <ui-button @click=${this.handleApplyFilters}>Apply</ui-button>
          </div>
        </div>
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("filter-modal", FilterModal);
