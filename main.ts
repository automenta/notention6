import "./src/components/NotentionApp";
import "./src/index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  const app = document.createElement('notention-app');
  rootElement.appendChild(app);
}
