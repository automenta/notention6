// src/ui-rewrite/OntologyEditor.ts
import Sortable from 'sortablejs';
import { useAppStore } from '../store';
import { OntologyNode } from '../../shared/types';
import { OntologyService } from '../services/ontology';

function renderTree(ontology: any): HTMLUListElement {
  const { setOntology } = useAppStore.getState();
  const allNodes = ontology.nodes;
  const rootIds = ontology.rootIds;

  const ul = document.createElement('ul');
  ul.className = 'ontology-tree';

  const createNodeElement = (node: OntologyNode) => {
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

      return li;
  };

  const nodeMap = new Map<string, HTMLLIElement>();
  const rootElements: HTMLLIElement[] = [];

  // Create all node elements and store them in a map
  for (const nodeId in allNodes) {
    const node = allNodes[nodeId];
    const element = createNodeElement(node);
    nodeMap.set(node.id, element);
  }

  // Append children to their parents
  for (const nodeId in allNodes) {
    const node = allNodes[nodeId];
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parentEl = nodeMap.get(node.parentId);
      let childrenUl = parentEl?.querySelector('ul');
      if (!childrenUl) {
          childrenUl = document.createElement('ul');
          parentEl?.appendChild(childrenUl);
      }
      childrenUl.appendChild(nodeMap.get(nodeId)!);
    }
  }

  // Append root nodes to the main list
  rootIds.forEach((rootId: string) => {
      if (nodeMap.has(rootId)) {
          ul.appendChild(nodeMap.get(rootId)!);
      }
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

  const layout = document.createElement('div');
  layout.className = 'ontology-editor-layout';

  const treeContainer = document.createElement('div');
  treeContainer.className = 'ontology-tree-container';

  const editContainer = document.createElement('div');
  editContainer.className = 'ontology-edit-container';
  let selectedNodeId: string | null = null;

  const renderEditor = () => {
    const tree = renderTree(ontology);
    treeContainer.innerHTML = '';
    treeContainer.appendChild(tree);

    // Add click listeners to select a node
    tree.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedNodeId = li.dataset.id || null;
        renderEditForm();
      });
    });

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
  };

  const renderEditForm = () => {
    editContainer.innerHTML = '';
    if (!selectedNodeId) {
      editContainer.innerHTML = '<p>Select a node to edit.</p>';
      return;
    }

    const node = ontology.nodes[selectedNodeId];
    if (!node) return;

    const form = document.createElement('form');
    form.innerHTML = `
      <h4>Edit Node: ${node.label}</h4>
      <label for="node-label">Label:</label>
      <input type="text" id="node-label" value="${node.label}">
    `;
    // Add fields for attributes later

    const updateButton = document.createElement('button');
    updateButton.textContent = 'Update';
    updateButton.type = 'submit';
    form.appendChild(updateButton);

    form.onsubmit = (e) => {
      e.preventDefault();
      const newLabel = (form.querySelector('#node-label') as HTMLInputElement).value;
      const updatedNode = { ...node, label: newLabel };
      const updatedOntology = {
        ...ontology,
        nodes: { ...ontology.nodes, [node.id]: updatedNode }
      };
      setOntology(updatedOntology);
      renderEditor(); // Re-render the tree to show the new label
    };

    editContainer.appendChild(form);
  };

  layout.appendChild(treeContainer);
  layout.appendChild(editContainer);
  editor.appendChild(layout);

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

  // Initial render
  renderEditor();
  renderEditForm();

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
