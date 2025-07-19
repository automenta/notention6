import { renderApp } from "@/ui/NotentionApp";
import "./src/index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  renderApp(rootElement);
}
