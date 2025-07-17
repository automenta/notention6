// src/ui-rewrite/NoteEditor.ts
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { useAppStore } from '../store';
import { createButton } from './Button';
import Mention from '@tiptap/extension-mention';

export function createNoteEditor(): HTMLElement | null {
  const { notes, currentNoteId, updateNote, setCurrentNote } = useAppStore.getState();

  if (!currentNoteId) {
    return null;
  }

  const note = notes[currentNoteId];
  if (!note) {
    return null;
  }

  const editorLayout = document.createElement('div');
  editorLayout.className = 'note-editor-layout';

  const editorWrapper = document.createElement("div");
  editorWrapper.className = "note-editor";

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.id = 'note-title';
  titleInput.placeholder = 'Note Title';
  titleInput.value = note.title;

  const editorEl = document.createElement('div');
  editorEl.id = 'tiptap-editor';

  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'editor-button-container';

  const toolbar = document.createElement('div');
  toolbar.className = 'editor-toolbar';
  
  const editor = new Editor({
    element: editorEl,
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }) => {
            const { ontology } = useAppStore.getState();
            return Object.values(ontology.nodes)
              .filter(node => node.label.toLowerCase().startsWith(query.toLowerCase()))
              .slice(0, 5);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: props => {
                component = document.createElement('div');
                component.className = 'suggestion';

                props.items.forEach((item: OntologyNode) => {
                    const itemEl = document.createElement('div');
                    itemEl.textContent = item.label;
                    itemEl.onclick = () => props.command({ id: item.id, label: item.label });
                    component.appendChild(itemEl);
                });

                popup = editor.view.dom.parentElement?.appendChild(component);
              },

              onUpdate(props) {
                // This is where you would update the component's items
                // and positioning. For simplicity, we'll just re-render.
                // A more advanced implementation would diff the items.
                component.innerHTML = '';
                props.items.forEach((item: OntologyNode, index: number) => {
                    const itemEl = document.createElement('div');
                    itemEl.textContent = item.label;
                    itemEl.onclick = () => props.command({ id: item.id, label: item.label });
                    if (index === 0) { // Highlight the first item
                        itemEl.classList.add('is-selected');
                    }
                    component.appendChild(itemEl);
                });
              },

              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup?.destroy();
                  return true;
                }
                // Basic keyboard navigation
                const selected = component.querySelector('.is-selected');
                if (props.event.key === 'ArrowUp') {
                    const prev = selected?.previousElementSibling;
                    if (prev) {
                        selected?.classList.remove('is-selected');
                        prev.classList.add('is-selected');
                    }
                    return true;
                }
                if (props.event.key === 'ArrowDown') {
                    const next = selected?.nextElementSibling;
                    if (next) {
                        selected?.classList.remove('is-selected');
                        next.classList.add('is-selected');
                    }
                    return true;
                }
                if (props.event.key === 'Enter') {
                    selected?.click();
                    return true;
                }
                return false;
              },

              onExit() {
                popup?.destroy();
              },
            }
          },
        },
      }),
    ],
    content: note.content,
  });

  const boldButton = createButton({
    label: 'B',
    onClick: () => editor.chain().focus().toggleBold().run(),
  });
  
  const italicButton = createButton({
    label: 'I',
    onClick: () => editor.chain().focus().toggleItalic().run(),
  });

  const ulButton = createButton({
    label: 'UL',
    onClick: () => editor.chain().focus().toggleBulletList().run(),
  });

  const olButton = createButton({
    label: 'OL',
    onClick: () => editor.chain().focus().toggleOrderedList().run(),
  });

  editor.on('transaction', () => {
    boldButton.classList.toggle('is-active', editor.isActive('bold'));
    italicButton.classList.toggle('is-active', editor.isActive('italic'));
    ulButton.classList.toggle('is-active', editor.isActive('bulletList'));
    olButton.classList.toggle('is-active', editor.isActive('orderedList'));
  });

  // Group buttons for better organization
  const formattingGroup = document.createElement('div');
  formattingGroup.className = 'toolbar-group';
  formattingGroup.appendChild(boldButton);
  formattingGroup.appendChild(italicButton);

  const listGroup = document.createElement('div');
  listGroup.className = 'toolbar-group';
  listGroup.appendChild(ulButton);
  listGroup.appendChild(olButton);

  toolbar.appendChild(formattingGroup);
  toolbar.appendChild(listGroup);
  
  editorWrapper.appendChild(titleInput);
  editorWrapper.appendChild(toolbar);
  editorWrapper.appendChild(editorEl);

  // Action Buttons
  const saveButton = createButton({
    label: 'Save',
    onClick: () => {
      updateNote(currentNoteId, {
        title: titleInput.value,
        content: editor.getHTML(),
      });
    },
    variant: 'primary'
  });

  const closeButton = createButton({
    label: 'Close',
    onClick: () => {
      setCurrentNote(undefined);
    },
    variant: 'secondary'
  });

  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(closeButton);
  editorWrapper.appendChild(buttonContainer);

  // Metadata Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'note-editor-sidebar';

  const metadataHeader = document.createElement('h3');
  metadataHeader.textContent = 'Metadata';
  sidebar.appendChild(metadataHeader);

  // Tags Section
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'metadata-section';
  const tagsHeader = document.createElement('h4');
  tagsHeader.textContent = 'Tags';
  tagsContainer.appendChild(tagsHeader);

  const tagsList = document.createElement('div');
  tagsList.className = 'tags-list';
  note.tags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.textContent = tag;
    const removeBtn = createButton({
        label: 'x',
        onClick: () => {
            const newTags = note.tags.filter(t => t !== tag);
            updateNote(note.id, { tags: newTags });
        },
        variant: 'icon'
    });
    tagEl.appendChild(removeBtn);
    tagsList.appendChild(tagEl);
  });
  tagsContainer.appendChild(tagsList);

  const tagsInput = document.createElement('input');
  tagsInput.type = 'text';
  tagsInput.placeholder = 'Add a tag...';
  tagsInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
        const newTag = tagsInput.value.trim();
        if (newTag && !note.tags.includes(newTag)) {
            const newTags = [...note.tags, newTag];
            updateNote(note.id, { tags: newTags });
            tagsInput.value = '';
        }
    }
  };
  tagsContainer.appendChild(tagsInput);
  sidebar.appendChild(tagsContainer);

  editorLayout.appendChild(editorWrapper);
  editorLayout.appendChild(sidebar);

  return editorLayout;
}

