// src/ui/TemplateManager.ts
import { useStore } from "../store";
import { createButton } from "./Button";
import { NotentionTemplate, TemplateField } from "../../shared/types";
import "./TemplateManager.css";

export function createTemplateManager(): HTMLElement {
  const { templates, createTemplate, updateTemplate, deleteTemplate } =
    useStore.getState();

  const container = document.createElement("div");
  container.className = "template-manager";

  // Header with create button
  const header = document.createElement("div");
  header.className = "template-manager-header";

  const title = document.createElement("h2");
  title.textContent = "📝 Template Manager";
  header.appendChild(title);

  const createTemplateButton = createButton({
    label: "➕ Create Template",
    onClick: () => showTemplateEditor(),
    variant: "primary",
  });
  header.appendChild(createTemplateButton);
  container.appendChild(header);

  // Template list
  const templateList = document.createElement("div");
  templateList.className = "template-list";
  container.appendChild(templateList);

  // Render templates
  renderTemplates();

  function renderTemplates() {
    templateList.innerHTML = "";

    const templateEntries = Object.values(templates);
    if (templateEntries.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.innerHTML = `
        <div class="empty-state-content">
          <div class="empty-state-icon">📄</div>
          <h3>No Templates Yet</h3>
          <p>Create your first template to get started with structured note-taking.</p>
        </div>
      `;
      templateList.appendChild(emptyState);
      return;
    }

    templateEntries.forEach((template) => {
      const templateCard = createTemplateCard(template);
      templateList.appendChild(templateCard);
    });
  }

  function createTemplateCard(template: NotentionTemplate): HTMLElement {
    const card = document.createElement("div");
    card.className = "template-card";

    const header = document.createElement("div");
    header.className = "template-card-header";

    const title = document.createElement("h3");
    title.textContent = template.name;
    header.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "template-card-actions";

    const editButton = createButton({
      label: "✏️ Edit",
      onClick: () => showTemplateEditor(template),
      variant: "secondary",
    });

    const deleteButton = createButton({
      label: "🗑️ Delete",
      onClick: () => {
        if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
          deleteTemplate(template.id);
          renderTemplates();
        }
      },
      variant: "danger",
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    header.appendChild(actions);
    card.appendChild(header);

    if (template.description) {
      const description = document.createElement("p");
      description.className = "template-description";
      description.textContent = template.description;
      card.appendChild(description);
    }

    // Display template fields
    if (template.fields && template.fields.length > 0) {
      const fieldsContainer = document.createElement("div");
      fieldsContainer.className = "template-fields";

      const fieldsTitle = document.createElement("h4");
      fieldsTitle.textContent = "Fields:";
      fieldsContainer.appendChild(fieldsTitle);

      template.fields.forEach((field) => {
        const fieldTag = document.createElement("span");
        fieldTag.className = `field-tag field-type-${field.type}`;
        fieldTag.textContent = `${field.name} (${field.type})${field.required ? " *" : ""}`;
        fieldsContainer.appendChild(fieldTag);
      });

      card.appendChild(fieldsContainer);
    }

    // Display default tags
    if (template.defaultTags && template.defaultTags.length > 0) {
      const tagsContainer = document.createElement("div");
      tagsContainer.className = "template-tags";

      const tagsTitle = document.createElement("h4");
      tagsTitle.textContent = "Default Tags:";
      tagsContainer.appendChild(tagsTitle);

      template.defaultTags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "tag";
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
      });

      card.appendChild(tagsContainer);
    }

    return card;
  }

  function showTemplateEditor(template?: NotentionTemplate) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content template-editor-modal";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";

    const modalTitle = document.createElement("h2");
    modalTitle.textContent = template ? "Edit Template" : "Create New Template";
    modalHeader.appendChild(modalTitle);

    const closeButton = document.createElement("button");
    closeButton.textContent = "✕";
    closeButton.className = "close-button";
    closeButton.onclick = () => modal.remove();
    modalHeader.appendChild(closeButton);
    modalContent.appendChild(modalHeader);

    const form = document.createElement("form");
    form.className = "template-form";

    // Template name
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Template Name *";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.required = true;
    nameInput.value = template?.name || "";
    nameLabel.appendChild(nameInput);
    form.appendChild(nameLabel);

    // Template description
    const descLabel = document.createElement("label");
    descLabel.textContent = "Description";
    const descInput = document.createElement("textarea");
    descInput.rows = 3;
    descInput.value = template?.description || "";
    descLabel.appendChild(descInput);
    form.appendChild(descLabel);

    // Fields section
    const fieldsSection = document.createElement("div");
    fieldsSection.className = "fields-section";

    const fieldsTitle = document.createElement("h3");
    fieldsTitle.textContent = "Fields";
    fieldsSection.appendChild(fieldsTitle);

    const addFieldButton = createButton({
      label: "➕ Add Field",
      onClick: () => addFieldEditor(),
      variant: "secondary",
    });
    fieldsSection.appendChild(addFieldButton);

    const fieldsContainer = document.createElement("div");
    fieldsContainer.className = "fields-container";
    fieldsSection.appendChild(fieldsContainer);
    form.appendChild(fieldsSection);

    // Load existing fields
    let fieldEditors: FieldEditor[] = [];
    if (template?.fields) {
      template.fields.forEach((field) => {
        const editor = addFieldEditor(field);
        fieldEditors.push(editor);
      });
    }

    function addFieldEditor(field?: TemplateField): FieldEditor {
      const fieldEditor = createFieldEditor(field, () => {
        const index = fieldEditors.indexOf(fieldEditor);
        if (index > -1) {
          fieldEditors.splice(index, 1);
          fieldEditor.element.remove();
        }
      });

      fieldEditors.push(fieldEditor);
      fieldsContainer.appendChild(fieldEditor.element);
      return fieldEditor;
    }

    // Default tags
    const tagsLabel = document.createElement("label");
    tagsLabel.textContent = "Default Tags (comma-separated)";
    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.placeholder = "#tag1, #tag2, #tag3";
    tagsInput.value = template?.defaultTags?.join(", ") || "";
    tagsLabel.appendChild(tagsInput);
    form.appendChild(tagsLabel);

    // Default values
    const valuesLabel = document.createElement("label");
    valuesLabel.textContent = "Default Values (JSON format)";
    const valuesInput = document.createElement("textarea");
    valuesInput.rows = 3;
    valuesInput.placeholder = '{"status": "draft", "priority": "medium"}';
    valuesInput.value = template?.defaultValues
      ? JSON.stringify(template.defaultValues, null, 2)
      : "";
    valuesLabel.appendChild(valuesInput);
    form.appendChild(valuesLabel);

    // Form actions
    const formActions = document.createElement("div");
    formActions.className = "form-actions";

    const cancelButton = createButton({
      label: "Cancel",
      onClick: () => modal.remove(),
      variant: "secondary",
    });

    const saveButton = createButton({
      label: template ? "Update Template" : "Create Template",
      onClick: () => saveTemplate(),
      variant: "primary",
    });

    formActions.appendChild(cancelButton);
    formActions.appendChild(saveButton);
    form.appendChild(formActions);

    async function saveTemplate() {
      const name = nameInput.value.trim();
      if (!name) {
        alert("Template name is required");
        return;
      }

      const fields = fieldEditors
        .map((editor) => editor.getField())
        .filter(Boolean);

      const defaultTags = tagsInput.value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

      let defaultValues = {};
      if (valuesInput.value.trim()) {
        try {
          defaultValues = JSON.parse(valuesInput.value);
        } catch (e) {
          alert("Invalid JSON in default values");
          return;
        }
      }

      const templateData = {
        name,
        description: descInput.value.trim(),
        fields,
        defaultTags,
        defaultValues,
      };

      try {
        if (template) {
          await updateTemplate(template.id, templateData);
        } else {
          await createTemplate(templateData);
        }

        renderTemplates();
        modal.remove();
      } catch (error) {
        console.error("Error saving template:", error);
        alert("Error saving template. Please try again.");
      }
    }

    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Focus the name input
    nameInput.focus();
  }

  return container;
}

