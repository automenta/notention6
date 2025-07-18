// src/ui-rewrite/TagModal.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import './TagModal.css';

interface TagModalProps {
  onSelect: (tag: string) => void;
  onClose: () => void;
}

export function createTagModal({ onSelect, onClose }: TagModalProps): HTMLElement {
  const { ontology } = useAppStore.getState();
  const concepts = Object.values(ontology);

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      onClose();
    }
  };

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  const title = document.createElement('h2');
  title.textContent = 'Select a Tag';
  modalContent.appendChild(title);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type to search...';
  modalContent.appendChild(input);

  const suggestions = document.createElement('ul');
  suggestions.className = 'tag-suggestions';
  modalContent.appendChild(suggestions);

  const renderSuggestions = (filter: string) => {
    suggestions.innerHTML = '';
    const filteredConcepts = concepts.filter(c => c.label.toLowerCase().includes(filter.toLowerCase()));
    filteredConcepts.forEach(concept => {
      const li = document.createElement('li');
      li.textContent = concept.label;
      li.onclick = () => {
        onSelect(concept.label);
      };
      suggestions.appendChild(li);
    });
  };

  input.oninput = () => {
    renderSuggestions(input.value);
  };

  renderSuggestions('');

  const closeButton = createButton({
    label: 'Close',
    onClick: onClose,
    variant: 'secondary'
  });
  modalContent.appendChild(closeButton);

  modalOverlay.appendChild(modalContent);

  return modalOverlay;
}
