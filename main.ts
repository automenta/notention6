import { renderApp } from "./src/ui-rewrite/NotentionApp";
import "./src/index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  renderApp(rootElement);
}
