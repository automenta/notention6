// src/ui-rewrite/Settings.ts
import { DBService } from '../services/db';
import { useAppStore } from '../store';

function createDataSection(onUpdate: () => void): HTMLElement {
    const section = document.createElement('div');
    section.innerHTML = '<h3>Data Management</h3>';

    // Export Button
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Data';
    exportButton.className = 'btn btn-primary';
    exportButton.onclick = async () => {
        const data = await DBService.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notention-backup.json';
        a.click();
        URL.revokeObjectURL(url);
    };
    section.appendChild(exportButton);

    // Import Button
    const importLabel = document.createElement('label');
    importLabel.textContent = 'Import Data: ';
    importLabel.className = 'btn btn-secondary';
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    await DBService.importData(data);
                    alert('Data imported successfully!');
                    onUpdate();
                } catch (error) {
                    alert('Failed to import data. Invalid file format.');
                    console.error(error);
                }
            };
            reader.readAsText(file);
        }
    };
    importLabel.appendChild(importInput);
    section.appendChild(importLabel);

    return section;
}


export function createSettings(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Settings</h1>';

  const sections = {
    profile: () => {
        const content = document.createElement('div');
        content.innerHTML = '<h3>Profile</h3><p>Manage your Nostr keys here.</p>';
        return content;
    },
    appearance: () => {
        const content = document.createElement('div');
        content.innerHTML = '<h3>Appearance</h3><p>Theme options will be here.</p>';
        return content;
    },
    nostr: () => {
        const content = document.createElement('div');
        content.innerHTML = '<h3>Nostr</h3><p>Relay management will be here.</p>';
        return content;
    },
    ai: () => {
        const content = document.createElement('div');
        content.innerHTML = '<h3>AI Features</h3><p>AI settings will be here.</p>';
        return content;
    },
    data: () => createDataSection(() => useAppStore.getState().initializeApp()),
  };

  const nav = document.createElement('nav');
  const content = document.createElement('div');
  
  Object.keys(sections).forEach(key => {
    const button = document.createElement('button');
    button.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    button.className = 'btn btn-secondary';
    button.onclick = () => {
        content.innerHTML = '';
        content.appendChild(sections[key as keyof typeof sections]());
    };
    nav.appendChild(button);
  });

  el.appendChild(nav);
  el.appendChild(content);

  // Load data section by default
  content.appendChild(sections.data());

  return el;
}
