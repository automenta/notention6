// Component Switcher UI - Allows users to choose between component variants
import { ComponentRegistry, ComponentType, ComponentVariant } from '../lib/ComponentRegistry';
import { createButton } from './Button';
import './ComponentSwitcher.css';

export function createComponentSwitcher(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'component-switcher';

    // Header
    const header = document.createElement('div');
    header.className = 'component-switcher-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Component Preferences';
    title.className = 'component-switcher-title';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Choose your preferred UI components for different parts of the application';
    subtitle.className = 'component-switcher-subtitle';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    container.appendChild(header);

    // Component types
    const types = ComponentRegistry.getTypes();
    const preferences = ComponentRegistry.getPreferences();

    if (types.length === 0) {
        const noComponents = document.createElement('div');
        noComponents.className = 'no-components';
        noComponents.textContent = 'No alternative components available';
        container.appendChild(noComponents);
        return container;
    }

    types.forEach(type => {
        const typeSection = createTypeSection(type, preferences[type.id]);
        container.appendChild(typeSection);
    });

    // Reset button
    const resetSection = document.createElement('div');
    resetSection.className = 'reset-section';
    
    const resetButton = createButton({
        label: '🔄 Reset to Defaults',
        onClick: () => {
            ComponentRegistry.resetToDefaults();
            // Refresh the switcher
            const parent = container.parentNode;
            if (parent) {
                const newSwitcher = createComponentSwitcher();
                parent.replaceChild(newSwitcher, container);
            }
        },
        variant: 'secondary'
    });
    
    resetSection.appendChild(resetButton);
    container.appendChild(resetSection);

    return container;
}

function createTypeSection(type: ComponentType, currentVariantId: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'component-type-section';

    // Type header
    const typeHeader = document.createElement('div');
    typeHeader.className = 'component-type-header';
    
    const typeName = document.createElement('h4');
    typeName.textContent = type.name;
    typeName.className = 'component-type-name';
    
    const typeDesc = document.createElement('p');
    typeDesc.textContent = type.description;
    typeDesc.className = 'component-type-description';
    
    typeHeader.appendChild(typeName);
    typeHeader.appendChild(typeDesc);
    section.appendChild(typeHeader);

    // Variants
    const variantsContainer = document.createElement('div');
    variantsContainer.className = 'component-variants';

    const variants = ComponentRegistry.getVariants(type.id);
    
    variants.forEach(variant => {
        const variantOption = createVariantOption(type.id, variant, currentVariantId === variant.id);
        variantsContainer.appendChild(variantOption);
    });

    section.appendChild(variantsContainer);
    return section;
}

function createVariantOption(typeId: string, variant: ComponentVariant, isSelected: boolean): HTMLElement {
    const option = document.createElement('div');
    option.className = `component-variant-option ${isSelected ? 'selected' : ''}`;
    option.addEventListener('click', () => {
        ComponentRegistry.setPreference(typeId, variant.id);
        
        // Update UI
        const container = option.closest('.component-variants');
        if (container) {
            container.querySelectorAll('.component-variant-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
        }
    });

    // Icon
    const icon = document.createElement('div');
    icon.className = 'variant-icon';
    icon.textContent = variant.icon || '🔧';
    
    // Content
    const content = document.createElement('div');
    content.className = 'variant-content';
    
    const name = document.createElement('div');
    name.className = 'variant-name';
    name.textContent = variant.name;
    
    const description = document.createElement('div');
    description.className = 'variant-description';
    description.textContent = variant.description;
    
    content.appendChild(name);
    content.appendChild(description);

    // Tags
    if (variant.tags && variant.tags.length > 0) {
        const tags = document.createElement('div');
        tags.className = 'variant-tags';
        
        variant.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'variant-tag';
            tagSpan.textContent = tag;
            tags.appendChild(tagSpan);
        });
        
        content.appendChild(tags);
    }

    // Selected indicator
    const indicator = document.createElement('div');
    indicator.className = 'variant-indicator';
    indicator.textContent = isSelected ? '✓' : '';

    option.appendChild(icon);
    option.appendChild(content);
    option.appendChild(indicator);

    return option;
}

export function createQuickComponentSwitcher(typeId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'quick-component-switcher';

    const variants = ComponentRegistry.getVariants(typeId);
    const currentPreference = ComponentRegistry.getPreferences()[typeId];

    if (variants.length <= 1) {
        return container; // No point showing switcher for single variant
    }

    const select = document.createElement('select');
    select.className = 'component-quick-select';
    
    variants.forEach(variant => {
        const option = document.createElement('option');
        option.value = variant.id;
        option.textContent = `${variant.icon || ''} ${variant.name}`.trim();
        option.selected = variant.id === currentPreference;
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        ComponentRegistry.setPreference(typeId, select.value);
        // Emit custom event for components to refresh
        window.dispatchEvent(new CustomEvent('componentPreferenceChanged', {
            detail: { typeId, variantId: select.value }
        }));
    });

    container.appendChild(select);
    return container;
}