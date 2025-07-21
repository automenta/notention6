import { templates } from "../lib/templates";
import { createButton } from "./Button";
import "./TemplateSelector.css";

interface TemplateSelectorProps {
  onSelect: (template: { title: string; content: string }) => void;
  onClose: () => void;
}

export function createTemplateSelector(
  props: TemplateSelectorProps,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "template-selector-modal";

  const content = document.createElement("div");
  content.className = "template-selector-content";

  const title = document.createElement("h2");
  title.textContent = "Select a Template";
  content.appendChild(title);

  const templateList = document.createElement("ul");
  templateList.className = "template-list";

  Object.values(templates).forEach((template) => {
    const listItem = document.createElement("li");
    const button = createButton({
      label: template.title,
      onClick: () => props.onSelect(template),
      variant: "secondary",
    });
    listItem.appendChild(button);
    templateList.appendChild(listItem);
  });

  content.appendChild(templateList);

  const closeButton = createButton({
    label: "Close",
    onClick: props.onClose,
    variant: "danger",
  });
  content.appendChild(closeButton);

  container.appendChild(content);

  return container;
}
