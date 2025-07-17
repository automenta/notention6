// src/ui-rewrite/NoteEditor.ts

export function createNoteEditor(options: {
  onSave: (note: { title: string; content: string }) => void;
}): HTMLElement {
  const editor = document.createElement("div");
  editor.className = "note-editor";

  editor.innerHTML = `
    <input type="text" id="note-title" placeholder="Note Title" />
    <textarea id="note-content" placeholder="Note Content"></textarea>
    <div id="editor-button-container"></div>
  `;

  const titleInput = editor.querySelector("#note-title") as HTMLInputElement;
  const contentTextarea = editor.querySelector("#note-content") as HTMLTextAreaElement;
  const buttonContainer = editor.querySelector("#editor-button-container") as HTMLElement;

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Note";
  saveButton.className = "btn btn-primary";
  saveButton.addEventListener("click", () => {
    options.onSave({
      title: titleInput.value,
      content: contentTextarea.value,
    });
    titleInput.value = "";
    contentTextarea.value = "";
  });

  buttonContainer.appendChild(saveButton);

  return editor;
}
