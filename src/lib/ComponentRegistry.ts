// Component Registry System for Alternative UI Components
// Enables switching between different component implementations

export interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  icon?: string;
  tags?: string[];
  createComponent: (...args: any[]) => HTMLElement;
}

export interface ComponentType {
  id: string;
  name: string;
  description: string;
  defaultVariant: string;
  variants: Map<string, ComponentVariant>;
}

class ComponentRegistryClass {
  private types: Map<string, ComponentType> = new Map();
  private preferences: Map<string, string> = new Map();

  /**
   * Register a new component type
   */
  registerType(type: ComponentType): void {
    this.types.set(type.id, type);

    // Set default preference if not exists
    if (!this.preferences.has(type.id)) {
      this.preferences.set(type.id, type.defaultVariant);
    }
  }

  /**
   * Register a component variant for a type
   */
  registerVariant(typeId: string, variant: ComponentVariant): void {
    const type = this.types.get(typeId);
    if (!type) {
      throw new Error(`Component type '${typeId}' not found`);
    }

    type.variants.set(variant.id, variant);
  }

  /**
   * Get the preferred variant for a component type
   */
  getPreferredVariant(typeId: string): ComponentVariant | null {
    const type = this.types.get(typeId);
    if (!type) return null;

    const preferredVariantId =
      this.preferences.get(typeId) || type.defaultVariant;
    return type.variants.get(preferredVariantId) || null;
  }

  /**
   * Set user's preferred variant for a component type
   */
  setPreference(typeId: string, variantId: string): void {
    const type = this.types.get(typeId);
    if (!type) {
      throw new Error(`Component type '${typeId}' not found`);
    }

    if (!type.variants.has(variantId)) {
      throw new Error(`Variant '${variantId}' not found for type '${typeId}'`);
    }

    this.preferences.set(typeId, variantId);
    this.savePreferences();
  }

  /**
   * Create a component instance using the preferred variant
   */
  createComponent(typeId: string, ...args: any[]): HTMLElement | null {
    const variant = this.getPreferredVariant(typeId);
    if (!variant) return null;

    try {
      return variant.createComponent(...args);
    } catch (error) {
      console.error(
        `Failed to create component ${typeId}:${variant.id}`,
        error,
      );
      return this.createFallbackComponent(typeId, error);
    }
  }

  /**
   * Get all available types
   */
  getTypes(): ComponentType[] {
    return Array.from(this.types.values());
  }

  /**
   * Get all variants for a type
   */
  getVariants(typeId: string): ComponentVariant[] {
    const type = this.types.get(typeId);
    return type ? Array.from(type.variants.values()) : [];
  }

  /**
   * Get current preferences
   */
  getPreferences(): Record<string, string> {
    return Object.fromEntries(this.preferences);
  }

  /**
   * Load preferences from storage
   */
  loadPreferences(): void {
    try {
      const stored = localStorage.getItem("notention-component-preferences");
      if (stored) {
        const prefs = JSON.parse(stored);
        this.preferences = new Map(Object.entries(prefs));
      }
    } catch (error) {
      console.warn("Failed to load component preferences:", error);
    }
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    try {
      const prefs = Object.fromEntries(this.preferences);
      localStorage.setItem(
        "notention-component-preferences",
        JSON.stringify(prefs),
      );
    } catch (error) {
      console.warn("Failed to save component preferences:", error);
    }
  }

  /**
   * Create fallback component when primary fails
   */
  private createFallbackComponent(typeId: string, error: any): HTMLElement {
    const fallback = document.createElement("div");
    fallback.className = "component-error";
    fallback.innerHTML = `
            <div style="padding: 20px; background: #fee; border: 1px solid #faa; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; color: #d00;">Component Error</h3>
                <p style="margin: 0 0 10px 0;">Failed to load ${typeId} component.</p>
                <details>
                    <summary>Error Details</summary>
                    <pre style="margin: 10px 0 0 0; font-size: 12px;">${error.toString()}</pre>
                </details>
            </div>
        `;
    return fallback;
  }

  /**
   * Reset all preferences to defaults
   */
  resetToDefaults(): void {
    this.preferences.clear();
    this.types.forEach((type) => {
      this.preferences.set(type.id, type.defaultVariant);
    });
    this.savePreferences();
  }
}

// Export singleton instance
export const ComponentRegistry = new ComponentRegistryClass();

// Auto-load preferences on module import
ComponentRegistry.loadPreferences();
