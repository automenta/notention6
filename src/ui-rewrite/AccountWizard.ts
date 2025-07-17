// src/ui-rewrite/AccountWizard.ts
import { getPublicKey } from 'nostr-tools/pure';
import { DBService } from '../services/db';
import { useAppStore } from '../store';
import { nostrService } from '../services/NostrService';

export function createAccountWizard(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <h1>Account Setup Wizard</h1>
    <p>Create a new Nostr keypair or import an existing one.</p>
    <button id="create-key-btn" class="btn btn-primary">Create New Key</button>
    <hr>
    <input type="password" id="private-key-input" placeholder="Enter your private key (nsec...)">
    <button id="import-key-btn" class="btn btn-secondary">Import Key</button>
  `;

  const createKeyBtn = el.querySelector('#create-key-btn');
  const importKeyBtn = el.querySelector('#import-key-btn');
  const privateKeyInput = el.querySelector('#private-key-input') as HTMLInputElement;

  createKeyBtn?.addEventListener('click', async () => {
    const { privateKey, publicKey } = nostrService.generateNewKeyPair();
    await DBService.saveNostrPrivateKey(privateKey);
    await DBService.saveNostrPublicKey(publicKey);
    useAppStore.getState().setUserProfile({ nostrPubkey: publicKey });
  });

  importKeyBtn?.addEventListener('click', async () => {
    const privateKey = privateKeyInput.value.trim();
    if (privateKey) {
      try {
        const publicKey = getPublicKey(privateKey);
        await DBService.saveNostrPrivateKey(privateKey);
        await DBService.saveNostrPublicKey(publicKey);
        useAppStore.getState().setUserProfile({ nostrPubkey: publicKey });
      } catch (e) {
        alert('Invalid private key');
      }
    }
  });

  return el;
}
