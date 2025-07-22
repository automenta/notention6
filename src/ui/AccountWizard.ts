// src/ui/AccountWizard.ts
import { getPublicKey } from "nostr-tools/pure";
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./AccountWizard.css";

export function createAccountWizard(): HTMLElement {
  const wizardContainer = document.createElement("div");
  wizardContainer.className = "account-wizard";

  const card = document.createElement("div");
  card.className = "wizard-card";
  wizardContainer.appendChild(card);

  const title = document.createElement("h1");
  title.textContent = "Welcome to Notention";
  card.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.textContent =
    "Create a new Nostr keypair or import an existing one to get started.";
  card.appendChild(subtitle);

  const actions = document.createElement("div");
  actions.className = "wizard-actions";
  card.appendChild(actions);

  const createKeyBtn = createButton({
    label: "Create New Key",
    onClick: async () => {
      const { generateAndStoreNostrKeys, createProfileNote } =
        useAppStore.getState();
      const result = await generateAndStoreNostrKeys();
      if (result.publicKey) {
        await createProfileNote();
        console.log("New Nostr keypair generated successfully");
      }
    },
    variant: "primary",
    fullWidth: true,
  });
  actions.appendChild(createKeyBtn);

  const divider = document.createElement("hr");
  divider.className = "wizard-divider";
  actions.appendChild(divider);

  const privateKeyInput = document.createElement("input");
  privateKeyInput.type = "password";
  privateKeyInput.id = "private-key-input";
  privateKeyInput.placeholder = "Enter your private key (nsec...)";
  privateKeyInput.className = "wizard-input";
  actions.appendChild(privateKeyInput);

  const importKeyBtn = createButton({
    label: "Import Key",
    onClick: async () => {
      const privateKey = privateKeyInput.value.trim();
      if (privateKey) {
        try {
          const publicKey = getPublicKey(privateKey);
          const { generateAndStoreNostrKeys, createProfileNote } =
            useAppStore.getState();
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
    },
    variant: "secondary",
    fullWidth: true,
  });
  actions.appendChild(importKeyBtn);

  return wizardContainer;
}
