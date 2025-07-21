
import '../ui/Button.css';

class AppButton extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'variant', 'size', 'disabled', 'loading', 'full-width', 'icon-only', 'tooltip', 'aria-label', 'type', 'ripple'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const label = this.getAttribute('label') || '';
        const variant = this.getAttribute('variant') || 'primary';
        const size = this.getAttribute('size') || 'medium';
        const disabled = this.hasAttribute('disabled');
        const loading = this.hasAttribute('loading');
        const fullWidth = this.hasAttribute('full-width');
        const iconOnly = this.hasAttribute('icon-only');
        const tooltip = this.getAttribute('tooltip');
        const ariaLabel = this.getAttribute('aria-label');
        const type = this.getAttribute('type') || 'button';
        const ripple = this.hasAttribute('ripple');

        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', '../ui/Button.css');

        const button = document.createElement('button');
        button.type = type;

        const classes = ['button', variant];
        if (size !== 'medium') classes.push(size);
        if (iconOnly) classes.push('icon-only');
        if (fullWidth) classes.push('full-width');
        if (loading) classes.push('loading');
        if (ripple) classes.push('ripple');
        button.className = classes.join(' ');

        if (!loading) {
            if (iconOnly) {
                button.innerHTML = label;
            } else {
                const textSpan = document.createElement('span');
                textSpan.className = 'button-text';
                textSpan.textContent = label;
                button.appendChild(textSpan);
            }
        }

        button.disabled = disabled || loading;
        if (tooltip) button.title = tooltip;
        if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
        if (loading) button.setAttribute('aria-busy', 'true');

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(button);
    }
}

customElements.define('app-button', AppButton);
