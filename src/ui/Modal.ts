export class Modal extends HTMLElement {
  private _open = false;
  private _size: "sm" | "md" | "lg" | "xl" | "full" = "md";
  private _showClose = true;
  private _persistent = false;

  static get observedAttributes() {
    return ["open", "size", "show-close", "persistent"];
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
        case "open":
          this._open = newValue !== null;
          break;
        case "size":
          this._size = (newValue as any) || "md";
          break;
        case "show-close":
          this._showClose = newValue !== "false";
          break;
        case "persistent":
          this._persistent = newValue !== null;
          break;
      }
      this.render();
    }
  }

  get open() {
    return this._open;
  }
  set open(value) {
    this._open = value;
    if (value) {
      this.setAttribute("open", "");
      document.body.style.overflow = "hidden";
    } else {
      this.removeAttribute("open");
      document.body.style.overflow = "";
    }
    this.render();
  }

  close() {
    if (!this._persistent) {
      this.open = false;
      this.dispatchEvent(new CustomEvent("modal-close", { bubbles: true }));
    }
  }

  private setupEventListeners() {
    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this._open && !this._persistent) {
        this.close();
      }
    });
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: ${this._open ? "block" : "none"};
          position: fixed;
          inset: 0;
          z-index: var(--z-modal);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          overflow-y: auto;
        }

        .modal-content {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-height: calc(100vh - 2rem);
          overflow-y: auto;
          animation: slideUp 0.2s ease-out;
          position: relative;
        }

        /* Size variants */
        .modal-content.sm {
          max-width: 400px;
        }

        .modal-content.md {
          max-width: 500px;
        }

        .modal-content.lg {
          max-width: 700px;
        }

        .modal-content.xl {
          max-width: 900px;
        }

        .modal-content.full {
          max-width: none;
          width: calc(100vw - 2rem);
          height: calc(100vh - 2rem);
          max-height: none;
        }

        .modal-header {
          padding: var(--space-6) var(--space-6) var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          background: var(--color-surface);
          z-index: 1;
        }

        .modal-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          padding: var(--space-2);
          border-radius: var(--radius-md);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition-base);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .modal-body {
          padding: var(--space-6);
        }

        .modal-footer {
          padding: var(--space-4) var(--space-6) var(--space-6) var(--space-6);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          position: sticky;
          bottom: 0;
          background: var(--color-surface);
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .modal-container {
            padding: var(--space-2);
            align-items: flex-end;
          }

          .modal-content {
            max-height: 90vh;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding-left: var(--space-4);
            padding-right: var(--space-4);
          }
        }

        /* Hide scrollbar but keep functionality */
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: var(--radius-full);
        }
      </style>

      <div class="modal-overlay" @click="${(e: Event) => {
        if (e.target === e.currentTarget && !this._persistent) {
          this.close();
        }
      }}"></div>
      
      <div class="modal-container">
        <div class="modal-content ${this._size}">
          <slot name="header">
            <div class="modal-header">
              <h2 class="modal-title">
                <slot name="title"></slot>
              </h2>
              ${
                this._showClose
                  ? `
                <button class="close-button" @click="${() => this.close()}">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              `
                  : ""
              }
            </div>
          </slot>
          
          <div class="modal-body">
            <slot></slot>
          </div>
          
          <slot name="footer">
            <div class="modal-footer">
              <slot name="actions"></slot>
            </div>
          </slot>
        </div>
      </div>
    `;

    // Add event listeners for dynamic content
    this.addEventListeners();
  }

  private addEventListeners() {
    if (!this.shadowRoot) return;

    const overlay = this.shadowRoot.querySelector(".modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay && !this._persistent) {
          this.close();
        }
      });
    }

    const closeButton = this.shadowRoot.querySelector(".close-button");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.close());
    }
  }
}

customElements.define("ui-modal", Modal);
