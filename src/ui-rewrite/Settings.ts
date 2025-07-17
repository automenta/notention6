// src/ui-rewrite/Settings.ts
import { DBService } from '../services/db';
import { nostrService } from '../services/NostrService';
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

function renderRelayList(relays: string[], onUpdate: () => void): HTMLElement {
    const list = document.createElement('ul');
    list.className = 'relay-list';

    relays.forEach(relayUrl => {
        const listItem = document.createElement('li');
        listItem.textContent = relayUrl;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'btn btn-secondary';
        removeButton.onclick = async () => {
            await nostrService.removeRelay(relayUrl);
            onUpdate();
        };

        listItem.appendChild(removeButton);
        list.appendChild(listItem);
    });

    return list;
}

function createNostrSection(): HTMLElement {
    const el = document.createElement('div');
    el.innerHTML = '<h3>Nostr Relays</h3>';

    const render = () => {
      const currentRelays = nostrService.getRelays();

      // Clear existing content
      const existingRelaySection = el.querySelector('.relay-management');
      if (existingRelaySection) {
          el.removeChild(existingRelaySection);
      }

      const relaySection = document.createElement('div');
      relaySection.className = 'relay-management';

      const relayList = renderRelayList(currentRelays, render);
      relaySection.appendChild(relayList);

      const addRelayInput = document.createElement('input');
      addRelayInput.type = 'text';
      addRelayInput.placeholder = 'wss://your-relay.com';

      const addRelayButton = document.createElement('button');
      addRelayButton.textContent = 'Add Relay';
      addRelayButton.className = 'btn btn-primary';
      addRelayButton.onclick = async () => {
          const newRelayUrl = addRelayInput.value.trim();
          if (newRelayUrl) {
              await nostrService.addRelay(newRelayUrl);
              addRelayInput.value = '';
              render();
          }
      };

      relaySection.appendChild(addRelayInput);
      relaySection.appendChild(addRelayButton);
      el.appendChild(relaySection);
    };

    // Initial render
    render();

    return el;
}


export function createSettings(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Settings</h1>';

  const sections = {
    profile: () => {
        const { userProfile, logout } = useAppStore.getState();

        const content = document.createElement('div');
        content.innerHTML = '<h3>Profile</h3>';

        if (userProfile?.nostrPubkey) {
            const pubkeyDisplay = document.createElement('p');
            pubkeyDisplay.textContent = `Public Key: ${userProfile.nostrPubkey}`;
            content.appendChild(pubkeyDisplay);
        }

        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.className = 'btn btn-danger';
        logoutButton.onclick = () => {
            if(confirm('Are you sure you want to logout? This will clear your local data.')) {
                logout();
            }
        };
        content.appendChild(logoutButton);

        return content;
    },
    appearance: () => {
        const content = document.createElement('div');
        content.innerHTML = '<h3>Appearance</h3>';

        const themeSwitcher = document.createElement('div');
        themeSwitcher.innerHTML = `
            <label for="theme-select">Theme:</label>
            <select id="theme-select">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        `;
        content.appendChild(themeSwitcher);

        const themeSelect = themeSwitcher.querySelector('#theme-select') as HTMLSelectElement;
        themeSelect.value = document.documentElement.getAttribute('data-theme') || 'light';
        themeSelect.onchange = () => {
            document.documentElement.setAttribute('data-theme', themeSelect.value);
            localStorage.setItem('theme', themeSelect.value);
        };

        return content;
    },
    nostr: () => createNostrSection(),
    ai: () => {
        const { aiConfig, setAiConfig } = useAppStore.getState();

        const content = document.createElement('div');
        content.innerHTML = '<h3>AI Features</h3>';

        const ollamaEnabled = document.createElement('input');
        ollamaEnabled.type = 'checkbox';
        ollamaEnabled.id = 'ollama-enabled';
        ollamaEnabled.checked = aiConfig.ollama.enabled;
        content.appendChild(ollamaEnabled);
        const ollamaLabel = document.createElement('label');
        ollamaLabel.textContent = 'Enable Ollama';
        ollamaLabel.htmlFor = 'ollama-enabled';
        content.appendChild(ollamaLabel);

        const ollamaUrl = document.createElement('input');
        ollamaUrl.type = 'text';
        ollamaUrl.id = 'ollama-url';
        ollamaUrl.value = aiConfig.ollama.url;
        ollamaUrl.placeholder = 'Ollama URL';
        content.appendChild(ollamaUrl);

        const geminiEnabled = document.createElement('input');
        geminiEnabled.type = 'checkbox';
        geminiEnabled.id = 'gemini-enabled';
        geminiEnabled.checked = aiConfig.gemini.enabled;
        content.appendChild(geminiEnabled);
        const geminiLabel = document.createElement('label');
        geminiLabel.textContent = 'Enable Gemini';
        geminiLabel.htmlFor = 'gemini-enabled';
        content.appendChild(geminiLabel);

        const geminiApiKey = document.createElement('input');
        geminiApiKey.type = 'password';
        geminiApiKey.id = 'gemini-api-key';
        geminiApiKey.value = aiConfig.gemini.apiKey;
        geminiApiKey.placeholder = 'Gemini API Key';
        content.appendChild(geminiApiKey);

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save AI Config';
        saveButton.className = 'btn btn-primary';
        saveButton.onclick = () => {
            setAiConfig({
                ollama: {
                    enabled: ollamaEnabled.checked,
                    url: ollamaUrl.value,
                },
                gemini: {
                    enabled: geminiEnabled.checked,
                    apiKey: geminiApiKey.value,
                }
            });
        };
        content.appendChild(saveButton);

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
