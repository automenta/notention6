// main-rewrite.ts
import { renderApp } from "./src/ui-rewrite/NotentionApp";
import "./src/index.css";
import "./src/ui-rewrite/NotentionApp.css";
import "./src/ui-rewrite/Button.css";
import "./src/ui-rewrite/OntologyEditor.css";
import "./src/ui-rewrite/NoteEditor.css";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app");
  if (root) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    renderApp(root);
  }
});
