export class Button extends HTMLElement {
  private _variant: "primary" | "secondary" | "ghost" | "danger" = "primary";
  private _size: "sm" | "md" | "lg" = "md";
  private _disabled = false;
  private _loading = false;
  private _iconOnly = false;

  static get observedAttributes() {
    return ["variant", "size", "disabled", "loading", "icon-only"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      switch (name) {
        case "variant":
          this._variant = (newValue as any) || "primary";
          break;
        case "size":
          this._size = (newValue as any) || "md";
          break;
        case "disabled":
          this._disabled = newValue !== null;
          break;
        case "loading":
          this._loading = newValue !== null;
          break;
        case "icon-only":
          this._iconOnly = newValue !== null;
          break;
      }
      this.render();
    }
  }

  get variant() {
    return this._variant;
  }
  set variant(value) {
    this._variant = value;
    this.setAttribute("variant", value);
  }

  get size() {
    return this._size;
  }
  set size(value) {
    this._size = value;
    this.setAttribute("size", value);
  }

  get disabled() {
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = value;
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get loading() {
    return this._loading;
  }
  set loading(value) {
    this._loading = value;
    if (value) {
      this.setAttribute("loading", "");
    } else {
      this.removeAttribute("loading");
    }
  }

  private setupEventListeners() {
    this.addEventListener("click", (e) => {
      if (this._disabled || this._loading) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  render() {
    if (!this.shadowRoot) return;

    const isDisabled = this._disabled || this._loading;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-family-sans);
          font-weight: var(--font-weight-medium);
          text-decoration: none;
          cursor: pointer;
          transition: var(--transition-base);
          position: relative;
          white-space: nowrap;
          user-select: none;
          outline: none;
        }

        button:focus-visible {
          box-shadow: 0 0 0 2px var(--color-accent);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Size variants */
        button.sm {
          padding: ${this._iconOnly ? "var(--space-1)" : "var(--space-1) var(--space-3)"};
          font-size: var(--font-size-sm);
          min-height: 32px;
        }

        button.md {
          padding: ${this._iconOnly ? "var(--space-2)" : "var(--space-2) var(--space-4)"};
          font-size: var(--font-size-sm);
          min-height: 40px;
        }

        button.lg {
          padding: ${this._iconOnly ? "var(--space-3)" : "var(--space-3) var(--space-6)"};
          font-size: var(--font-size-base);
          min-height: 48px;
        }

        button.icon-only {
          aspect-ratio: 1;
          padding: var(--space-2);
        }

        /* Variant styles */
        button.primary {
          background: var(--color-accent);
          color: var(--color-text-inverse);
        }

        button.primary:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }

        button.secondary {
          background: var(--color-surface);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
        }

        button.secondary:hover:not(:disabled) {
          background: var(--color-surface-hover);
          border-color: var(--color-border-strong);
        }

        button.ghost {
          background: transparent;
          color: var(--color-text-secondary);
        }

        button.ghost:hover:not(:disabled) {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        button.danger {
          background: var(--color-error-500);
          color: var(--color-text-inverse);
        }

        button.danger:hover:not(:disabled) {
          background: var(--color-error-600);
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: var(--radius-full);
          animation: spin 1s linear infinite;
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .button-content.loading {
          opacity: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>

      <button 
        class="${this._variant} ${this._size} ${this._iconOnly ? "icon-only" : ""}"
        ${isDisabled ? "disabled" : ""}
        type="button"
      >
        ${this._loading ? '<div class="loading-spinner"></div>' : ""}
        <div class="button-content ${this._loading ? "loading" : ""}">
          <slot></slot>
        </div>
      </button>
    `;
  }
}

customElements.define("ui-button", Button);
