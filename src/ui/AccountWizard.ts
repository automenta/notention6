import { useAppStore } from "../store";
import "./Button";
import "./Input";

export class AccountWizard extends HTMLElement {
  private currentStep = 0;
  private steps = [
    { title: "Welcome to Notention", component: "welcome" },
    { title: "Set up your identity", component: "identity" },
    { title: "Configure privacy", component: "privacy" },
    { title: "All set!", component: "complete" },
  ];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  private async handleNext() {
    if (this.currentStep === 1) {
      // Generate keys step
      await this.generateKeys();
    }

    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.render();
    } else {
      this.completeWizard();
    }
  }

  private handlePrevious() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
    }
  }

  private async generateKeys() {
    try {
      const result = await useAppStore.getState().generateAndStoreNostrKeys();
      if (!result.publicKey) {
        throw new Error("Failed to generate keys");
      }
    } catch (error) {
      console.error("Error generating keys:", error);
      alert("Failed to generate keys. Please try again.");
      return false;
    }
    return true;
  }

  private completeWizard() {
    this.dispatchEvent(
      new CustomEvent("wizard-completed", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderWelcome() {
    return `
      <div class="step-content">
        <div class="hero-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
        </div>
        <h2 class="step-title">Welcome to Notention</h2>
        <p class="step-description">
          A decentralized note-taking app that puts you in control of your data. 
          Notention uses the Nostr protocol to enable secure, peer-to-peer collaboration 
          while keeping your notes private by default.
        </p>
        <div class="feature-list">
          <div class="feature-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
            </svg>
            <span>Rich semantic note-taking with tags and ontology</span>
          </div>
          <div class="feature-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>End-to-end encryption and privacy controls</span>
          </div>
          <div class="feature-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>Decentralized network for collaboration and discovery</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderIdentity() {
    return `
      <div class="step-content">
        <div class="hero-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h2 class="step-title">Create Your Identity</h2>
        <p class="step-description">
          Notention will generate a unique cryptographic identity for you on the Nostr network. 
          This identity allows you to securely share and collaborate while maintaining privacy.
        </p>
        <div class="info-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>Important:</strong> Your private key will be stored securely in your browser. 
            Make sure to back it up once generated to avoid losing access to your identity.
          </div>
        </div>
      </div>
    `;
  }

  private renderPrivacy() {
    return `
      <div class="step-content">
        <div class="hero-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <h2 class="step-title">Privacy Settings</h2>
        <p class="step-description">
          Choose your default privacy settings. You can always change these later in Settings.
        </p>
        <div class="privacy-options">
          <div class="privacy-option">
            <div class="option-header">
              <h4>Public Sharing</h4>
              <div class="toggle-switch">
                <input type="checkbox" id="public-sharing">
                <label for="public-sharing"></label>
              </div>
            </div>
            <p>Allow your published notes to be discoverable by others on the network</p>
          </div>
          <div class="privacy-option">
            <div class="option-header">
              <h4>Include Tags</h4>
              <div class="toggle-switch">
                <input type="checkbox" id="include-tags" checked>
                <label for="include-tags"></label>
              </div>
            </div>
            <p>Include tags when sharing notes publicly (helps with discovery)</p>
          </div>
        </div>
      </div>
    `;
  }

  private renderComplete() {
    return `
      <div class="step-content">
        <div class="hero-icon success">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12l2 2 4-4"></path>
            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
          </svg>
        </div>
        <h2 class="step-title">You're All Set!</h2>
        <p class="step-description">
          Your Notention account is ready. You can now start creating notes, 
          building your ontology, and connecting with the decentralized network.
        </p>
        <div class="next-steps">
          <h4>What's next?</h4>
          <ul>
            <li>Create your first note</li>
            <li>Set up your ontology with tags and concepts</li>
            <li>Explore the network to discover related content</li>
            <li>Configure AI features if you have Ollama or Gemini</li>
          </ul>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.shadowRoot) return;

    const currentStepData = this.steps[this.currentStep];
    let stepContent = "";

    switch (currentStepData.component) {
      case "welcome":
        stepContent = this.renderWelcome();
        break;
      case "identity":
        stepContent = this.renderIdentity();
        break;
      case "privacy":
        stepContent = this.renderPrivacy();
        break;
      case "complete":
        stepContent = this.renderComplete();
        break;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: var(--color-background);
        }

        .wizard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          max-width: 600px;
          margin: 0 auto;
          padding: var(--space-8);
        }

        .wizard-progress {
          display: flex;
          align-items: center;
          margin-bottom: var(--space-8);
        }

        .progress-step {
          flex: 1;
          height: 4px;
          background: var(--color-border);
          border-radius: var(--radius-full);
          margin: 0 var(--space-1);
        }

        .progress-step.completed {
          background: var(--color-accent);
        }

        .progress-step.current {
          background: var(--color-accent);
        }

        .wizard-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .step-content {
          max-width: 500px;
          margin: 0 auto;
        }

        .hero-icon {
          color: var(--color-accent);
          margin-bottom: var(--space-6);
        }

        .hero-icon.success {
          color: var(--color-success-500);
        }

        .step-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-4);
        }

        .step-description {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-6);
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          text-align: left;
          margin-bottom: var(--space-6);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--font-size-base);
          color: var(--color-text-primary);
        }

        .feature-item svg {
          color: var(--color-success-500);
          flex-shrink: 0;
        }

        .info-box {
          background: var(--color-accent-light);
          border: 1px solid var(--color-accent);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          display: flex;
          gap: var(--space-3);
          text-align: left;
          margin-bottom: var(--space-6);
        }

        .info-box svg {
          color: var(--color-accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .privacy-options {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          text-align: left;
          margin-bottom: var(--space-6);
        }

        .privacy-option {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .option-header h4 {
          margin: 0;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .privacy-option p {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-switch label {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--color-border);
          border-radius: var(--radius-full);
          transition: var(--transition-base);
        }

        .toggle-switch label:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
          background: white;
          border-radius: var(--radius-full);
          transition: var(--transition-base);
        }

        .toggle-switch input:checked + label {
          background: var(--color-accent);
        }

        .toggle-switch input:checked + label:before {
          transform: translateX(20px);
        }

        .next-steps {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          text-align: left;
          margin-bottom: var(--space-6);
        }

        .next-steps h4 {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .next-steps ul {
          margin: 0;
          padding-left: var(--space-5);
          color: var(--color-text-secondary);
        }

        .next-steps li {
          margin-bottom: var(--space-1);
        }

        .wizard-actions {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          margin-top: var(--space-8);
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .wizard-container {
            padding: var(--space-4);
          }

          .step-title {
            font-size: var(--font-size-2xl);
          }

          .step-description {
            font-size: var(--font-size-base);
          }
        }
      </style>

      <div class="wizard-container">
        <!-- Progress -->
        <div class="wizard-progress">
          ${this.steps
            .map(
              (step, index) => `
            <div class="progress-step ${index <= this.currentStep ? "completed" : ""} ${index === this.currentStep ? "current" : ""}"></div>
          `,
            )
            .join("")}
        </div>

        <!-- Content -->
        <div class="wizard-content">
          ${stepContent}
        </div>

        <!-- Actions -->
        <div class="wizard-actions">
          <ui-button 
            variant="ghost" 
            ${this.currentStep === 0 ? 'style="visibility: hidden;"' : ""}
            @click="${() => this.handlePrevious()}"
          >
            Previous
          </ui-button>
          
          <ui-button 
            variant="primary"
            @click="${() => this.handleNext()}"
          >
            ${this.currentStep === this.steps.length - 1 ? "Get Started" : "Next"}
          </ui-button>
        </div>
      </div>
    `;

    // Add event listeners for dynamic content
    this.addEventListeners();
  }

  private addEventListeners() {
    if (!this.shadowRoot) return;

    // Previous button
    const prevButton = this.shadowRoot.querySelector(
      '[data-action="previous"]',
    );
    if (prevButton) {
      prevButton.addEventListener("click", () => this.handlePrevious());
    }

    // Next button
    const nextButton = this.shadowRoot.querySelector('[data-action="next"]');
    if (nextButton) {
      nextButton.addEventListener("click", () => this.handleNext());
    }
  }
}

customElements.define("notention-account-wizard", AccountWizard);
