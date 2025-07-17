// src/ui-rewrite/OntologyEditor.ts
import Sortable from 'sortablejs';

// Sample data - in a real app, this would come from a service
const sampleOntology = [
  {
    id: '1',
    label: '#AI',
    children: [
      { id: '2', label: '#MachineLearning', children: [{ id: '3', label: '#NLP', children: [] }] },
      { id: '4', label: '#ComputerVision', children: [] },
    ],
  },
  {
    id: '5',
    label: '#WebDev',
    children: [
      { id: '6', label: '#React', children: [] },
      { id: '7', label: '#CSS', children: [] },
    ],
  },
];

function renderTree(nodes: any[]): HTMLUListElement {
  const ul = document.createElement('ul');
  ul.className = 'ontology-tree';

  nodes.forEach(node => {
    const li = document.createElement('li');
    li.dataset.id = node.id;
    li.textContent = node.label;

    if (node.children && node.children.length > 0) {
      li.appendChild(renderTree(node.children));
    }
    ul.appendChild(li);
  });

  return ul;
}


export function createOntologyEditor(options: {
  onSave: (ontology: any) => void;
}): HTMLElement {
  const editor = document.createElement("div");
  editor.className = "ontology-editor";

  editor.innerHTML = `<h2>Ontology Editor</h2>`;

  const treeContainer = document.createElement('div');
  const tree = renderTree(sampleOntology);
  treeContainer.appendChild(tree);

  // Make it sortable
  new Sortable(tree, {
    group: 'nested',
    animation: 150,
    fallbackOnBody: true,
    swapThreshold: 0.65
  });

  editor.appendChild(treeContainer);

  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'ontology-button-container';

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Ontology";
  saveButton.className = "btn btn-primary";
  saveButton.addEventListener("click", () => {
    // In a real implementation, we would serialize the tree back to a JSON object
    alert("Ontology saved (not really)!");
  });

  buttonContainer.appendChild(saveButton);
  editor.appendChild(buttonContainer);

  return editor;
}
