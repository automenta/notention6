import '../components/NoteEditor';

export function createNoteEditor(noteId?: string): HTMLElement {
    const noteEditor = document.createElement('note-editor');
    if (noteId) {
        noteEditor.setAttribute('note-id', noteId);
    }
    return noteEditor;
}
