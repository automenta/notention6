// src/ui-rewrite/NoteEditor.ts
import { useAppStore } from '../store';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SemanticTag } from '../extensions/SemanticTag';
import './NoteEditor.css';
import { createButton } from './Button';

export function createNoteEditor(): HTMLElement {
  const { currentNoteId, notes, updateNote } = useAppStore.getState();
  const note = currentNoteId ? notes[currentNoteId] : null;

  const container = document.createElement('div');
  container.className = 'note-editor-container';

  if (!note) {
    container.textContent = 'No note selected.';
    return container;
  }

  // Title Input
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'note-title-input';
  titleInput.value = note.title;
  titleInput.oninput = (e) => {
    updateNote(note.id, { title: (e.target as HTMLInputElement).value });
  };
  container.appendChild(titleInput);

  // Tiptap Editor
  const editorElement = document.createElement('div');
  editorElement.className = 'tiptap-editor';
  container.appendChild(editorElement);

  const editor = new Editor({
    element: editorElement,
    extensions: [
      StarterKit,
      SemanticTag,
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      updateNote(note.id, { content: editor.getHTML() });
    },
  });

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'editor-toolbar';

  const boldButton = createButton({
    label: 'Bold',
    onClick: () => editor.chain().focus().toggleBold().run(),
    variant: editor.isActive('bold') ? 'primary' : 'secondary'
  });
  toolbar.appendChild(boldButton);

  const italicButton = createButton({
    label: 'Italic',
    onClick: () => editor.chain().focus().toggleItalic().run(),
    variant: editor.isActive('italic') ? 'primary' : 'secondary'
  });
  toolbar.appendChild(italicButton);

  const strikeButton = createButton({
    label: 'Strike',
    onClick: () => editor.chain().focus().toggleStrike().run(),
    variant: editor.isActive('strike') ? 'primary' : 'secondary'
  });
  toolbar.appendChild(strikeButton);

  const tagButton = createButton({
    label: 'Tag',
    onClick: () => editor.chain().focus().setSemanticTag('Example').run(),
    variant: 'secondary'
  });
  toolbar.appendChild(tagButton);

  container.insertBefore(toolbar, editorElement);
  
  // Save Button
  const saveButton = createButton({
    label: 'Save',
    onClick: () => {
      // The note is already updated on every change, so this button is just for show for now.
      // In a real app, you might want to debounce the updates and have an explicit save.
      console.log('Note saved!');
    },
    variant: 'primary'
    });
    container.appendChild(saveButton)

  return container;
}
