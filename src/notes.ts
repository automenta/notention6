import { createAppShell } from "@/ui/AppShell";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  createAppShell(rootElement);
}
