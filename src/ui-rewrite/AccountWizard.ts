// src/ui-rewrite/AccountWizard.ts
export function createAccountWizard(): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Account Setup Wizard</h1><p>Create or import your Nostr keypair.</p><button class="btn btn-primary">Get Started</button>';
  return el;
}
