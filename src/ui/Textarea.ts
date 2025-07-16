export class Textarea extends HTMLElement {
  private _disabled = false;
  private _readonly = false;
  private _invalid = false;
  private _value = "";
  private _autoResize = false;

  static get observedAttributes() {
    return [
      "disabled",
      "readonly",
      "invalid",
      "value",
      "placeholder",
      "label",
      "helper-text",
      "error-text",
      "rows",
      "auto-resize",
    ];
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
        case "disabled":
          this._disabled = newValue !== null;
          break;
        case "readonly":
          this._readonly = newValue !== null;
          break;
        case "invalid":
          this._invalid = newValue !== null;
          break;
        case "value":
          this._value = newValue || "";
          break;
        case "auto-resize":
          this._autoResize = newValue !== null;
          break;
      }
      this.render();
    }
  }

  get value() {
    const textarea = this.shadowRoot?.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;
    return textarea?.value || this._value;
  }

  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
    const textarea = this.shadowRoot?.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = val;
      if (this._autoResize) {
        this.autoResize(textarea);
      }
    }
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

  focus() {
    const textarea = this.shadowRoot?.querySelector("textarea");
    textarea?.focus();
  }

  blur() {
    const textarea = this.shadowRoot?.querySelector("textarea");
    textarea?.blur();
  }

  private autoResize(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  private setupEventListeners() {
    // Auto-resize functionality
    if (this._autoResize) {
      this.addEventListener("input", (e) => {
        const textarea = e.target as HTMLTextAreaElement;
        this.autoResize(textarea);
      });
    }
  }

  render() {
    if (!this.shadowRoot) return;

    const label = this.getAttribute("label");
    const placeholder = this.getAttribute("placeholder");
    const helperText = this.getAttribute("helper-text");
    const errorText = this.getAttribute("error-text");
    const rows = this.getAttribute("rows") || "4";
    const id = `textarea-${Math.random().toString(36).substr(2, 9)}`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .textarea-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .textarea-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .textarea-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .textarea-field {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-family: var(--font-family-sans);
          padding: var(--space-3);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
          resize: vertical;
          transition: var(--transition-base);
          outline: none;
          min-height: 80px;
        }

        .textarea-field.auto-resize {
          resize: none;
          overflow-y: hidden;
        }

        .textarea-field:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 1px var(--color-accent);
        }

        .textarea-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--color-background-secondary);
        }

        .textarea-field:readonly {
          background: var(--color-background-secondary);
          cursor: default;
          resize: none;
        }

        .textarea-field.invalid {
          border-color: var(--color-error-500);
        }

        .textarea-field.invalid:focus {
          border-color: var(--color-error-500);
          box-shadow: 0 0 0 1px var(--color-error-500);
        }

        .textarea-field::placeholder {
          color: var(--color-text-muted);
        }

        .helper-text {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: var(--space-1);
        }

        .error-text {
          font-size: var(--font-size-xs);
          color: var(--color-error-500);
          margin-top: var(--space-1);
        }

        .textarea-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-1);
        }

        .char-count {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        /* Scrollbar styling */
        .textarea-field::-webkit-scrollbar {
          width: 8px;
        }

        .textarea-field::-webkit-scrollbar-track {
          background: var(--color-background-secondary);
          border-radius: var(--radius-sm);
        }

        .textarea-field::-webkit-scrollbar-thumb {
          background: var(--color-border-strong);
          border-radius: var(--radius-sm);
        }

        .textarea-field::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-muted);
        }
      </style>

      <div class="textarea-group">
        ${label ? `<label for="${id}" class="textarea-label">${label}</label>` : ""}
        
        <div class="textarea-wrapper">
          <textarea
            id="${id}"
            class="textarea-field ${this._invalid ? "invalid" : ""} ${this._autoResize ? "auto-resize" : ""}"
            rows="${rows}"
            ${placeholder ? `placeholder="${placeholder}"` : ""}
            ${this._disabled ? "disabled" : ""}
            ${this._readonly ? "readonly" : ""}
          >${this._value}</textarea>
        </div>

        <div class="textarea-footer">
          <div class="textarea-messages">
            ${errorText && this._invalid ? `<div class="error-text">${errorText}</div>` : ""}
            ${helperText && !this._invalid ? `<div class="helper-text">${helperText}</div>` : ""}
          </div>
          
          <div class="char-count">
            <span class="current-count">0</span>
            ${this.getAttribute("maxlength") ? `/<span class="max-count">${this.getAttribute("maxlength")}</span>` : ""}
          </div>
        </div>
      </div>
    `;

    // Add event listeners for the textarea
    this.addTextareaEventListeners();
  }

  private addTextareaEventListeners() {
    if (!this.shadowRoot) return;

    const textarea = this.shadowRoot.querySelector("textarea");
    const currentCount = this.shadowRoot.querySelector(".current-count");

    if (!textarea) return;

    // Update character count
    const updateCharCount = () => {
      if (currentCount) {
        currentCount.textContent = textarea.value.length.toString();
      }
    };

    textarea.addEventListener("input", (e) => {
      const target = e.target as HTMLTextAreaElement;
      this._value = target.value;

      updateCharCount();

      if (this._autoResize) {
        this.autoResize(target);
      }

      this.dispatchEvent(
        new CustomEvent("input", {
          detail: { value: target.value },
          bubbles: true,
        }),
      );
    });

    textarea.addEventListener("change", (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { value: target.value },
          bubbles: true,
        }),
      );
    });

    textarea.addEventListener("focus", () => {
      this.dispatchEvent(new CustomEvent("focus", { bubbles: true }));
    });

    textarea.addEventListener("blur", () => {
      this.dispatchEvent(new CustomEvent("blur", { bubbles: true }));
    });

    textarea.addEventListener("keydown", (e) => {
      this.dispatchEvent(
        new CustomEvent("keydown", {
          detail: { key: e.key, code: e.code },
          bubbles: true,
        }),
      );
    });

    // Set initial value and character count
    textarea.value = this._value;
    updateCharCount();

    if (this._autoResize) {
      this.autoResize(textarea);
    }
  }
}

customElements.define("ui-textarea", Textarea);
