// src/ui/PropertyEditor.ts
import { useAppStore } from '../store';
import { OntologyProperty } from '../../shared/types';
import { createButton }from './Button';

interface PropertyEditorProps {
  onSave: (property: OntologyProperty) => void;
  onClose: () => void;
  noteTags: string[];
}

export function createPropertyEditor({ onSave, onClose, noteTags }: PropertyEditorProps): HTMLElement {
  const { ontology } = useAppStore.getState();

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      onClose();
    }
  };

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalOverlay.appendChild(modalContent);

  const title = document.createElement('h2');
  title.textContent = 'Add Property';
  modalContent.appendChild(title);

  // TODO: Add logic to suggest properties based on noteTags and ontology

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.placeholder = 'Property Name';
  modalContent.appendChild(keyInput);

  const typeSelect = document.createElement('select');
  const types: OntologyProperty['type'][] = ['text', 'number', 'date', 'boolean'];
  types.forEach((type) => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    typeSelect.appendChild(option);
  });
  modalContent.appendChild(typeSelect);

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.placeholder = 'Property Value';
  modalContent.appendChild(valueInput);

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'flex justify-end space-x-2 mt-4';
  modalContent.appendChild(buttonContainer);

  const saveButton = createButton({
    label: 'Save',
    onClick: () => {
      const property: OntologyProperty = {
        name: keyInput.value,
        type: typeSelect.value as OntologyProperty['type'],
        value: valueInput.value,
      };
      onSave(property);
    },
    variant: 'primary',
  });
  buttonContainer.appendChild(saveButton);

  const closeButton = createButton({
    label: 'Close',
    onClick: onClose,
    variant: 'secondary',
  });
  buttonContainer.appendChild(closeButton);

  return modalOverlay;
}
