import { renderApp } from "@/ui/NotentionApp/index";
import "./src/index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  renderApp(rootElement);
}
