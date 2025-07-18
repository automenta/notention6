// src/ui-rewrite/NoteEditor.ts
import { useAppStore } from '../store';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SemanticTag } from '../extensions/SemanticTag';
import './NoteEditor.css';
import { createButton } from './Button';
import { createTagModal } from './TagModal';
import { createMetadataSidebar } from './MetadataSidebar';
import { templates } from '../lib/templates';
import { AIService } from '../services/AIService';
import { Note } from '../../shared/types';

export function createNoteEditor(): HTMLElement {
  const { currentNoteId, notes, updateNote, settings } = useAppStore.getState();
  const note: Note | null = currentNoteId ? notes[currentNoteId] : null;
  const aiService = new AIService(settings.ai);

  const editorLayout = document.createElement('div');
  editorLayout.className = 'note-editor-layout';

  const mainEditorContainer = document.createElement('div');
  mainEditorContainer.className = 'note-editor-main';

  if (!note) {
    mainEditorContainer.textContent = 'No note selected.';
    editorLayout.appendChild(mainEditorContainer);
    return editorLayout;
  }

  // Title Input
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'note-title-input';
  titleInput.value = note.title;
  titleInput.oninput = (e) => {
    updateNote(note.id, { title: (e.target as HTMLInputElement).value });
  };
  mainEditorContainer.appendChild(titleInput);

  // Tiptap Editor
  const editorElement = document.createElement('div');
  editorElement.className = 'tiptap-editor';
  mainEditorContainer.appendChild(editorElement);

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

  // Template Selector
  const templateSelector = document.createElement('select');
  templateSelector.className = 'template-selector';
  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Select a template';
  defaultOption.value = '';
  templateSelector.appendChild(defaultOption);

  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name;
    templateSelector.appendChild(option);
  });

  templateSelector.onchange = (e) => {
    const selectedTemplateId = (e.target as HTMLSelectElement).value;
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
      editor.commands.setContent(selectedTemplate.content);
      updateNote(note.id, { fields: selectedTemplate.fields });
    }
  };
  toolbar.appendChild(templateSelector);


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
    onClick: () => {
      const modal = createTagModal({
        onSelect: (tag) => {
          editor.chain().focus().setSemanticTag(tag).run();
          document.body.removeChild(modal);
        },
        onClose: () => {
          document.body.removeChild(modal);
        }
      });
      document.body.appendChild(modal);
    },
    variant: 'secondary'
  });
  toolbar.appendChild(tagButton);

  // AI Buttons
  const autoTagButton = createButton({
    label: 'Auto-tag',
    onClick: async () => {
      const tags = await aiService.suggestTags(editor.getText());
      tags.forEach(tag => editor.chain().focus().insertContent(`#${tag} `).run());
    },
    variant: 'secondary',
    disabled: !settings.ai.enabled
  });
  toolbar.appendChild(autoTagButton);

  const summarizeButton = createButton({
    label: 'Summarize',
    onClick: async () => {
      const summary = await aiService.summarize(editor.getText());
      // Maybe show summary in a modal before inserting? For now, just insert it.
      editor.chain().focus().insertContent(`<h2>Summary</h2><p>${summary}</p>`).run();
    },
    variant: 'secondary',
    disabled: !settings.ai.enabled
  });
  toolbar.appendChild(summarizeButton);


  mainEditorContainer.insertBefore(toolbar, editorElement);
  
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
    mainEditorContainer.appendChild(saveButton)

  // Metadata Sidebar
  const metadataSidebar = createMetadataSidebar();

  editorLayout.appendChild(mainEditorContainer);
  editorLayout.appendChild(metadataSidebar);


  return editorLayout;
}
