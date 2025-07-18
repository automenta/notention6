// src/ui-rewrite/Settings.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import "./Settings.css";
import { UserProfile } from "../../shared/types";

export function createSettings(): HTMLElement {
  const {
    userProfile,
    updateUserProfile,
    generateAndStoreNostrKeys,
    logoutFromNostr,
  } = useAppStore.getState();

  const container = document.createElement("div");
  container.className = "settings-container";

  // Header
  const header = document.createElement("header");
  header.className = "settings-header";
  const title = document.createElement("h1");
  title.textContent = "Settings";
  header.appendChild(title);
  container.appendChild(header);

  // User Profile Section
  const userProfileSection = createSection("User Profile");
  const nostrKeyForm = document.createElement("form");
  nostrKeyForm.className = "nostr-key-form";

  const pubKeyLabel = document.createElement("label");
  pubKeyLabel.textContent = "Nostr Public Key";
  const pubKeyInput = document.createElement("input");
  pubKeyInput.type = "text";
  pubKeyInput.value = userProfile?.nostrPubkey || "";
  pubKeyInput.disabled = true;
  nostrKeyForm.appendChild(pubKeyLabel);
  nostrKeyForm.appendChild(pubKeyInput);

  if (userProfile?.nostrPubkey) {
    const logoutButton = createButton({
      label: "Logout",
      onClick: () => logoutFromNostr(),
      variant: "danger",
    });
    nostrKeyForm.appendChild(logoutButton);
  } else {
    const generateKeysButton = createButton({
      label: "Generate Keys",
      onClick: () => generateAndStoreNostrKeys(),
      variant: "primary",
    });
    nostrKeyForm.appendChild(generateKeysButton);
  }
  userProfileSection.appendChild(nostrKeyForm);
  container.appendChild(userProfileSection);

  // AI Configuration Section
  const aiSection = createSection("AI Configuration");
  const aiForm = document.createElement("form");
  aiForm.className = "ai-form";

  // AI Enabled checkbox
  const aiEnabledLabel = document.createElement("label");
  aiEnabledLabel.textContent = "Enable AI Features";
  const aiEnabledCheckbox = document.createElement("input");
  aiEnabledCheckbox.type = "checkbox";
  aiEnabledCheckbox.checked = userProfile?.preferences.aiEnabled || false;
  aiEnabledCheckbox.onchange = (e) => {
    const newUserProfile: UserProfile = {
      ...userProfile!,
      preferences: {
        ...userProfile!.preferences,
        aiEnabled: (e.target as HTMLInputElement).checked,
      },
    };
    updateUserProfile(newUserProfile);
  };
  aiForm.appendChild(aiEnabledLabel);
  aiForm.appendChild(aiEnabledCheckbox);

  // AI Provider selection
  const providerLabel = document.createElement("label");
  providerLabel.textContent = "AI Provider";
  const providerSelect = document.createElement("select");
  const providers = [
    { value: "fallback", label: "Fallback (No API Key Required)" },
    { value: "gemini", label: "Google Gemini" },
    { value: "ollama", label: "Ollama (Local)" },
  ];

  providers.forEach((provider) => {
    const option = document.createElement("option");
    option.value = provider.value;
    option.textContent = provider.label;
    option.selected = userProfile?.preferences.aiProvider === provider.value;
    providerSelect.appendChild(option);
  });

  providerSelect.onchange = (e) => {
    const newUserProfile: UserProfile = {
      ...userProfile!,
      preferences: {
        ...userProfile!.preferences,
        aiProvider: (e.target as HTMLSelectElement).value as
          | "ollama"
          | "gemini"
          | "fallback",
      },
    };
    updateUserProfile(newUserProfile);
  };

  aiForm.appendChild(providerLabel);
  aiForm.appendChild(providerSelect);

  // Gemini API Key input
  const geminiKeyLabel = document.createElement("label");
  geminiKeyLabel.textContent = "Gemini API Key (optional)";
  const geminiKeyInput = document.createElement("input");
  geminiKeyInput.type = "password";
  geminiKeyInput.placeholder = "Enter your Google Gemini API key";
  geminiKeyInput.value = userProfile?.preferences.geminiApiKey || "";
  geminiKeyInput.onchange = (e) => {
    const newUserProfile: UserProfile = {
      ...userProfile!,
      preferences: {
        ...userProfile!.preferences,
        geminiApiKey: (e.target as HTMLInputElement).value,
      },
    };
    updateUserProfile(newUserProfile);
  };

  aiForm.appendChild(geminiKeyLabel);
  aiForm.appendChild(geminiKeyInput);

  // AI Matching Sensitivity
  const sensitivityLabel = document.createElement("label");
  sensitivityLabel.textContent = `AI Matching Sensitivity: ${userProfile?.preferences.aiMatchingSensitivity || 0.7}`;
  const sensitivityInput = document.createElement("input");
  sensitivityInput.type = "range";
  sensitivityInput.min = "0";
  sensitivityInput.max = "1";
  sensitivityInput.step = "0.1";
  sensitivityInput.value = String(
    userProfile?.preferences.aiMatchingSensitivity || 0.7,
  );
  sensitivityInput.onchange = (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    sensitivityLabel.textContent = `AI Matching Sensitivity: ${value}`;
    const newUserProfile: UserProfile = {
      ...userProfile!,
      preferences: {
        ...userProfile!.preferences,
        aiMatchingSensitivity: value,
      },
    };
    updateUserProfile(newUserProfile);
  };

  aiForm.appendChild(sensitivityLabel);
  aiForm.appendChild(sensitivityInput);

  aiSection.appendChild(aiForm);
  container.appendChild(aiSection);

  // Sharing Options Section
  const sharingSection = createSection("Sharing Options");
  const sharingForm = document.createElement("form");
  sharingForm.className = "sharing-form";

  const sharePubliclyLabel = document.createElement("label");
  sharePubliclyLabel.textContent = "Share Notes Publicly";
  const sharePubliclyCheckbox = document.createElement("input");
  sharePubliclyCheckbox.type = "checkbox";
  sharePubliclyCheckbox.checked =
    userProfile?.privacySettings?.sharePublicNotesGlobally || false;
  sharePubliclyCheckbox.onchange = (e) => {
    const newUserProfile: UserProfile = {
      ...userProfile!,
      privacySettings: {
        ...userProfile!.privacySettings!,
        sharePublicNotesGlobally: (e.target as HTMLInputElement).checked,
      },
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
  const section = document.createElement("section");
  section.className = "settings-section";
  const sectionTitle = document.createElement("h2");
  sectionTitle.textContent = title;
  section.appendChild(sectionTitle);
  return section;
}
