// src/ui-rewrite/OntologyEditor.ts
import Sortable from 'sortablejs';
import { useAppStore } from '../store';
import { OntologyNode } from '../../shared/types';
import { OntologyService } from '../services/ontology';

function renderTree(nodes: OntologyNode[], allNodes: { [key: string]: OntologyNode }): HTMLUListElement {
  const { ontology, setOntology } = useAppStore.getState();
  const ul = document.createElement('ul');
  ul.className = 'ontology-tree';

  nodes.forEach(node => {
    const li = document.createElement('li');
    li.dataset.id = node.id;
    li.textContent = node.label;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.className = 'btn-delete-node';
    deleteButton.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${node.label}?`)) {
            const updatedOntology = OntologyService.removeNode(ontology, node.id);
            setOntology(updatedOntology);
        }
    };
    li.appendChild(deleteButton);

    if (node.children && node.children.length > 0) {
      const children = node.children.map(childId => allNodes[childId]).filter(Boolean);
      li.appendChild(renderTree(children, allNodes));
    }
    ul.appendChild(li);
  });

  return ul;
}


export function createOntologyEditor(options: {
  onSave: (ontology: any) => void;
}): HTMLElement {
  const { ontology, setOntology } = useAppStore.getState();

  const editor = document.createElement("div");
  editor.className = "ontology-editor";

  editor.innerHTML = `<h2>Ontology Editor</h2>`;

  const treeContainer = document.createElement('div');
  const rootNodes = ontology.rootIds.map(id => ontology.nodes[id]).filter(Boolean);
  const tree = renderTree(rootNodes, ontology.nodes);
  treeContainer.appendChild(tree);

  // Make it sortable
  new Sortable(tree, {
    group: 'nested',
    animation: 150,
    fallbackOnBody: true,
    swapThreshold: 0.65,
    onEnd: (evt) => {
        const { item, to, from, newIndex, oldIndex } = evt;
        const nodeId = item.dataset.id;
        if (!nodeId) return;

        const newParentEl = to.closest('li');
        const newParentId = newParentEl ? newParentEl.dataset.id : undefined;

        const updatedOntology = OntologyService.moveNode(ontology, nodeId, newParentId, newIndex);
        setOntology(updatedOntology);
    }
  });

  editor.appendChild(treeContainer);

  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'ontology-button-container';

  const newNodeInput = document.createElement('input');
  newNodeInput.type = 'text';
  newNodeInput.placeholder = 'New node label';
  buttonContainer.appendChild(newNodeInput);

  const addNodeButton = document.createElement('button');
  addNodeButton.textContent = 'Add Node';
  addNodeButton.className = 'btn btn-secondary';
  addNodeButton.addEventListener('click', () => {
    const label = newNodeInput.value.trim();
    if (label) {
      const newNode = OntologyService.createNode(label);
      const updatedOntology = OntologyService.addNode(ontology, newNode);
      setOntology(updatedOntology);
      newNodeInput.value = '';
    }
  });
  buttonContainer.appendChild(addNodeButton);

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Ontology";
  saveButton.className = "btn btn-primary";
  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    try {
        await options.onSave(ontology);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Ontology';
    }
  });

  buttonContainer.appendChild(saveButton);
  editor.appendChild(buttonContainer);

  return editor;
}
