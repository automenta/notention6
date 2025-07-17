import { useAppStore } from "../store";
import { OntologyNode } from "../../shared/types";
import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { when } from "lit-html/directives/when.js";
import { logger } from "../lib/utils";
import "./Button";
import "./Input";
import "./Icon";

const log = logger("notention-ontology-editor");

export class OntologyEditor extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private nodes: { [id: string]: OntologyNode } = {};
  private selectedNodeId: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    log("Component constructed");
  }

  connectedCallback() {
    log("Component connected");
    this.unsubscribe = useAppStore.subscribe(
      (state) => ({
        nodes: state.ontology.nodes,
        selectedNodeId: state.selectedOntologyNodeId,
      }),
      ({ nodes, selectedNodeId }) => {
        this.nodes = nodes;
        this.selectedNodeId = selectedNodeId;
        this.render();
      },
      {
        equalityFn: (a, b) =>
          a.nodes === b.nodes && a.selectedNodeId === b.selectedNodeId,
      },
    );

    const initialState = useAppStore.getState();
    this.nodes = initialState.ontology.nodes;
    this.selectedNodeId = initialState.selectedOntologyNodeId;
    this.render();
  }

  disconnectedCallback() {
    log("Component disconnected");
    this.unsubscribe();
  }

  private handleSelectNode(nodeId: string) {
    log(`Node selected: ${nodeId}`);
    useAppStore.getState().setSelectedOntologyNodeId(nodeId);
  }

  private handleUpdateNode(e: Event) {
    e.preventDefault();
    if (!this.selectedNodeId) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const label = formData.get("label") as string;
    // TODO: Add support for attributes
    log(`Updating node ${this.selectedNodeId} with label: ${label}`);
    useAppStore.getState().updateOntologyNode(this.selectedNodeId, { label });
  }

  private handleAddNode(parentId: string | null = null) {
    const label = prompt("Enter new concept label:");
    if (label) {
      log(`Adding new node with label: ${label}`);
      useAppStore.getState().addOntologyNode({ label, parentId });
    }
  }

  private handleDeleteNode() {
    if (
      this.selectedNodeId &&
      confirm("Are you sure you want to delete this concept?")
    ) {
      log(`Deleting node: ${this.selectedNodeId}`);
      useAppStore.getState().deleteOntologyNode(this.selectedNodeId);
    }
  }

  private handleAddAttribute() {
    if (!this.selectedNodeId) return;
    const keyInput = this.shadowRoot?.querySelector("#add-attribute-key") as HTMLInputElement;
    const valueInput = this.shadowRoot?.querySelector("#add-attribute-value") as HTMLInputElement;
    if (keyInput && valueInput && keyInput.value) {
      const selectedNode = this.nodes[this.selectedNodeId];
      const newAttributes = {
        ...selectedNode.attributes,
        [keyInput.value]: valueInput.value,
      };
      useAppStore.getState().updateOntologyNode(this.selectedNodeId, { attributes: newAttributes });
      keyInput.value = "";
      valueInput.value = "";
    }
  }

  private handleRemoveAttribute(key: string) {
    if (!this.selectedNodeId) return;
    const selectedNode = this.nodes[this.selectedNodeId];
    const newAttributes = { ...selectedNode.attributes };
    delete newAttributes[key];
    useAppStore.getState().updateOntologyNode(this.selectedNodeId, { attributes: newAttributes });
  }

  private async handleAISuggest() {
    log("AI Suggest clicked");
    // AI Service integration goes here
  }

  private renderNodeTree(parentId: string | null = null) {
    const children = Object.values(this.nodes).filter(
      (node) => node.parentId === parentId,
    );
    if (children.length === 0) return null;

    return html`
      <ul class="node-group">
        ${repeat(
          children,
          (node) => node.id,
          (node) => html`
            <li
              class="node-item ${this.selectedNodeId === node.id
                ? "selected"
                : ""}"
            >
              <div
                class="node-label"
                @click=${() => this.handleSelectNode(node.id)}
              >
                <ui-icon name="corner-down-right" class="node-icon"></ui-icon>
                <span>${node.label}</span>
              </div>
              ${this.renderNodeTree(node.id)}
            </li>
          `,
        )}
      </ul>
    `;
  }

  private renderEditorPanel() {
    const selectedNode = this.selectedNodeId
      ? this.nodes[this.selectedNodeId]
      : null;

    return html`
      <div class="editor-panel">
        ${when(
          selectedNode,
          () => html`
            <h3 class="panel-title">Edit Concept</h3>
            <form @submit=${(e: Event) => this.handleUpdateNode(e)}>
              <div class="form-group">
                <label for="node-label">Label</label>
                <ui-input
                  id="node-label"
                  name="label"
                  .value=${selectedNode!.label}
                ></ui-input>
              </div>
              <div class="attributes-section">
                <h4>Attributes</h4>
                ${repeat(
                  Object.entries(selectedNode!.attributes || {}),
                  ([key]) => key,
                  ([key, value]) => html`
                    <div class="attribute-item">
                      <span>${key}:</span>
                      <span>${value}</span>
                      <button @click=${() => this.handleRemoveAttribute(key)}>
                        <ui-icon name="x"></ui-icon>
                      </button>
                    </div>
                  `
                )}
                <div class="add-attribute">
                  <ui-input id="add-attribute-key" placeholder="Key"></ui-input>
                  <ui-input id="add-attribute-value" placeholder="Value"></ui-input>
                  <ui-button @click=${() => this.handleAddAttribute()}>Add</ui-button>
                </div>
              </div>
              <div class="form-actions">
                <ui-button type="submit" variant="primary">Save</ui-button>
                <ui-button
                  type="button"
                  variant="danger"
                  @click=${() => this.handleDeleteNode()}
                  >Delete</ui-button
                >
              </div>
            </form>
          `,
          () => html`
            <div class="empty-panel">
              <ui-icon name="mouse-pointer-2" class="empty-icon"></ui-icon>
              <p>Select a concept to edit its properties.</p>
            </div>
          `,
        )}
      </div>
    `;
  }

  render() {
    if (!this.shadowRoot) return;
    log("Rendering ontology editor");

    const template = html`
      <link rel="stylesheet" href="src/ui/OntologyEditor.css" />
      <div class="ontology-container">
        <header class="ontology-header">
          <h1 class="ontology-title">Ontology</h1>
          <div class="header-actions">
            <ui-button variant="secondary" @click=${() => this.handleAISuggest()}>
              <ui-icon name="sparkles" slot="icon-left"></ui-icon>
              AI Suggest
            </ui-button>
            <ui-button variant="primary" @click=${() => this.handleAddNode(null)}>
              <ui-icon name="plus" slot="icon-left"></ui-icon>
              Add Root Concept
            </ui-button>
          </div>
        </header>
        <div class="ontology-body">
          <div class="tree-panel">
            <h2 class="panel-title">Concept Hierarchy</h2>
            <div class="tree-container">${this.renderNodeTree(null)}</div>
          </div>
          ${this.renderEditorPanel()}
        </div>
      </div>
    `;
    render(template, this.shadowRoot);
  }
}

customElements.define("notention-ontology-editor", OntologyEditor);
