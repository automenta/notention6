// src/ui-rewrite/NetworkPanel.ts
import { useAppStore } from '../store';
import { nostrService } from '../services/NostrService';
import { OntologyService } from '../services/ontology';
import { Note } from '../../shared/types';

function renderMatchedNotes(notes: Note[], container: HTMLElement) {
    container.innerHTML = ''; // Clear previous notes
    if (notes.length === 0) {
        container.innerHTML = '<p>No matched notes found.</p>';
        return;
    }

    const list = document.createElement('ul');
    notes.forEach(note => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <h4>${note.title}</h4>
            <div>${note.content.substring(0, 150)}...</div>
            <small>Author: ${note.pubkey?.substring(0, 10)}...</small>
        `;
        list.appendChild(listItem);
    });
    container.appendChild(list);
}

export function createNetworkPanel(): HTMLElement {
  const { relays, addRelay, removeRelay } = useAppStore.getState();

  const el = document.createElement('div');
  el.className = 'network-panel';
  el.innerHTML = '<h1>Network</h1>';

  // Relay Management Section
  const relaySection = document.createElement('section');
  relaySection.innerHTML = '<h2>Relays</h2>';

  const relayList = document.createElement('ul');
  relays.forEach(relay => {
    const li = document.createElement('li');
    li.textContent = relay;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => removeRelay(relay);
    li.appendChild(removeBtn);
    relayList.appendChild(li);
  });
  relaySection.appendChild(relayList);

  const addRelayForm = document.createElement('form');
  const newRelayInput = document.createElement('input');
  newRelayInput.type = 'text';
  newRelayInput.placeholder = 'wss://your-relay.com';
  addRelayForm.appendChild(newRelayInput);
  const addRelayBtn = document.createElement('button');
  addRelayBtn.textContent = 'Add Relay';
  addRelayBtn.type = 'submit';
  addRelayForm.appendChild(addRelayBtn);
  addRelayForm.onsubmit = (e) => {
    e.preventDefault();
    const newRelay = newRelayInput.value.trim();
    if (newRelay) {
      addRelay(newRelay);
      newRelayInput.value = '';
    }
  };
  relaySection.appendChild(addRelayForm);
  el.appendChild(relaySection);

  // Matched Notes Section
  const matchesSection = document.createElement('section');
  matchesSection.innerHTML = '<h2>Matched Notes</h2>';
  const resultsContainer = document.createElement('div');
  matchesSection.appendChild(resultsContainer);
  el.appendChild(matchesSection);

  let matchedNotes: Note[] = [];
  let renderTimeout: number | undefined;

  const render = () => {
    renderMatchedNotes(matchedNotes, resultsContainer);
  };

  const fetchAndDisplayMatches = async () => {
    resultsContainer.innerHTML = '<p>Fetching notes from the network...</p>';
    try {
        const { ontology } = useAppStore.getState();
    const tagsToSearch = Object.values(ontology.nodes).map(n => n.label);

    const filters = tagsToSearch.map(tag => ({
        kinds: [1],
        '#t': [tag.substring(1)], // remove # from tag
        limit: 10
    }));

    const events = nostrService.subscribeToEvents(filters, (event) => {
        const matchedNote: Note = {
            id: event.id,
            title: event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled',
            content: event.content,
            tags: event.tags.filter(t => t[0] === 't').map(t => `#${t[1]}`),
            createdAt: new Date(event.created_at * 1000),
            updatedAt: new Date(event.created_at * 1000),
            pubkey: event.pubkey,
        };

        if (!matchedNotes.some(n => n.id === matchedNote.id)) {
            matchedNotes = [matchedNote, ...matchedNotes].slice(0, 20); // Add to beginning, limit to 20
        }

        if (renderTimeout) {
            clearTimeout(renderTimeout);
        }
        renderTimeout = setTimeout(render, 500); // Batch renders every 500ms
    });
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color: red;">Error fetching notes: ${error.message}</p>`;
    }
  };

  fetchAndDisplayMatches();

  return el;
}
