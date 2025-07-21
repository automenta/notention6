// Enhanced Button Component - Professional Techno Minimalism
import "./Button.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | "icon-ai"
  | "icon-project"
  | "icon-personal";

export type ButtonSize = "small" | "medium" | "large";

export interface ButtonOptions {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
  tooltip?: string;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
  ripple?: boolean;
}

import '../components/Button';

export function createButton(options: ButtonOptions): HTMLButtonElement {
    const {
        label,
        onClick,
        variant = 'primary',
        size = 'medium',
        disabled = false,
        loading = false,
        fullWidth = false,
        iconOnly = false,
        className = '',
        tooltip,
        ariaLabel,
        type = 'button',
        ripple = false,
    } = options;

    const button = document.createElement('app-button') as any;
    button.setAttribute('label', label);
    button.setAttribute('variant', variant);
    if (size !== 'medium') button.setAttribute('size', size);
    if (disabled) button.setAttribute('disabled', '');
    if (loading) button.setAttribute('loading', '');
    if (fullWidth) button.setAttribute('full-width', '');
    if (iconOnly) button.setAttribute('icon-only', '');
    if (tooltip) button.setAttribute('tooltip', tooltip);
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
    if (type) button.setAttribute('type', type);
    if (ripple) button.setAttribute('ripple', '');
    if (className) button.className = className;

    button.addEventListener('click', onClick);

    return button as HTMLButtonElement;
}

// Utility function to create icon buttons
export function createIconButton(
  options: Omit<ButtonOptions, "iconOnly" | "label"> & { icon: string },
): HTMLButtonElement {
  return createButton({
    ...options,
    label: options.icon,
    iconOnly: true,
    ariaLabel: options.ariaLabel || "Icon button",
  });
}

// Utility function to create loading button
export function createLoadingButton(options: ButtonOptions): {
  button: HTMLButtonElement;
  setLoading: (loading: boolean) => void;
  setLabel: (label: string) => void;
} {
  const button = createButton(options);

  const setLoading = (loading: boolean) => {
    const textSpan = button.querySelector(".button-text");

    if (loading) {
      button.classList.add("loading");
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    } else {
      button.classList.remove("loading");
      button.disabled = options.disabled || false;
      button.removeAttribute("aria-busy");
    }
  };

  const setLabel = (label: string) => {
    const textSpan = button.querySelector(".button-text");
    if (textSpan) {
      textSpan.textContent = label;
    }
  };

  return { button, setLoading, setLabel };
}

// Utility function to create button group
export function createButtonGroup(buttons: ButtonOptions[]): HTMLDivElement {
  const group = document.createElement("div");
  group.className = "button-group";

  buttons.forEach((buttonOptions) => {
    const button = createButton(buttonOptions);
    group.appendChild(button);
  });

  return group;
}

// Utility function to create floating action button
export function createFAB(
  options: Omit<ButtonOptions, "fullWidth">,
): HTMLButtonElement {
  return createButton({
    ...options,
    className: `fab ${options.className || ""}`,
    variant: options.variant || "primary",
  });
}

// Utility function to create semantic action buttons
export function createAIButton(
  options: Omit<ButtonOptions, "variant">,
): HTMLButtonElement {
  return createButton({
    ...options,
    variant: "icon-ai",
    ariaLabel: options.ariaLabel || "AI action",
  });
}

export function createProjectButton(
  options: Omit<ButtonOptions, "variant">,
): HTMLButtonElement {
  return createButton({
    ...options,
    variant: "icon-project",
    ariaLabel: options.ariaLabel || "Project action",
  });
}

export function createPersonalButton(
  options: Omit<ButtonOptions, "variant">,
): HTMLButtonElement {
  return createButton({
    ...options,
    variant: "icon-personal",
    ariaLabel: options.ariaLabel || "Personal action",
  });
}
