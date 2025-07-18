// src/ui-rewrite/Button.ts

interface ButtonOptions {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
}

export function createButton(options: ButtonOptions): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = options.label;
    btn.className = `btn btn-${options.variant || "primary"}`;
    btn.disabled = options.disabled || false;

    btn.addEventListener("click", options.onClick);

    return btn;
}
