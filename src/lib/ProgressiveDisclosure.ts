// Progressive Disclosure System - Reduce Cognitive Load
import "./ProgressiveDisclosure.css";

export interface DisclosureOptions {
  trigger: HTMLElement;
  content: HTMLElement;
  expanded?: boolean;
  expandText?: string;
  collapseText?: string;
  expandIcon?: string;
  collapseIcon?: string;
  animationDuration?: number;
  expandOnHover?: boolean;
  persistent?: boolean; // Remember state in localStorage
  storageKey?: string;
  onExpand?: () => void;
  onCollapse?: () => void;
  triggerPosition?: "before" | "after" | "replace";
}

export class ProgressiveDisclosure {
  private trigger: HTMLElement;
  private content: HTMLElement;
  private expanded: boolean;
  private options: DisclosureOptions;
  private originalTriggerContent: string;

  constructor(options: DisclosureOptions) {
    this.options = {
      expandText: "Show more",
      collapseText: "Show less",
      expandIcon: "▼",
      collapseIcon: "▲",
      animationDuration: 300,
      expandOnHover: false,
      persistent: false,
      triggerPosition: "after",
      ...options
    };

    this.trigger = options.trigger;
    this.content = options.content;
    this.originalTriggerContent = this.trigger.textContent || "";

    // Load persistent state
    if (this.options.persistent && this.options.storageKey) {
      const saved = localStorage.getItem(this.options.storageKey);
      this.expanded = saved ? JSON.parse(saved) : (options.expanded || false);
    } else {
      this.expanded = options.expanded || false;
    }

    this.init();
  }

