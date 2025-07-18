// src/ui-rewrite/OntologyEditor.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import './OntologyEditor.css';
import { OntologyNode, OntologyTree } from '../../shared/types';

export function createOntologyEditor({ onSave }: { onSave: () => void }): HTMLElement {
  const { ontology, setOntology } = useAppStore.getState();
  let selectedNodeId: string | null = null;

  const container = document.createElement('div');
  container.className = 'ontology-editor-container';

  // Header
  const header = document.createElement('header');
  header.className = 'ontology-editor-header';
  const title = document.createElement('h1');
  title.textContent = 'Ontology Editor';
  header.appendChild(title);
  container.appendChild(header);

  // Editor Content
  const editorContent = document.createElement('div');
  editorContent.className = 'ontology-editor-content';

  const treeContainer = document.createElement('div');
  treeContainer.className = 'ontology-tree-container';

  const attributeEditorContainer = document.createElement('div');
  attributeEditorContainer.className = 'attribute-editor-container';

  const renderTree = (parentId?: string) => {
    const list = document.createElement('ul');
    const nodes = parentId
      ? ontology.nodes[parentId]?.children?.map(id => ontology.nodes[id]) ?? []
      : ontology.rootIds.map(id => ontology.nodes[id]);

    nodes.forEach(node => {
      if (!node) return;
      const listItem = document.createElement('li');
      const nodeLabel = document.createElement('span');
      nodeLabel.textContent = node.label;
      nodeLabel.onclick = () => {
        selectedNodeId = node.id;
        renderAttributeEditor();
      };
      listItem.appendChild(nodeLabel);

      if (node.children && node.children.length > 0) {
        listItem.appendChild(renderTree(node.id));
      }
      list.appendChild(listItem);
    });

    const addNodeButton = createButton({
      label: '+ Add Node',
      onClick: () => {
        const newNodeLabel = prompt('Enter new node label:');
        if (newNodeLabel) {
          const newNodeId = `node_${Date.now()}`;
          const newNode: OntologyNode = {
            id: newNodeId,
            label: newNodeLabel,
            children: [],
          };

          const newOntology: OntologyTree = {
            ...ontology,
            nodes: {
              ...ontology.nodes,
              [newNodeId]: newNode,
            },
          };

          if (parentId) {
            newOntology.nodes[parentId].children?.push(newNodeId);
          } else {
            newOntology.rootIds.push(newNodeId);
          }

          setOntology(newOntology);
        }
      },
      variant: 'secondary'
    });
    list.appendChild(addNodeButton);

    return list;
  };

  const renderAttributeEditor = () => {
    attributeEditorContainer.innerHTML = '';
    if (!selectedNodeId) {
      attributeEditorContainer.textContent = 'Select a node to edit its attributes.';
      return;
    }

    const node = ontology.nodes[selectedNodeId];
    if (!node) return;

    const title = document.createElement('h3');
    title.textContent = `Edit: ${node.label}`;
    attributeEditorContainer.appendChild(title);

    const form = document.createElement('form');
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const newAttributes: { [key: string]: string } = {};
      formData.forEach((value, key) => {
        newAttributes[key] = value as string;
      });

      const updatedNode: OntologyNode = {
        ...node,
        attributes: newAttributes,
      };

      const newOntology: OntologyTree = {
        ...ontology,
        nodes: {
          ...ontology.nodes,
          [selectedNodeId!]: updatedNode,
        },
      };
      setOntology(newOntology);
    };

    const attributes = node.attributes || {};
    Object.keys(attributes).forEach(key => {
      const label = document.createElement('label');
      label.textContent = key;
      const input = document.createElement('input');
      input.name = key;
      input.value = attributes[key];
      form.appendChild(label);
      form.appendChild(input);
    });

    const addAttributeButton = createButton({
      label: '+ Add Attribute',
      onClick: () => {
        const newAttributeName = prompt('Enter new attribute name:');
        if (newAttributeName) {
          const updatedNode: OntologyNode = {
            ...node,
            attributes: {
              ...attributes,
              [newAttributeName]: '',
            },
          };
          const newOntology: OntologyTree = {
            ...ontology,
            nodes: {
              ...ontology.nodes,
              [selectedNodeId!]: updatedNode,
            },
          };
          setOntology(newOntology);
        }
      },
      variant: 'secondary'
    });
    form.appendChild(addAttributeButton);

    const saveButton = createButton({
        label: 'Save Attributes',
        onClick: () => form.requestSubmit(),
        variant: 'primary'
    });
    form.appendChild(saveButton);

    attributeEditorContainer.appendChild(form);
  };

  treeContainer.appendChild(renderTree());
  editorContent.appendChild(treeContainer);
  editorContent.appendChild(attributeEditorContainer);
  container.appendChild(editorContent);

  useAppStore.subscribe((state) => {
    if (state.ontology !== ontology) {
      treeContainer.innerHTML = '';
      treeContainer.appendChild(renderTree());
      renderAttributeEditor();
    }
  });

  return container;
}
