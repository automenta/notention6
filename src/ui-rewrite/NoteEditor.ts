// src/ui-rewrite/NoteEditor.ts
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { useAppStore } from '../store';
import { createButton } from './Button';

export function createNoteEditor(): HTMLElement | null {
  const { notes, currentNoteId, updateNote, setCurrentNote } = useAppStore.getState();

  if (!currentNoteId) {
    return null;
  }

  const note = notes[currentNoteId];
  if (!note) {
    return null;
  }

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
    ],
    content: note.content,
  });

  const boldButton = createButton({
    label: 'B',
    onClick: () => editor.chain().focus().toggleBold().run(),
    className: editor.isActive('bold') ? 'is-active' : ''
  });
  
  const italicButton = createButton({
    label: 'I',
    onClick: () => editor.chain().focus().toggleItalic().run(),
    className: editor.isActive('italic') ? 'is-active' : ''
  });

  const ulButton = createButton({
    label: 'UL',
    onClick: () => editor.chain().focus().toggleBulletList().run(),
    className: editor.isActive('bulletList') ? 'is-active' : ''
  });

  const olButton = createButton({
    label: 'OL',
    onClick: () => editor.chain().focus().toggleOrderedList().run(),
    className: editor.isActive('orderedList') ? 'is-active' : ''
  });

  editor.on('transaction', () => {
    boldButton.className = editor.isActive('bold') ? 'is-active' : '';
    italicButton.className = editor.isActive('italic') ? 'is-active' : '';
    ulButton.className = editor.isActive('bulletList') ? 'is-active' : '';
    olButton.className = editor.isActive('orderedList') ? 'is-active' : '';
  });

  toolbar.appendChild(boldButton);
  toolbar.appendChild(italicButton);
  toolbar.appendChild(ulButton);
  toolbar.appendChild(olButton);
  
  editorWrapper.appendChild(titleInput);
  editorWrapper.appendChild(toolbar);
  editorWrapper.appendChild(editorEl);
  editorWrapper.appendChild(buttonContainer);

  const saveButton = createButton({
    label: 'Save',
    onClick: () => {
      updateNote(currentNoteId, {
        title: titleInput.value,
        content: editor.getHTML(),
      });
    },
    className: 'btn-primary'
  });

  const closeButton = createButton({
    label: 'Close',
    onClick: () => {
      setCurrentNote(undefined);
    },
    className: 'btn-secondary'
  });

  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(closeButton);

  return editorWrapper;
}

