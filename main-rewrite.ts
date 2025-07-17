// main-rewrite.ts
import { renderApp } from "./src/ui-rewrite/NotentionApp";
import "./src/index.css";
import "./src/ui-rewrite/NotentionApp.css";
import "./src/ui-rewrite/Button.css";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app");
  if (root) {
    renderApp(root);
  }
});
