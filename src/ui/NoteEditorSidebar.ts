import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { Note, NotentionTemplate } from "../../shared/types";
import { logger } from "../lib/utils";
import "./Input";
import "./Button";
import "./Icon";
import { useAppStore } from "../store";

const log = logger("note-editor-sidebar");

export class NoteEditorSidebar extends HTMLElement {
  private note: Note | null = null;
  private templates: NotentionTemplate[] = [];

  static get observedAttributes() {
    return ["note"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.templates = Object.values(useAppStore.getState().templates);
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "note" && oldValue !== newValue) {
      log("Note attribute changed");
      this.note = JSON.parse(newValue);
      this.render();
    }
  }

  private handleUpdate(detail: Partial<Note>) {
    this.dispatchEvent(new CustomEvent("update-note", { detail }));
  }

  private handleAddTag() {
    const input = this.shadowRoot?.querySelector("#add-tag-input") as HTMLInputElement;
    if (input && input.value) {
      this.handleUpdate({
        tags: [...(this.note?.tags || []), input.value],
      });
      input.value = "";
    }
  }

  private handleRemoveTag(tag: string) {
    this.handleUpdate({
      tags: this.note?.tags?.filter((t) => t !== tag),
    });
  }

  private handleAddValue() {
    const keyInput = this.shadowRoot?.querySelector("#add-value-key") as HTMLInputElement;
    const valueInput = this.shadowRoot?.querySelector("#add-value-value") as HTMLInputElement;
    if (keyInput && valueInput && keyInput.value) {
      this.handleUpdate({
        values: {
          ...this.note?.values,
          [keyInput.value]: valueInput.value,
        },
      });
      keyInput.value = "";
      valueInput.value = "";
    }
  }

  private handleRemoveValue(key: string) {
    const values = { ...this.note?.values };
    delete values[key];
    this.handleUpdate({ values });
  }

  private handleApplyTemplate(e: Event) {
    const templateId = (e.target as HTMLSelectElement).value;
    const template = this.templates.find((t) => t.id === templateId);
    if (template && this.note) {
      const newFields = { ...this.note.fields };
      for (const field of template.fields) {
        newFields[field.name] = field.defaultValue || "";
      }
      this.handleUpdate({
        fields: newFields,
        tags: [...new Set([...this.note.tags, ...template.defaultTags])],
        values: { ...this.note.values, ...template.defaultValues },
      });
    }
  }

  render() {
    if (!this.shadowRoot) return;

    const template = html`
      <link rel="stylesheet" href="src/ui/NoteEditorSidebar.css" />
      <div class="sidebar-container">
        <h3 class="sidebar-title">Metadata</h3>

        <!-- Templates -->
        <div class="metadata-section">
          <label for="template-select">Template</label>
          <select id="template-select" @change=${this.handleApplyTemplate}>
            <option value="">None</option>
            ${repeat(
              this.templates,
              (t) => t.id,
              (t) => html`<option value=${t.id}>${t.name}</option>`,
            )}
          </select>
        </div>

        <!-- Tags -->
        <div class="metadata-section">
          <label for="add-tag-input">Tags</label>
          <div class="tag-list">
            ${repeat(
              this.note?.tags || [],
              (tag) => tag,
              (tag) => html`
                <div class="tag-item">
                  <span>${tag}</span>
                  <button @click=${() => this.handleRemoveTag(tag)}>
                    <ui-icon name="x"></ui-icon>
                  </button>
                </div>
              `,
            )}
          </div>
          <div class="add-tag">
            <ui-input id="add-tag-input" placeholder="Add a tag"></ui-input>
            <ui-button @click=${this.handleAddTag}>Add</ui-button>
          </div>
        </div>

        <!-- Values -->
        <div class="metadata-section">
          <label>Values</label>
          <div class="value-list">
            ${repeat(
              Object.entries(this.note?.values || {}),
              ([key]) => key,
              ([key, value]) => html`
                <div class="value-item">
                  <strong>${key}:</strong>
                  <span>${value}</span>
                  <button @click=${() => this.handleRemoveValue(key)}>
                    <ui-icon name="x"></ui-icon>
                  </button>
                </div>
              `,
            )}
          </div>
          <div class="add-value">
            <ui-input id="add-value-key" placeholder="Key"></ui-input>
            <ui-input id="add-value-value" placeholder="Value"></ui-input>
            <ui-button @click=${this.handleAddValue}>Add</ui-button>
          </div>
        </div>

        <!-- Fields -->
        <div class="metadata-section">
          <label>Fields</label>
          <div class="field-list">
            ${repeat(
              Object.entries(this.note?.fields || {}),
              ([key]) => key,
              ([key, value]) => html`
                <div class="field-item">
                  <label for="field-${key}">${key}</label>
                  <ui-input
                    id="field-${key}"
                    .value=${value}
                    @input=${(e: Event) => {
                      const fields = { ...this.note?.fields };
                      fields[key] = (e.target as HTMLInputElement).value;
                      this.handleUpdate({ fields });
                    }}
                  ></ui-input>
                </div>
              `,
            )}
          </div>
        </div>
      </div>
    `;

    render(template, this.shadowRoot);
  }
}

customElements.define("note-editor-sidebar", NoteEditorSidebar);
