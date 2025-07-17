// src/ui-rewrite/NetworkPanel.ts
import { nostrService } from '../services/NostrService';

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

export function createNetworkPanel(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Network Matches</h1><p>Notes from the network that match your interests will appear here.</p>';

  const render = () => {
    const currentRelays = nostrService.getRelays();

    // Clear existing content
    const existingRelaySection = el.querySelector('.relay-management');
    if (existingRelaySection) {
        el.removeChild(existingRelaySection);
    }

    const relaySection = document.createElement('div');
    relaySection.className = 'relay-management';
    relaySection.innerHTML = '<h2>Relay Management</h2>';
    
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
