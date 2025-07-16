import { useAppStore } from "../store";
import { OntologyNode } from "../../shared/types";
import "./Button";

export class OntologyEditor extends HTMLElement {
  private unsubscribe: () => void = () => {};
  private ontologyNodes: { [id: string]: OntologyNode } = {};

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.unsubscribe = useAppStore.subscribe((state) => {
      this.ontologyNodes = state.ontology.nodes;
      this.render();
    });

    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }

        .ontology-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }

        .ontology-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
        }

        .ontology-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .ontology-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-6);
          line-height: var(--line-height-relaxed);
        }

        .ontology-content {
          flex: 1;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          overflow-y: auto;
        }

        .coming-soon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
          text-align: center;
        }

        .coming-soon-icon {
          width: 64px;
          height: 64px;
          margin-bottom: var(--space-4);
          color: var(--color-text-muted);
        }

        .coming-soon-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .coming-soon-description {
          color: var(--color-text-muted);
          max-width: 400px;
          line-height: var(--line-height-relaxed);
        }
      </style>

      <div class="ontology-container">
        <div class="ontology-header">
          <h1 class="ontology-title">Ontology</h1>
          <ui-button variant="primary" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14m-7-7h14"></path>
            </svg>
            Add Concept
          </ui-button>
        </div>

        <p class="ontology-description">
          Define and organize semantic concepts to enhance note categorization and discovery. 
          Build relationships between ideas to enable intelligent tagging and search.
        </p>

        <div class="ontology-content">
          <div class="coming-soon">
            <svg class="coming-soon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="2"></circle>
              <path d="m16.24 7.76-1.42 1.42M8.18 8.18l-1.42-1.42M21 12h-2M5 12H3M16.24 16.24l-1.42-1.42M8.18 15.82l-1.42 1.42"></path>
            </svg>
            <h3 class="coming-soon-title">Ontology Editor Coming Soon</h3>
            <p class="coming-soon-description">
              The visual ontology editor with drag-and-drop functionality is currently under development. 
              You'll be able to create hierarchical concept trees and define semantic relationships 
              to power intelligent note organization and discovery.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("notention-ontology-editor", OntologyEditor);