interface FieldEditor {
  element: HTMLElement;
  getField(): TemplateField | null;
}

function createFieldEditor(
  field?: TemplateField,
  onRemove?: () => void,
): FieldEditor {
  const container = document.createElement("div");
  container.className = "field-editor";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Field name";
  nameInput.value = field?.name || "";

  const typeSelect = document.createElement("select");
  const types = ["text", "number", "date", "select", "checkbox"];
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    option.selected = field?.type === type;
    typeSelect.appendChild(option);
  });

  const requiredCheckbox = document.createElement("input");
  requiredCheckbox.type = "checkbox";
  requiredCheckbox.checked = field?.required || false;

  const requiredLabel = document.createElement("label");
  requiredLabel.textContent = "Required";
  requiredLabel.appendChild(requiredCheckbox);

  const optionsInput = document.createElement("input");
  optionsInput.type = "text";
  optionsInput.placeholder = "Options (comma-separated, for select type)";
  optionsInput.value = field?.options?.join(", ") || "";
  optionsInput.style.display = field?.type === "select" ? "block" : "none";

  typeSelect.onchange = () => {
    optionsInput.style.display =
      typeSelect.value === "select" ? "block" : "none";
  };

  const removeButton = createButton({
    label: "🗑️",
    onClick: () => onRemove?.(),
    variant: "danger",
  });

  container.appendChild(nameInput);
  container.appendChild(typeSelect);
  container.appendChild(requiredLabel);
  container.appendChild(optionsInput);
  container.appendChild(removeButton);

  return {
    element: container,
    getField(): TemplateField | null {
      const name = nameInput.value.trim();
      if (!name) return null;

      const templateField: TemplateField = {
        name,
        type: typeSelect.value as TemplateField["type"],
        required: requiredCheckbox.checked,
      };

      if (typeSelect.value === "select" && optionsInput.value.trim()) {
        templateField.options = optionsInput.value
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt.length > 0);
      }

      return templateField;
    },
  };
}
