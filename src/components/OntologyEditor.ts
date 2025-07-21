
import { useAppStore } from '../store';
import { createButton } from '../ui/Button';
import '../ui/OntologyEditor.css';
import { OntologyNode } from '../../shared/types';
import Sortable from 'sortablejs';

class OntologyEditor extends HTMLElement {
    private selectedNodeId: string | null = null;
    private treeContainer: HTMLDivElement;
    private propertyEditorContainer: HTMLDivElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.treeContainer = document.createElement('div');
        this.propertyEditorContainer = document.createElement('div');
        useAppStore.subscribe((state, prevState) => {
            if (state.ontology !== prevState.ontology) {
                this.updateView();
            }
        });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'src/ui/OntologyEditor.css');

        const container = document.createElement('div');
        container.className = 'ontology-editor-container';

        // Header
        const header = document.createElement('header');
        header.className = 'ontology-editor-header';
        const title = document.createElement('h1');
        title.textContent = 'Ontology Editor';
        header.appendChild(title);
        // ... (add buttons to header)
        container.appendChild(header);

        // Editor Content
        const editorContent = document.createElement('div');
        editorContent.className = 'ontology-editor-content';

        this.treeContainer.className = 'ontology-tree-container';
        this.propertyEditorContainer.className = 'property-editor-container';

        editorContent.appendChild(this.treeContainer);
        editorContent.appendChild(this.propertyEditorContainer);
        container.appendChild(editorContent);

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(container);

        this.updateView();
    }

    updateView() {
        this.renderTree();
        this.renderPropertyEditor();
    }

    renderTree(parentId?: string) {
        const { ontology, setOntology } = useAppStore.getState();
        const list = document.createElement('ul');
        list.dataset.parentId = parentId || 'root';

        const parentNode = parentId ? ontology.nodes[parentId] : null;
        const childNodes = parentNode
            ? (parentNode.children?.map((id) => ontology.nodes[id]) ?? [])
            : ontology.rootIds.map((id) => ontology.nodes[id]);

        childNodes.forEach((node) => {
            if (!node) return;
            const listItem = document.createElement('li');
            listItem.dataset.nodeId = node.id;

            const nodeContent = document.createElement('div');
            nodeContent.className = 'node-content';

            const nodeLabel = document.createElement('span');
            nodeLabel.textContent = node.label;
            nodeLabel.onclick = () => {
                this.selectedNodeId = node.id;
                this.updateView();
            };
            if (this.selectedNodeId === node.id) {
                nodeContent.classList.add('selected');
            }
            nodeContent.appendChild(nodeLabel);

            listItem.appendChild(nodeContent);

            if (node.children && node.children.length > 0) {
                listItem.appendChild(this.renderTree(node.id));
            }
            list.appendChild(listItem);
        });

        new Sortable(list, {
            group: 'ontology',
            animation: 150,
            onEnd: (evt) => {
                // ... (SortableJS logic)
            },
        });

        this.treeContainer.innerHTML = '';
        this.treeContainer.appendChild(list);
    }

    renderPropertyEditor() {
        // ... (Property editor logic)
    }
}

customElements.define('ontology-editor', OntologyEditor);
