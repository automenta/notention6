// src/ui-rewrite/OntologyEditor.ts

export function createOntologyEditor(options: {
  onSave: (ontology: any) => void;
}): HTMLElement {
  const editor = document.createElement("div");
  editor.className = "ontology-editor";

  editor.innerHTML = `
    <h2>Ontology Editor</h2>
    <textarea id="ontology-content" placeholder="Enter ontology JSON here"></textarea>
    <div id="ontology-button-container"></div>
  `;

  const contentTextarea = editor.querySelector("#ontology-content") as HTMLTextAreaElement;
  const buttonContainer = editor.querySelector("#ontology-button-container") as HTMLElement;

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Ontology";
  saveButton.className = "btn btn-primary";
  saveButton.addEventListener("click", () => {
    try {
      const ontology = JSON.parse(contentTextarea.value);
      options.onSave(ontology);
    } catch (error) {
      alert("Invalid JSON format for ontology.");
    }
  });

  buttonContainer.appendChild(saveButton);

  return editor;
}
