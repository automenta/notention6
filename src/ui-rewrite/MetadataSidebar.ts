// src/ui-rewrite/MetadataSidebar.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./MetadataSidebar.css";

export function createMetadataSidebar(): HTMLElement {
  const { currentNoteId, notes, updateNote } = useAppStore.getState();
  const note = currentNoteId ? notes[currentNoteId] : null;

  const sidebar = document.createElement("div");
  sidebar.className = "metadata-sidebar";

  if (!note) {
    return sidebar;
  }

  // Helper function to update a value
  const handleValueChange = (oldKey: string, newKey: string, value: string) => {
    const newValues = { ...note.values };
    if (oldKey !== newKey) {
      delete newValues[oldKey];
    }
    newValues[newKey] = value;
    updateNote(note.id, { values: newValues });
  };

  // Helper function to delete a value
  const handleValueDelete = (key: string) => {
    const newValues = { ...note.values };
    delete newValues[key];
    updateNote(note.id, { values: newValues });
  };

  // Values Section
  const valuesSection = document.createElement("div");
  valuesSection.className = "metadata-section";
  const valuesTitle = document.createElement("h3");
  valuesTitle.textContent = "Values";
  valuesSection.appendChild(valuesTitle);

  const valuesContainer = document.createElement("div");
  valuesContainer.className = "metadata-items";
  valuesSection.appendChild(valuesContainer);

  const renderValues = () => {
    valuesContainer.innerHTML = "";
    for (const key in note.values) {
      const item = document.createElement("div");
      item.className = "metadata-item";

      const keyInput = document.createElement("input");
      keyInput.type = "text";
      keyInput.value = key;
      keyInput.className = "key-input";
      keyInput.onchange = (e) =>
        handleValueChange(
          key,
          (e.target as HTMLInputElement).value,
          note.values[key],
        );

      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.value = note.values[key];
      valueInput.className = "value-input";
      valueInput.onchange = (e) =>
        handleValueChange(key, key, (e.target as HTMLInputElement).value);

      const deleteButton = createButton({
        label: "x",
        onClick: () => handleValueDelete(key),
        variant: "danger",
      });

      item.appendChild(keyInput);
      item.appendChild(valueInput);
      item.appendChild(deleteButton);
      valuesContainer.appendChild(item);
    }
  };

  renderValues();

  const addValueButton = createButton({
    label: "Add Value",
    onClick: () => {
      const newKey = `newKey${Object.keys(note.values).length}`;
      handleValueChange(newKey, newKey, "");
    },
    variant: "secondary",
  });
  valuesSection.appendChild(addValueButton);

  // Fields Section
  const fieldsSection = document.createElement("div");
  fieldsSection.className = "metadata-section";
  const fieldsTitle = document.createElement("h3");
  fieldsTitle.textContent = "Fields";
  fieldsSection.appendChild(fieldsTitle);

  const fieldsContainer = document.createElement("div");
  fieldsContainer.className = "metadata-items";
  fieldsSection.appendChild(fieldsContainer);

  const renderFields = () => {
    fieldsContainer.innerHTML = "";
    for (const key in note.fields) {
      const item = document.createElement("div");
      item.className = "metadata-item";

      const label = document.createElement("label");
      label.textContent = key;

      const input = document.createElement("input");
      input.type = "text";
      input.value = note.fields[key];
      input.onchange = (e) => {
        const newFields = {
          ...note.fields,
          [key]: (e.target as HTMLInputElement).value,
        };
        updateNote(note.id, { fields: newFields });
      };

      item.appendChild(label);
      item.appendChild(input);
      fieldsContainer.appendChild(item);
    }
  };

  renderFields();

  sidebar.appendChild(valuesSection);
  sidebar.appendChild(fieldsSection);

  return sidebar;
}
