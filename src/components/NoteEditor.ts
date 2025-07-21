
import { useAppStore } from '../store';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { SemanticTag } from '../extensions/SemanticTag';
import { Property } from '../extensions/Property';
import { suggestion } from '../lib/suggestion';
import '../ui/NoteEditor.css';
import { createButton } from '../ui/Button';
import { createTagModal } from '../ui/TagModal';
import { createMetadataSidebar } from '../ui/MetadataSidebar';
import { templates } from '../lib/templates';
import { Note } from '../../shared/types';
import { parseNoteContent } from '../lib/parser';
import { createTemplateSelector } from '../ui/TemplateSelector';
import { createPropertyEditor } from '../ui/PropertyEditor';
import { TypedProperty } from '../extensions/TypedProperty';

class NoteEditor extends HTMLElement {
    private editor: Editor | null = null;
    private noteId: string | null = null;
    private unsubscribe: (() => void) | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['note-id'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === 'note-id' && oldValue !== newValue) {
            this.noteId = newValue;
            this.render();
        }
    }

    connectedCallback() {
        if (!this.noteId) {
            this.noteId = this.getAttribute('note-id');
        }
        this.render();
    }

    disconnectedCallback() {
        this.editor?.destroy();
        this.unsubscribe?.();
    }

    render() {
        if (!this.shadowRoot) return;

        const { notes, updateNote, userProfile } = useAppStore.getState();
        const id = this.noteId;

        if (!id) {
            this.shadowRoot.innerHTML = 'No note selected.';
            return;
        }

        const note: Note | null = notes[id];
        const aiEnabled = userProfile?.preferences?.aiEnabled || false;
        const aiService = useAppStore.getState().getAIService();

        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'src/ui/NoteEditor.css');

        const editorLayout = document.createElement('div');
        editorLayout.className = 'note-editor-layout';

        const mainEditorContainer = document.createElement('div');
        mainEditorContainer.className = 'note-editor-main';

        if (!note) {
            mainEditorContainer.textContent = 'No note selected.';
            editorLayout.appendChild(mainEditorContainer);
            this.shadowRoot.innerHTML = '';
            this.shadowRoot.appendChild(linkElem);
            this.shadowRoot.appendChild(editorLayout);
            return;
        }

        const metadataSidebar = createMetadataSidebar();

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'note-title-input';
        titleInput.placeholder = 'Note Title';
        titleInput.value = note.title;
        titleInput.oninput = (e) => {
            updateNote(note.id, { title: (e.target as HTMLInputElement).value });
        };
        mainEditorContainer.appendChild(titleInput);

        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        mainEditorContainer.appendChild(toolbar);

        const editorElement = document.createElement('div');
        editorElement.className = 'tiptap-editor';
        mainEditorContainer.appendChild(editorElement);

        this.editor = new Editor({
            element: editorElement,
            extensions: [
                StarterKit,
                SemanticTag,
                Property,
                TypedProperty,
                Mention.configure({
                    HTMLAttributes: {
                        class: 'mention',
                    },
                    suggestion: {
                        ...suggestion(this.shadowRoot),
                        command: ({ editor, range, props }) => {
                            editor
                                .chain()
                                .focus()
                                .insertContentAt(range, [
                                    {
                                        type: 'semanticTag',
                                        attrs: { tag: props.id },
                                    },
                                    {
                                        type: 'text',
                                        text: ' ',
                                    },
                                ])
                                .run();
                        },
                    },
                }),
            ],
            content: note.content,
            onUpdate: ({ editor }) => {
                const html = editor.getHTML();
                const { tags, values } = parseNoteContent(editor);
                updateNote(note.id, { content: html, tags, values });
            },
        });

        this.unsubscribe = useAppStore.subscribe(
            (state) => state.notes[id],
            (newNote) => {
                if (newNote && newNote.content !== this.editor?.getHTML()) {
                    this.editor?.commands.setContent(newNote.content, false);
                }
                if (newNote && newNote.title !== titleInput.value) {
                    titleInput.value = newNote.title;
                }
            },
        );

        // ... (rest of the toolbar and button creation logic)

        editorLayout.appendChild(mainEditorContainer);
        editorLayout.appendChild(metadataSidebar);

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(editorLayout);
    }
}

customElements.define('note-editor', NoteEditor);
