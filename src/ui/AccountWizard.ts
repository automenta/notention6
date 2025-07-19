// src/ui-rewrite/AccountWizard.ts
import { getPublicKey } from "nostr-tools/pure";
import { useStore } from "../store";

export function createAccountWizard(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `
    <h1>Account Setup Wizard</h1>
    <p>Create a new Nostr keypair or import an existing one.</p>
    <button id="create-key-btn" class="btn btn-primary">Create New Key</button>
    <hr>
    <input type="password" id="private-key-input" placeholder="Enter your private key (nsec...)">
    <button id="import-key-btn" class="btn btn-secondary">Import Key</button>
  `;

  const createKeyBtn = el.querySelector("#create-key-btn");
  const importKeyBtn = el.querySelector("#import-key-btn");
  const privateKeyInput = el.querySelector(
    "#private-key-input",
  ) as HTMLInputElement;

  createKeyBtn?.addEventListener("click", async () => {
    const { generateAndStoreNostrKeys, createProfileNote } =
      useStore.getState();
    const result = await generateAndStoreNostrKeys();
    if (result.publicKey) {
      await createProfileNote();
      console.log("New Nostr keypair generated successfully");
    }
  });

  importKeyBtn?.addEventListener("click", async () => {
    const privateKey = privateKeyInput.value.trim();
    if (privateKey) {
      try {
        const publicKey = getPublicKey(privateKey);
        const { generateAndStoreNostrKeys, createProfileNote } =
          useStore.getState();
        const result = await generateAndStoreNostrKeys(privateKey, publicKey);
        if (result.publicKey) {
          await createProfileNote();
          console.log("Nostr keypair imported successfully");
        }
      } catch (e) {
        alert("Invalid private key");
        console.error("Error importing key:", e);
      }
    }
  });

  return el;
}
