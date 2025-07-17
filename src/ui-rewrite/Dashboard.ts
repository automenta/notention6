// src/ui-rewrite/Dashboard.ts
export function createDashboard(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Dashboard</h1><p>A summary of your activity will appear here.</p>';
  return el;
}
