// src/ui/OntologyModuleManager.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import {
  OntologyModuleManager,
  builtInOntologies,
  OntologyModule,
} from "../lib/ontologies";
import { OntologyService } from "../services/ontology";
import "./OntologyModuleManager.css";

export function createOntologyModuleManager(): HTMLElement {
  const { updateOntology, ontology } = useAppStore.getState();

  const container = document.createElement("div");
  container.className = "ontology-module-manager";

  // Header
  const header = document.createElement("div");
  header.className = "module-manager-header";

  const title = document.createElement("h2");
  title.textContent = "🌳 Built-in Ontologies";
  header.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.textContent =
    "Enhance your note-taking with comprehensive, pre-built ontologies for various domains. Enable the modules you need.";
  subtitle.className = "module-manager-subtitle";
  header.appendChild(subtitle);

  container.appendChild(header);

  // Stats summary
  const createStatsSummary = () => {
    const stats = document.createElement("div");
    stats.className = "modules-stats";

    const totalModules = OntologyModuleManager.getAllModules().length;
    const enabledModules = OntologyModuleManager.getEnabledModules().length;
    const totalNodes =
      enabledModules > 0
        ? Object.keys(OntologyModuleManager.generateMergedOntology().nodes)
            .length
        : 0;

    stats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${totalModules}</span>
                <span class="stat-label">Available Modules</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${enabledModules}</span>
                <span class="stat-label">Enabled</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalNodes}</span>
                <span class="stat-label">Total Concepts</span>
            </div>
        `;

    return stats;
  };

  // Category filter
  const createCategoryFilter = (
    onCategoryChange: (category: string | null) => void,
  ) => {
    const filterContainer = document.createElement("div");
    filterContainer.className = "category-filter";

    const allButton = createButton({
      label: "All",
      onClick: () => onCategoryChange(null),
      variant: "secondary",
    });
    allButton.classList.add("category-button", "active");
    filterContainer.appendChild(allButton);

    const categories = OntologyModuleManager.getCategories();
    const categoryButtons: HTMLElement[] = [allButton];

    categories.forEach((category) => {
      const button = createButton({
        label: category,
        onClick: () => {
          // Update active state
          categoryButtons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");
          onCategoryChange(category);
        },
        variant: "secondary",
      });
      button.classList.add("category-button");
      categoryButtons.push(button);
      filterContainer.appendChild(button);
    });

    // Store buttons for active state management
    (filterContainer as any).categoryButtons = categoryButtons;

    return filterContainer;
  };

  // Module card
  const createModuleCard = (module: OntologyModule) => {
    const card = document.createElement("div");
    card.className = `module-card ${module.enabled ? "enabled" : "disabled"}`;

    const header = document.createElement("div");
    header.className = "module-card-header";

    const titleRow = document.createElement("div");
    titleRow.className = "module-title-row";

    const icon = document.createElement("span");
    icon.className = "module-icon";
    icon.textContent = module.icon;
    titleRow.appendChild(icon);

    const title = document.createElement("h3");
    title.className = "module-title";
    title.textContent = module.name;
    titleRow.appendChild(title);

    const toggle = document.createElement("label");
    toggle.className = "module-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = module.enabled;
    checkbox.onchange = () => {
      OntologyModuleManager.toggleModule(module.id, checkbox.checked);
      card.className = `module-card ${checkbox.checked ? "enabled" : "disabled"}`;

      // Update the main ontology
      if (checkbox.checked) {
        // Merge the module into current ontology
        const moduleOntology = OntologyModuleManager.getModuleAsOntologyTree(
          module.id,
        );
        if (moduleOntology) {
          let mergedOntology = ontology;
          Object.entries(moduleOntology.nodes).forEach(([nodeId, node]) => {
            mergedOntology = OntologyService.addNode(mergedOntology, node);
          });
          updateOntology(mergedOntology);
        }
      } else {
        // Remove module nodes from ontology
        let updatedOntology = ontology;
        Object.keys(module.nodes).forEach((nodeId) => {
          updatedOntology = OntologyService.removeNode(updatedOntology, nodeId);
        });
        updateOntology(updatedOntology);
      }

      // Update stats
      const statsContainer = container.querySelector(".modules-stats");
      if (statsContainer) {
        const newStats = createStatsSummary();
        statsContainer.replaceWith(newStats);
      }
    };

    const slider = document.createElement("span");
    slider.className = "toggle-slider";

    toggle.appendChild(checkbox);
    toggle.appendChild(slider);
    titleRow.appendChild(toggle);

    header.appendChild(titleRow);

    const description = document.createElement("p");
    description.className = "module-description";
    description.textContent = module.description;
    header.appendChild(description);

    card.appendChild(header);

    // Module stats
    const stats = OntologyModuleManager.getModuleStats(module.id);
    if (stats) {
      const statsRow = document.createElement("div");
      statsRow.className = "module-stats";

      statsRow.innerHTML = `
                <span class="stat">${stats.nodeCount} concepts</span>
                <span class="stat">${stats.depth} levels deep</span>
                <span class="stat">${stats.categories} root categories</span>
            `;

      card.appendChild(statsRow);
    }

    // Preview button
    const previewButton = createButton({
      label: "👁️ Preview Structure",
      onClick: () => {
        const existingPreview = card.querySelector(".module-preview");
        if (existingPreview) {
          existingPreview.remove();
          return;
        }

        const preview = createModulePreview(module);
        card.appendChild(preview);
      },
      variant: "secondary",
    });
    previewButton.className = "preview-button";
    card.appendChild(previewButton);

    return card;
  };

  // Module preview
  const createModulePreview = (module: OntologyModule) => {
    const preview = document.createElement("div");
    preview.className = "module-preview";

    const previewHeader = document.createElement("div");
    previewHeader.className = "preview-header";

    const previewTitle = document.createElement("h4");
    previewTitle.textContent = "Structure Preview";
    previewHeader.appendChild(previewTitle);

    const closeButton = createButton({
      label: "✕",
      onClick: () => preview.remove(),
      variant: "secondary",
    });
    closeButton.className = "close-preview";
    previewHeader.appendChild(closeButton);

    preview.appendChild(previewHeader);

    const tree = document.createElement("div");
    tree.className = "preview-tree";

    // Render tree structure
    const renderNode = (nodeId: string, level: number = 0): HTMLElement => {
      const node = module.nodes[nodeId];
      if (!node) return document.createElement("div");

      const nodeElement = document.createElement("div");
      nodeElement.className = "preview-node";
      nodeElement.style.marginLeft = `${level * 20}px`;

      const label = document.createElement("span");
      label.className = "node-label";
      label.textContent = node.label;
      nodeElement.appendChild(label);

      if (node.attributes && Object.keys(node.attributes).length > 0) {
        const attrs = document.createElement("span");
        attrs.className = "node-attributes";
        attrs.textContent = ` (${Object.keys(node.attributes).join(", ")})`;
        nodeElement.appendChild(attrs);
      }

      tree.appendChild(nodeElement);

      // Recursively render children
      if (node.children && node.children.length > 0) {
        node.children.forEach((childId) => {
          const childElement = renderNode(childId, level + 1);
          tree.appendChild(childElement);
        });
      }

      return nodeElement;
    };

    module.rootIds.forEach((rootId) => {
      renderNode(rootId);
    });

    preview.appendChild(tree);
    return preview;
  };

  // Create modules grid
  const createModulesGrid = (category: string | null = null) => {
    const grid = document.createElement("div");
    grid.className = "modules-grid";

    const modules = category
      ? OntologyModuleManager.getModulesByCategory(category)
      : OntologyModuleManager.getAllModules();

    modules.forEach((module) => {
      const card = createModuleCard(module);
      grid.appendChild(card);
    });

    return grid;
  };

  // Actions bar
  const actionsBar = document.createElement("div");
  actionsBar.className = "actions-bar";

  const enableAllButton = createButton({
    label: "Enable All",
    onClick: () => {
      Object.keys(builtInOntologies).forEach((moduleId) => {
        OntologyModuleManager.toggleModule(moduleId, true);
      });

      // Merge all modules into ontology
      const mergedOntology = OntologyModuleManager.generateMergedOntology();
      updateOntology(mergedOntology);

      // Refresh the view
      renderContent();
    },
    variant: "primary",
  });

  const disableAllButton = createButton({
    label: "Disable All",
    onClick: () => {
      Object.keys(builtInOntologies).forEach((moduleId) => {
        OntologyModuleManager.toggleModule(moduleId, false);
      });

      // Keep only user-created nodes (those not in any built-in module)
      const builtInNodeIds = new Set();
      Object.values(builtInOntologies).forEach((module) => {
        Object.keys(module.nodes).forEach((nodeId) =>
          builtInNodeIds.add(nodeId),
        );
      });

      const userNodes: { [id: string]: any } = {};
      const userRootIds: string[] = [];

      Object.entries(ontology.nodes).forEach(([nodeId, node]) => {
        if (!builtInNodeIds.has(nodeId)) {
          userNodes[nodeId] = node;
          if (!node.parentId || !ontology.nodes[node.parentId]) {
            userRootIds.push(nodeId);
          }
        }
      });

      updateOntology({
        nodes: userNodes,
        rootIds: userRootIds,
        updatedAt: new Date(),
      });

      // Refresh the view
      renderContent();
    },
    variant: "secondary",
  });

  actionsBar.appendChild(enableAllButton);
  actionsBar.appendChild(disableAllButton);

  // Main content area
  const contentArea = document.createElement("div");
  contentArea.className = "module-content-area";

  const renderContent = () => {
    // Clear existing content
    contentArea.innerHTML = "";

    // Add stats
    const stats = createStatsSummary();
    contentArea.appendChild(stats);

    // Add category filter
    const categoryFilter = createCategoryFilter((category) => {
      const grid = contentArea.querySelector(".modules-grid");
      if (grid) {
        const newGrid = createModulesGrid(category);
        grid.replaceWith(newGrid);
      }
    });
    contentArea.appendChild(categoryFilter);

    // Add modules grid
    const grid = createModulesGrid();
    contentArea.appendChild(grid);
  };

  renderContent();

  container.appendChild(actionsBar);
  container.appendChild(contentArea);

  return container;
}

// Helper function for creating the standalone ontology module manager
export function createOntologyModuleManagerModal(): HTMLElement {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content large";

  const closeButton = createButton({
    label: "✕",
    onClick: () => modal.remove(),
    variant: "secondary",
  });
  closeButton.className = "modal-close";
  modalContent.appendChild(closeButton);

  const manager = createOntologyModuleManager();
  modalContent.appendChild(manager);

  modal.appendChild(modalContent);

  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };

  return modal;
}
