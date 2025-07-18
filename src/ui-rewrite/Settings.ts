// src/ui-rewrite/Settings.ts
import { useAppStore } from '../store';
import { createButton } from './Button';
import './Settings.css';
import { UserProfile } from '../../shared/types';

export function createSettings(): HTMLElement {
  const { userProfile, updateUserProfile, generateAndStoreNostrKeys, logoutFromNostr } = useAppStore.getState();

  const container = document.createElement('div');
  container.className = 'settings-container';

  // Header
  const header = document.createElement('header');
  header.className = 'settings-header';
  const title = document.createElement('h1');
  title.textContent = 'Settings';
  header.appendChild(title);
  container.appendChild(header);

  // User Profile Section
  const userProfileSection = createSection('User Profile');
  const nostrKeyForm = document.createElement('form');
  nostrKeyForm.className = 'nostr-key-form';

  const pubKeyLabel = document.createElement('label');
  pubKeyLabel.textContent = 'Nostr Public Key';
  const pubKeyInput = document.createElement('input');
  pubKeyInput.type = 'text';
  pubKeyInput.value = userProfile?.nostrPubkey || '';
  pubKeyInput.disabled = true;
  nostrKeyForm.appendChild(pubKeyLabel);
  nostrKeyForm.appendChild(pubKeyInput);

  if (userProfile?.nostrPubkey) {
    const logoutButton = createButton({
      label: 'Logout',
      onClick: () => logoutFromNostr(),
      variant: 'danger'
    });
    nostrKeyForm.appendChild(logoutButton);
  } else {
    const generateKeysButton = createButton({
      label: 'Generate Keys',
      onClick: () => generateAndStoreNostrKeys(),
      variant: 'primary'
    });
    nostrKeyForm.appendChild(generateKeysButton);
  }
  userProfileSection.appendChild(nostrKeyForm);
  container.appendChild(userProfileSection);

  // AI Configuration Section
  const aiSection = createSection('AI Configuration');
  const aiForm = document.createElement('form');
  aiForm.className = 'ai-form';

  const aiEnabledLabel = document.createElement('label');
  aiEnabledLabel.textContent = 'Enable AI';
  const aiEnabledCheckbox = document.createElement('input');
  aiEnabledCheckbox.type = 'checkbox';
  aiEnabledCheckbox.checked = userProfile?.preferences.aiEnabled || false;
  aiEnabledCheckbox.onchange = (e) => {
      const newUserProfile: UserProfile = {
          ...userProfile!,
          preferences: {
              ...userProfile!.preferences,
              aiEnabled: (e.target as HTMLInputElement).checked
          }
      };
      updateUserProfile(newUserProfile);
  };
  aiForm.appendChild(aiEnabledLabel);
  aiForm.appendChild(aiEnabledCheckbox);
  
  aiSection.appendChild(aiForm);
  container.appendChild(aiSection);


  // Sharing Options Section
  const sharingSection = createSection('Sharing Options');
  const sharingForm = document.createElement('form');
    sharingForm.className = 'sharing-form';

    const sharePubliclyLabel = document.createElement('label');
    sharePubliclyLabel.textContent = 'Share Notes Publicly';
    const sharePubliclyCheckbox = document.createElement('input');
    sharePubliclyCheckbox.type = 'checkbox';
    sharePubliclyCheckbox.checked = userProfile?.privacySettings?.sharePublicNotesGlobally || false;
    sharePubliclyCheckbox.onchange = (e) => {
        const newUserProfile: UserProfile = {
            ...userProfile!,
            privacySettings: {
                ...userProfile!.privacySettings!,
                sharePublicNotesGlobally: (e.target as HTMLInputElement).checked
            }
        };
        updateUserProfile(newUserProfile);
    };
    sharingForm.appendChild(sharePubliclyLabel);
    sharingForm.appendChild(sharePubliclyCheckbox);
  sharingSection.appendChild(sharingForm);
  container.appendChild(sharingSection);

  return container;
}

function createSection(title: string): HTMLElement {
  const section = document.createElement('section');
  section.className = 'settings-section';
  const sectionTitle = document.createElement('h2');
  sectionTitle.textContent = title;
  section.appendChild(sectionTitle);
  return section;
}
