// src/ui-rewrite/OntologyEditor.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./OntologyEditor.css";
import { OntologyNode, OntologyTree } from "../../shared/types";
import Sortable from "sortablejs";

export function createOntologyEditor({
  onSave,
}: {
  onSave: () => void;
}): HTMLElement {
  const { ontology, setOntology } = useAppStore.getState();
  let selectedNodeId: string | null = null;

  const container = document.createElement("div");
  container.className = "ontology-editor-container";

  // Header
  const header = document.createElement("header");
  header.className = "ontology-editor-header";
  const title = document.createElement("h1");
  title.textContent = "Ontology Editor";
  header.appendChild(title);

  const shareButton = createButton({
    label: "Share Ontology",
    onClick: async () => {
        const { nostrService, addNotification } = useAppStore.getState();
        if (nostrService) {
            try {
                await nostrService.publishOntology(ontology);
                addNotification({
                    id: `ontology-share-success-${Date.now()}`,
                    type: "success",
                    message: "Ontology shared successfully!",
                    timestamp: new Date(),
                    timeout: 3000,
                });
            } catch (error) {
                console.error("Failed to share ontology:", error);
                addNotification({
                    id: `ontology-share-error-${Date.now()}`,
                    type: "error",
                    message: "Failed to share ontology.",
                    timestamp: new Date(),
                    timeout: 5000,
                });
            }
        }
    },
    variant: "primary",
    });
    header.appendChild(shareButton);

    const aiSuggestButton = createButton({
        label: "AI Suggest",
        onClick: async () => {
            const { aiService, ontology, addNotification, setOntology } = useAppStore.getState();
            if (aiService && aiService.isAIEnabled()) {
                try {
                    addNotification({
                        id: `ontology-suggest-info-${Date.now()}`,
                        type: "info",
                        message: "Getting AI suggestions for ontology...",
                        timestamp: new Date(),
                    });
                    const suggestions = await aiService.getOntologySuggestions(ontology);
                    if (suggestions && suggestions.length > 0) {
                        const newOntology = { ...ontology };
                        suggestions.forEach(suggestion => {
                            const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                            const newNode: OntologyNode = {
                                id: newNodeId,
                                label: suggestion.label,
                                children: [],
                                attributes: suggestion.attributes,
                            };
                            newOntology.nodes[newNodeId] = newNode;
                            if (suggestion.parentId && newOntology.nodes[suggestion.parentId]) {
                                if (!newOntology.nodes[suggestion.parentId].children) {
                                    newOntology.nodes[suggestion.parentId].children = [];
                                }
                                newOntology.nodes[suggestion.parentId].children!.push(newNodeId);
                            } else {
                                newOntology.rootIds.push(newNodeId);
                            }
                        });
                        setOntology(newOntology);
                        addNotification({
                            id: `ontology-suggest-success-${Date.now()}`,
                            type: "success",
                            message: `Added ${suggestions.length} new ontology suggestions.`,
                            timestamp: new Date(),
                            timeout: 3000,
                        });
                    } else {
                        addNotification({
                            id: `ontology-suggest-none-${Date.now()}`,
                            type: "info",
                            message: "No new suggestions found.",
                            timestamp: new Date(),
                            timeout: 3000,
                        });
                    }
                } catch (error) {
                    console.error("Failed to get AI ontology suggestions:", error);
                    addNotification({
                        id: `ontology-suggest-error-${Date.now()}`,
                        type: "error",
                        message: "Failed to get AI suggestions.",
                        timestamp: new Date(),
                        timeout: 5000,
                    });
                }
            } else {
                addNotification({
                    id: `ontology-suggest-disabled-${Date.now()}`,
                    type: "info",
                    message: "AI features are not enabled in settings.",
                    timestamp: new Date(),
                    timeout: 5000,
                });
            }
        },
        variant: "secondary",
    });
    header.appendChild(aiSuggestButton);

  container.appendChild(header);

  // Editor Content
  const editorContent = document.createElement("div");
  editorContent.className = "ontology-editor-content";

  const treeContainer = document.createElement("div");
  treeContainer.className = "ontology-tree-container";

  const attributeEditorContainer = document.createElement("div");
  attributeEditorContainer.className = "attribute-editor-container";

  const renderTree = (parentId?: string) => {
    const list = document.createElement("ul");
    list.dataset.parentId = parentId || "root";

    const nodes = parentId
      ? (ontology.nodes[parentId]?.children?.map((id) => ontology.nodes[id]) ??
        [])
      : ontology.rootIds.map((id) => ontology.nodes[id]);

    nodes.forEach((node) => {
      if (!node) return;
      const listItem = document.createElement("li");
      listItem.dataset.nodeId = node.id;
      const nodeLabel = document.createElement("span");
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
      label: "+ Add Node",
      onClick: () => {
        const newNodeLabel = prompt("Enter new node label:");
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
      variant: "secondary",
    });
    list.appendChild(addNodeButton);

    new Sortable(list, {
        group: "ontology",
        animation: 150,
        onEnd: (evt) => {
            const itemEl = evt.item;
            const toListEl = evt.to;
            const fromListEl = evt.from;

            const nodeId = itemEl.dataset.nodeId;
            const newParentId = toListEl.dataset.parentId;
            const oldParentId = fromListEl.dataset.parentId;

            if (!nodeId) return;

            const newOntology = { ...ontology };

            // Remove from old parent
            if (oldParentId === "root") {
                newOntology.rootIds = newOntology.rootIds.filter(id => id !== nodeId);
            } else {
                const oldParentNode = newOntology.nodes[oldParentId!];
                if (oldParentNode) {
                    oldParentNode.children = oldParentNode.children?.filter(id => id !== nodeId);
                }
            }

            // Add to new parent
            if (newParentId === "root") {
                newOntology.rootIds.splice(evt.newIndex!, 0, nodeId);
            } else {
                const newParentNode = newOntology.nodes[newParentId!];
                if (newParentNode) {
                    if (!newParentNode.children) {
                        newParentNode.children = [];
                    }
                    newParentNode.children.splice(evt.newIndex!, 0, nodeId);
                }
            }

            setOntology(newOntology);
        },
    });

    return list;
  };

  const renderAttributeEditor = () => {
    attributeEditorContainer.innerHTML = "";
    if (!selectedNodeId) {
      attributeEditorContainer.textContent =
        "Select a node to edit its attributes.";
      return;
    }

    const node = ontology.nodes[selectedNodeId];
    if (!node) return;

    const title = document.createElement("h3");
    title.textContent = `Edit: ${node.label}`;
    attributeEditorContainer.appendChild(title);

    const form = document.createElement("form");
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
    Object.keys(attributes).forEach((key) => {
      const label = document.createElement("label");
      label.textContent = key;
      const input = document.createElement("input");
      input.name = key;
      input.value = attributes[key];
      form.appendChild(label);
      form.appendChild(input);
    });

    const addAttributeButton = createButton({
      label: "+ Add Attribute",
      onClick: () => {
        const newAttributeName = prompt("Enter new attribute name:");
        if (newAttributeName) {
          const updatedNode: OntologyNode = {
            ...node,
            attributes: {
              ...attributes,
              [newAttributeName]: "",
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
      variant: "secondary",
    });
    form.appendChild(addAttributeButton);

    const saveButton = createButton({
      label: "Save Attributes",
      onClick: () => form.requestSubmit(),
      variant: "primary",
    });
    form.appendChild(saveButton);

    attributeEditorContainer.appendChild(form);
  };

  treeContainer.appendChild(renderTree());
  editorContent.appendChild(treeContainer);
  editorContent.appendChild(attributeEditorContainer);
  container.appendChild(editorContent);

  // Note: In a real implementation, we'd want to set up proper reactivity
  // For now, the components will be re-rendered when the main app state changes

  return container;
}
