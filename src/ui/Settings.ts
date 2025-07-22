// src/ui-rewrite/Settings.ts
import { useAppStore } from "../store";
import { createButton } from "./Button";
import { createComponentSwitcher } from "./ComponentSwitcher";
import { createOntologyModuleManager } from "./OntologyModuleManager";
import { createTemplateManager } from "./TemplateManager";
import { createAdvancedSearch } from "./AdvancedSearch";
import {
  createCollapsibleSection,
  createProgressiveForm,
} from "../lib/ProgressiveDisclosure";
import { createFeedbackSystem } from "../lib/AnimationSystem";
import "./Settings.css";
import { UserProfile } from "../../shared/types";
import { createSyncSettings } from "./SyncSettings";

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

  // AI Configuration Section with Progressive Disclosure
  const aiBasicFields = document.createElement("div");
  const aiAdvancedFields = document.createElement("div");

  // Basic AI settings
  const aiEnabledLabel = document.createElement("label");
  aiEnabledLabel.textContent = "🤖 Enable AI Features";
  aiEnabledLabel.style.display = "flex";
  aiEnabledLabel.style.alignItems = "center";
  aiEnabledLabel.style.gap = "var(--space-sm)";
  aiEnabledLabel.style.fontWeight = "500";

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
    useAppStore.getState().getAIService().reinitializeModels();
  };
  aiEnabledLabel.appendChild(aiEnabledCheckbox);
  aiBasicFields.appendChild(aiEnabledLabel);

  // AI Provider selection (basic)
  const providerLabel = document.createElement("label");
  providerLabel.textContent = "⚙️ AI Provider";
  providerLabel.style.fontWeight = "500";
  const providerSelect = document.createElement("select");
  const providers = [
    { value: "fallback", label: "🔄 Fallback (No API Key Required)" },
    { value: "gemini", label: "🧠 Google Gemini" },
    { value: "ollama", label: "🏠 Ollama (Local)" },
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
    useAppStore.getState().getAIService().reinitializeModels();
  };

  aiBasicFields.appendChild(providerLabel);
  aiBasicFields.appendChild(providerSelect);

  // Advanced AI settings
  const geminiKeyLabel = document.createElement("label");
  geminiKeyLabel.textContent = "🔑 Gemini API Key";
  geminiKeyLabel.style.fontWeight = "500";
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
    useAppStore.getState().getAIService().reinitializeModels();
  };

  aiAdvancedFields.appendChild(geminiKeyLabel);
  aiAdvancedFields.appendChild(geminiKeyInput);

  const ollamaUrlLabel = document.createElement("label");
  ollamaUrlLabel.textContent = "🏠 Ollama API URL";
  ollamaUrlLabel.style.fontWeight = "500";
  const ollamaUrlInput = document.createElement("input");
  ollamaUrlInput.type = "text";
  ollamaUrlInput.placeholder = "http://localhost:11434";
  ollamaUrlInput.value = userProfile?.preferences.ollamaApiUrl || "";
  ollamaUrlInput.onchange = (e) => {
    const newUserProfile: UserProfile = {
      ...userProfile!,
      preferences: {
        ...userProfile!.preferences,
        ollamaApiUrl: (e.target as HTMLInputElement).value,
      },
    };
    updateUserProfile(newUserProfile);
    useAppStore.getState().getAIService().reinitializeModels();
  };
  aiAdvancedFields.appendChild(ollamaUrlLabel);
  aiAdvancedFields.appendChild(ollamaUrlInput);

  // AI Matching Sensitivity
  const sensitivityLabel = document.createElement("label");
  sensitivityLabel.textContent = `🎯 AI Matching Sensitivity: ${userProfile?.preferences.aiMatchingSensitivity || 0.7}`;
  sensitivityLabel.style.fontWeight = "500";
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
    sensitivityLabel.textContent = `🎯 AI Matching Sensitivity: ${value}`;
    const newUserProfile: UserProfile = {
      ...userProfile!,
      preferences: {
        ...userProfile!.preferences,
        aiMatchingSensitivity: value,
      },
    };
    updateUserProfile(newUserProfile);
  };

  aiAdvancedFields.appendChild(sensitivityLabel);
  aiAdvancedFields.appendChild(sensitivityInput);

  // Create progressive form for AI settings
  const aiSection = createSection("🤖 AI Configuration");
  const aiProgressiveForm = createProgressiveForm(
    aiBasicFields,
    aiAdvancedFields,
    {
      persistent: true,
      storageKey: "ai-advanced-settings",
    },
  );
  aiSection.appendChild(aiProgressiveForm);
  container.appendChild(aiSection);

  // Theme Section
  const themeSection = createSection("Theme");
  const themeForm = document.createElement("form");
  themeForm.className = "theme-form";
  const themeLabel = document.createElement("label");
  themeLabel.textContent = "Theme";
  const themeSelect = document.createElement("select");
  const themes = ["light", "dark", "system", "solarized", "nord"];
  themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme;
    option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    option.selected = userProfile?.preferences.theme === theme;
    themeSelect.appendChild(option);
  });
  themeSelect.onchange = (e) => {
    const newTheme = (e.target as HTMLSelectElement).value as
      | "light"
      | "dark"
      | "system"
      | "solarized"
      | "nord";
    const { setTheme } = useAppStore.getState();
    setTheme(newTheme);
    const feedback = createFeedbackSystem();
    feedback.success(`Theme changed to ${newTheme}`);
  };
  themeForm.appendChild(themeLabel);
  themeForm.appendChild(themeSelect);
  themeSection.appendChild(themeForm);
  container.appendChild(themeSection);

  // Component Preferences Section with Progressive Disclosure
  const componentCollapsible = createCollapsibleSection(
    "🔧 Component Preferences",
    createComponentSwitcher(),
    {
      expanded: false,
      persistent: true,
      storageKey: "component-preferences-expanded",
    },
  );
  container.appendChild(componentCollapsible);

  // Ontology & Template Management Section
  const ontologyAndTemplateContainer = document.createElement("div");
  ontologyAndTemplateContainer.appendChild(createOntologyModuleManager());
  ontologyAndTemplateContainer.appendChild(createTemplateManager());

  const ontologyCollapsible = createCollapsibleSection(
    "🧠 Ontology & Templates",
    ontologyAndTemplateContainer,
    {
      expanded: false,
      persistent: true,
      storageKey: "ontology-templates-expanded",
    },
  );
  container.appendChild(ontologyCollapsible);

  // Advanced Search Section with Progressive Disclosure
  const searchCollapsible = createCollapsibleSection(
    "🔍 Advanced Search",
    createAdvancedSearch(),
    {
      expanded: false,
      persistent: true,
      storageKey: "advanced-search-expanded",
    },
  );
  container.appendChild(searchCollapsible);

  container.appendChild(dataManagementSection);

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