  private init() {
    // Setup content
    this.content.classList.add("disclosure-content");
    if (!this.expanded) {
      this.content.classList.add("collapsed");
    }

    // Setup trigger
    this.trigger.classList.add("disclosure-trigger");
    this.updateTrigger();

    // Add event listeners
    this.trigger.addEventListener("click", this.toggle.bind(this));

    if (this.options.expandOnHover) {
      this.trigger.addEventListener("mouseenter", this.expand.bind(this));
      this.trigger.addEventListener("mouseleave", this.collapse.bind(this));
    }

    // Keyboard accessibility
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggle();
      }
    });

    // Set ARIA attributes
    this.trigger.setAttribute("aria-expanded", this.expanded.toString());
    this.trigger.setAttribute("aria-controls", this.content.id || this.generateId());
    
    if (!this.content.id) {
      this.content.id = this.generateId();
    }
  }

  private generateId(): string {
    return `disclosure-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateTrigger() {
    const icon = this.expanded ? this.options.collapseIcon : this.options.expandIcon;
    const text = this.expanded ? this.options.collapseText : this.options.expandText;
    
    if (this.options.triggerPosition === "replace") {
      this.trigger.innerHTML = `${icon} ${text}`;
    } else if (this.options.triggerPosition === "before") {
      this.trigger.innerHTML = `${icon} ${this.originalTriggerContent}`;
    } else {
      this.trigger.innerHTML = `${this.originalTriggerContent} ${icon}`;
    }
  }

  public toggle() {
    if (this.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  public expand() {
    if (this.expanded) return;

    this.expanded = true;
    this.content.classList.remove("collapsed");
    this.content.classList.add("expanding");
    
    this.updateTrigger();
    this.trigger.setAttribute("aria-expanded", "true");

    // Animate expansion
    const contentHeight = this.content.scrollHeight;
    this.content.style.height = "0px";
    this.content.style.overflow = "hidden";

    requestAnimationFrame(() => {
      this.content.style.transition = `height ${this.options.animationDuration}ms ease-out`;
      this.content.style.height = `${contentHeight}px`;

      setTimeout(() => {
        this.content.style.height = "auto";
        this.content.style.overflow = "";
        this.content.classList.remove("expanding");
        this.content.classList.add("expanded");
      }, this.options.animationDuration!);
    });

    // Save state
    if (this.options.persistent && this.options.storageKey) {
      localStorage.setItem(this.options.storageKey, JSON.stringify(true));
    }

    this.options.onExpand?.();
  }

  public collapse() {
    if (!this.expanded) return;

    this.expanded = false;
    this.content.classList.remove("expanded");
    this.content.classList.add("collapsing");

    this.updateTrigger();
    this.trigger.setAttribute("aria-expanded", "false");

    // Animate collapse
    const contentHeight = this.content.scrollHeight;
    this.content.style.height = `${contentHeight}px`;
    this.content.style.overflow = "hidden";

    requestAnimationFrame(() => {
      this.content.style.transition = `height ${this.options.animationDuration}ms ease-in`;
      this.content.style.height = "0px";

      setTimeout(() => {
        this.content.style.height = "";
        this.content.style.overflow = "";
        this.content.classList.remove("collapsing");
        this.content.classList.add("collapsed");
      }, this.options.animationDuration!);
    });

    // Save state
    if (this.options.persistent && this.options.storageKey) {
      localStorage.setItem(this.options.storageKey, JSON.stringify(false));
    }

    this.options.onCollapse?.();
  }

  public isExpanded(): boolean {
    return this.expanded;
  }

  public destroy() {
    this.trigger.removeEventListener("click", this.toggle.bind(this));
    this.trigger.classList.remove("disclosure-trigger");
    this.content.classList.remove("disclosure-content", "collapsed", "expanded", "expanding", "collapsing");
    this.content.style.height = "";
    this.content.style.overflow = "";
    this.content.style.transition = "";
  }
}

// Utility functions for common disclosure patterns

export function createCollapsibleSection(
  title: string,
  content: HTMLElement,
  options: Partial<DisclosureOptions> = {}
): HTMLElement {
  const container = document.createElement("div");
  container.className = "collapsible-section";

  const header = document.createElement("div");
  header.className = "collapsible-header";
  header.textContent = title;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "collapsible-content";
  contentWrapper.appendChild(content);

  container.appendChild(header);
  container.appendChild(contentWrapper);

  new ProgressiveDisclosure({
    trigger: header,
    content: contentWrapper,
    expandIcon: "▶",
    collapseIcon: "▼",
    triggerPosition: "before",
    ...options
  });

  return container;
}

export function createExpandableCard(
  summary: HTMLElement,
  details: HTMLElement,
  options: Partial<DisclosureOptions> = {}
): HTMLElement {
  const card = document.createElement("div");
  card.className = "expandable-card";

  const summarySection = document.createElement("div");
  summarySection.className = "card-summary";
  summarySection.appendChild(summary);

  const detailsSection = document.createElement("div");
  detailsSection.className = "card-details";
  detailsSection.appendChild(details);

  const expandButton = document.createElement("button");
  expandButton.className = "expand-button";
  expandButton.type = "button";

  summarySection.appendChild(expandButton);
  card.appendChild(summarySection);
  card.appendChild(detailsSection);

  new ProgressiveDisclosure({
    trigger: expandButton,
    content: detailsSection,
    expandText: "View details",
    collapseText: "Hide details",
    expandIcon: "⋯",
    collapseIcon: "×",
    triggerPosition: "replace",
    ...options
  });

  return card;
}

export function createProgressiveForm(
  basicFields: HTMLElement,
  advancedFields: HTMLElement,
  options: Partial<DisclosureOptions> = {}
): HTMLElement {
  const form = document.createElement("div");
  form.className = "progressive-form";

  const basicSection = document.createElement("div");
  basicSection.className = "form-basic";
  basicSection.appendChild(basicFields);

  const advancedSection = document.createElement("div");
  advancedSection.className = "form-advanced";
  advancedSection.appendChild(advancedFields);

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "form-toggle";

  form.appendChild(basicSection);
  form.appendChild(toggleButton);
  form.appendChild(advancedSection);

  new ProgressiveDisclosure({
    trigger: toggleButton,
    content: advancedSection,
    expandText: "Advanced options",
    collapseText: "Hide advanced options",
    expandIcon: "⚙️",
    collapseIcon: "⚙️",
    persistent: true,
    storageKey: "form-advanced-expanded",
    ...options
  });

  return form;
}

export function createStepByStepGuide(
  steps: { title: string; content: HTMLElement }[],
  options: { allowMultipleOpen?: boolean } = {}
): HTMLElement {
  const guide = document.createElement("div");
  guide.className = "step-guide";

  const disclosures: ProgressiveDisclosure[] = [];

  steps.forEach((step, index) => {
    const stepElement = document.createElement("div");
    stepElement.className = "guide-step";

    const stepHeader = document.createElement("div");
    stepHeader.className = "step-header";
    stepHeader.innerHTML = `<span class="step-number">${index + 1}</span> ${step.title}`;

    const stepContent = document.createElement("div");
    stepContent.className = "step-content";
    stepContent.appendChild(step.content);

    stepElement.appendChild(stepHeader);
    stepElement.appendChild(stepContent);
    guide.appendChild(stepElement);

    const disclosure = new ProgressiveDisclosure({
      trigger: stepHeader,
      content: stepContent,
      expandIcon: "▶",
      collapseIcon: "▼",
      triggerPosition: "before",
      expanded: index === 0, // First step expanded by default
      onExpand: () => {
        if (!options.allowMultipleOpen) {
          // Close other steps
          disclosures.forEach((d, i) => {
            if (i !== index && d.isExpanded()) {
              d.collapse();
            }
          });
        }
      }
    });

    disclosures.push(disclosure);
  });

  return guide;
}