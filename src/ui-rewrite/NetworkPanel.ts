// src/ui-rewrite/NetworkPanel.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import './NetworkPanel.css';
import { Match } from '../../shared/types';

export function createNetworkPanel(): HTMLElement {
  const { matches, nostrRelays, addNostrRelay, removeNostrRelay } = useAppStore.getState();

  const container = document.createElement('div');
  container.className = 'network-panel-container';

  // Header
  const header = document.createElement('header');
  header.className = 'network-panel-header';
  const title = document.createElement('h1');
  title.textContent = 'Network';
  header.appendChild(title);
  container.appendChild(header);

  // Matches Section
  const matchesContainer = document.createElement('div');
  matchesContainer.className = 'matches-container';
  const matchesTitle = document.createElement('h2');
  matchesTitle.textContent = 'Matches';
  matchesContainer.appendChild(matchesTitle);

  const matchesList = document.createElement('ul');
  matchesList.className = 'matches-list';

  if (matches.length > 0) {
    matches.forEach(match => {
      const listItem = document.createElement('li');
      listItem.className = 'match-item';
      listItem.innerHTML = `
        <p>Match for note: <strong>${match.localNoteId}</strong> with <strong>${match.targetNoteId}</strong></p>
        <span>Similarity: ${match.similarity.toFixed(2)}</span>
      `;
      matchesList.appendChild(listItem);
    });
  } else {
    const noMatchesMessage = document.createElement('p');
    noMatchesMessage.textContent = 'No matches found.';
    matchesList.appendChild(noMatchesMessage);
  }
  matchesContainer.appendChild(matchesList);
  container.appendChild(matchesContainer);

  // Relays Section
  const relaysContainer = document.createElement('div');
  relaysContainer.className = 'relays-container';
  const relaysTitle = document.createElement('h2');
  relaysTitle.textContent = 'Nostr Relays';
  relaysContainer.appendChild(relaysTitle);

  const relaysList = document.createElement('ul');
  relaysList.className = 'relays-list';

  nostrRelays.forEach(relay => {
    const listItem = document.createElement('li');
    listItem.className = 'relay-item';
    const relayUrl = document.createElement('span');
    relayUrl.textContent = relay;
    listItem.appendChild(relayUrl);

    const removeButton = createButton({
      label: 'Remove',
      onClick: () => removeNostrRelay(relay),
      variant: 'danger'
    });
    listItem.appendChild(removeButton);
    relaysList.appendChild(listItem);
  });
  relaysContainer.appendChild(relaysList);

  const addRelayForm = document.createElement('form');
  addRelayForm.className = 'add-relay-form';
  addRelayForm.onsubmit = (e) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem('relayUrl') as HTMLInputElement;
    const newRelay = input.value.trim();
    if (newRelay) {
      addNostrRelay(newRelay);
      input.value = '';
    }
  };

  const relayUrlInput = document.createElement('input');
  relayUrlInput.type = 'text';
  relayUrlInput.name = 'relayUrl';
  relayUrlInput.placeholder = 'wss://relay.example.com';
  addRelayForm.appendChild(relayUrlInput);

  const addRelayButton = createButton({
    label: 'Add Relay',
    onClick: () => addRelayForm.requestSubmit(),
    variant: 'primary'
  });
  addRelayForm.appendChild(addRelayButton);

  relaysContainer.appendChild(addRelayForm);
  container.appendChild(relaysContainer);

  return container;
}
