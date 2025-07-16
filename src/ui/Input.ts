export class Input extends HTMLElement {
  private _type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "search"
    | "tel"
    | "url" = "text";
  private _size: "sm" | "md" | "lg" = "md";
  private _variant: "default" | "filled" = "default";
  private _disabled = false;
  private _readonly = false;
  private _invalid = false;
  private _value = "";

  static get observedAttributes() {
    return [
      "type",
      "size",
      "variant",
      "disabled",
      "readonly",
      "invalid",
      "value",
      "placeholder",
      "label",
      "helper-text",
      "error-text",
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
        case "type":
          this._type = (newValue as any) || "text";
          break;
        case "size":
          this._size = (newValue as any) || "md";
          break;
        case "variant":
          this._variant = (newValue as any) || "default";
          break;
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
      }
      this.render();
    }
  }

  get value() {
    const input = this.shadowRoot?.querySelector("input") as HTMLInputElement;
    return input?.value || this._value;
  }

  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
    const input = this.shadowRoot?.querySelector("input") as HTMLInputElement;
    if (input) input.value = val;
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
    const input = this.shadowRoot?.querySelector("input");
    input?.focus();
  }

  blur() {
    const input = this.shadowRoot?.querySelector("input");
    input?.blur();
  }

  private setupEventListeners() {
    // Forward input events
    this.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      this._value = input.value;
      this.dispatchEvent(
        new CustomEvent("input", {
          detail: { value: input.value },
          bubbles: true,
        }),
      );
    });

    this.addEventListener("change", (e) => {
      const input = e.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { value: input.value },
          bubbles: true,
        }),
      );
    });
  }

  render() {
    if (!this.shadowRoot) return;

    const label = this.getAttribute("label");
    const placeholder = this.getAttribute("placeholder");
    const helperText = this.getAttribute("helper-text");
    const errorText = this.getAttribute("error-text");
    const id = `input-${Math.random().toString(36).substr(2, 9)}`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .input-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-field {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-family: var(--font-family-sans);
          transition: var(--transition-base);
          outline: none;
        }

        .input-field:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 1px var(--color-accent);
        }

        .input-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--color-background-secondary);
        }

        .input-field:readonly {
          background: var(--color-background-secondary);
          cursor: default;
        }

        .input-field.invalid {
          border-color: var(--color-error-500);
        }

        .input-field.invalid:focus {
          border-color: var(--color-error-500);
          box-shadow: 0 0 0 1px var(--color-error-500);
        }

        .input-field::placeholder {
          color: var(--color-text-muted);
        }

        /* Size variants */
        .input-field.sm {
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-sm);
          min-height: 32px;
        }

        .input-field.md {
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-sm);
          min-height: 40px;
        }

        .input-field.lg {
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-base);
          min-height: 48px;
        }

        /* Variant styles */
        .input-field.filled {
          background: var(--color-background-secondary);
          border: 1px solid transparent;
        }

        .input-field.filled:focus {
          background: var(--color-surface);
          border-color: var(--color-accent);
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

        .input-icon {
          position: absolute;
          right: var(--space-3);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .input-icon.left {
          left: var(--space-3);
          right: unset;
        }

        .input-field.has-icon-left {
          padding-left: calc(var(--space-3) + 20px + var(--space-2));
        }

        .input-field.has-icon-right {
          padding-right: calc(var(--space-3) + 20px + var(--space-2));
        }
      </style>

      <div class="input-group">
        ${label ? `<label for="${id}" class="input-label">${label}</label>` : ""}
        
        <div class="input-wrapper">
          <slot name="icon-left">
            <div class="input-icon left">
              <slot name="icon-left-content"></slot>
            </div>
          </slot>
          
          <input
            id="${id}"
            class="input-field ${this._size} ${this._variant} ${this._invalid ? "invalid" : ""}"
            type="${this._type}"
            value="${this._value}"
            ${placeholder ? `placeholder="${placeholder}"` : ""}
            ${this._disabled ? "disabled" : ""}
            ${this._readonly ? "readonly" : ""}
          />
          
          <slot name="icon-right">
            <div class="input-icon">
              <slot name="icon-right-content"></slot>
            </div>
          </slot>
        </div>

        ${errorText && this._invalid ? `<div class="error-text">${errorText}</div>` : ""}
        ${helperText && !this._invalid ? `<div class="helper-text">${helperText}</div>` : ""}
      </div>
    `;

    // Add event listeners for the input
    this.addInputEventListeners();
  }

  private addInputEventListeners() {
    if (!this.shadowRoot) return;

    const input = this.shadowRoot.querySelector("input");
    if (!input) return;

    input.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      this._value = target.value;
      this.dispatchEvent(
        new CustomEvent("input", {
          detail: { value: target.value },
          bubbles: true,
        }),
      );
    });

    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { value: target.value },
          bubbles: true,
        }),
      );
    });

    input.addEventListener("focus", () => {
      this.dispatchEvent(new CustomEvent("focus", { bubbles: true }));
    });

    input.addEventListener("blur", () => {
      this.dispatchEvent(new CustomEvent("blur", { bubbles: true }));
    });

    input.addEventListener("keydown", (e) => {
      this.dispatchEvent(
        new CustomEvent("keydown", {
          detail: { key: e.key, code: e.code },
          bubbles: true,
        }),
      );
    });
  }
}

customElements.define("ui-input", Input);
