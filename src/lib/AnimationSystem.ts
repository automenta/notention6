// Communicative Animation & Feedback System
import "./AnimationSystem.css";

export interface AnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number | "infinite";
  fillMode?: "forwards" | "backwards" | "both" | "none";
}

export interface FeedbackOptions {
  type: "success" | "error" | "warning" | "info" | "loading" | "thinking";
  message?: string;
  duration?: number;
  position?: "top" | "bottom" | "inline";
  animated?: boolean;
}

export class AnimationSystem {
  // Entrance animations
  static fadeIn(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { opacity: 0, transform: "translateY(-10px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], {
      duration: options.duration || 300,
      easing: options.easing || "cubic-bezier(0.4, 0, 0.2, 1)",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  static slideInFromLeft(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { transform: "translateX(-100%)", opacity: 0 },
      { transform: "translateX(0)", opacity: 1 }
    ], {
      duration: options.duration || 400,
      easing: options.easing || "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  static slideInFromRight(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { transform: "translateX(100%)", opacity: 0 },
      { transform: "translateX(0)", opacity: 1 }
    ], {
      duration: options.duration || 400,
      easing: options.easing || "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  static scaleIn(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { transform: "scale(0.8)", opacity: 0 },
      { transform: "scale(1)", opacity: 1 }
    ], {
      duration: options.duration || 250,
      easing: options.easing || "cubic-bezier(0.34, 1.56, 0.64, 1)",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  static bounceIn(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { transform: "scale(0.3)", opacity: 0 },
      { transform: "scale(1.05)" },
      { transform: "scale(0.9)" },
      { transform: "scale(1)", opacity: 1 }
    ], {
      duration: options.duration || 600,
      easing: options.easing || "ease-out",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  // Exit animations
  static fadeOut(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(10px)" }
    ], {
      duration: options.duration || 250,
      easing: options.easing || "cubic-bezier(0.4, 0, 1, 1)",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  static slideOutToLeft(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { transform: "translateX(0)", opacity: 1 },
      { transform: "translateX(-100%)", opacity: 0 }
    ], {
      duration: options.duration || 300,
      easing: options.easing || "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  static scaleOut(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(0.8)", opacity: 0 }
    ], {
      duration: options.duration || 200,
      easing: options.easing || "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  // Attention-seeking animations
  static pulse(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.05)" },
      { transform: "scale(1)" }
    ], {
      duration: options.duration || 1500,
      easing: options.easing || "ease-in-out",
      iterations: options.iterations || "infinite",
      delay: options.delay || 0
    });
  }

  static shake(element: HTMLElement, options: AnimationOptions = {}): Animation {
    return element.animate([
      { transform: "translateX(0)" },
      { transform: "translateX(-10px)" },
      { transform: "translateX(10px)" },
      { transform: "translateX(-10px)" },
      { transform: "translateX(10px)" },
      { transform: "translateX(0)" }
    ], {
      duration: options.duration || 500,
      easing: options.easing || "ease-in-out",
      delay: options.delay || 0,
      fill: options.fillMode || "forwards"
    });
  }

  static glow(element: HTMLElement, color: string = "#0066ff", options: AnimationOptions = {}): Animation {
    return element.animate([
      { boxShadow: `0 0 5px ${color}` },
      { boxShadow: `0 0 20px ${color}, 0 0 30px ${color}` },
      { boxShadow: `0 0 5px ${color}` }
    ], {
      duration: options.duration || 2000,
      easing: options.easing || "ease-in-out",
      iterations: options.iterations || "infinite",
      delay: options.delay || 0
    });
  }

  static typewriter(element: HTMLElement, text: string, options: AnimationOptions = {}): void {
    const duration = options.duration || text.length * 50;
    const chars = text.split("");
    element.textContent = "";
    
    chars.forEach((char, index) => {
      setTimeout(() => {
        element.textContent += char;
        if (index === chars.length - 1) {
          element.classList.add("typing-complete");
        }
      }, (duration / chars.length) * index);
    });
  }

  // Interactive feedback animations
  static clickFeedback(element: HTMLElement): void {
    element.style.transform = "scale(0.95)";
    element.style.transition = "transform 0.1s ease";
    
    setTimeout(() => {
      element.style.transform = "scale(1)";
      setTimeout(() => {
        element.style.transition = "";
      }, 100);
    }, 100);
  }

  static hoverLift(element: HTMLElement): void {
    element.addEventListener("mouseenter", () => {
      element.style.transform = "translateY(-2px)";
      element.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
      element.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.15)";
    });

    element.addEventListener("mouseleave", () => {
      element.style.transform = "translateY(0)";
      element.style.boxShadow = "";
    });
  }

  // State transition animations
  static morphState(element: HTMLElement, fromState: any, toState: any, options: AnimationOptions = {}): Animation {
    const keyframes = [fromState, toState];
    return element.animate(keyframes, {
      duration: options.duration || 300,
      easing: options.easing || "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: options.fillMode || "forwards"
    });
  }

  // Loading animations
  static createLoadingSpinner(parent: HTMLElement): HTMLElement {
    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "spinner-dot";
      dot.style.animationDelay = `${i * 0.16}s`;
      spinner.appendChild(dot);
    }
    
    parent.appendChild(spinner);
    return spinner;
  }

  static createThinkingAnimation(parent: HTMLElement): HTMLElement {
    const thinking = document.createElement("div");
    thinking.className = "thinking-animation";
    thinking.innerHTML = `
      <div class="thinking-bubble">
        <div class="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    parent.appendChild(thinking);
    return thinking;
  }

  // Progress animations
  static animateProgress(progressBar: HTMLElement, fromPercent: number, toPercent: number, duration: number = 1000): void {
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentPercent = fromPercent + (toPercent - fromPercent) * progress;
      progressBar.style.width = `${currentPercent}%`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  // Notification animations
  static showNotification(options: FeedbackOptions): HTMLElement {
    const notification = document.createElement("div");
    notification.className = `notification notification-${options.type}`;
    
    if (options.animated) {
      notification.classList.add("animated");
    }
    
    const icon = this.getNotificationIcon(options.type);
    const message = options.message || "";
    
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-message">${message}</div>
      <button class="notification-close" aria-label="Close">×</button>
    `;
    
    // Position notification
    if (options.position === "inline") {
      return notification;
    }
    
    const container = document.querySelector(".notification-container") || this.createNotificationContainer();
    container.appendChild(notification);
    
    // Entrance animation
    this.slideInFromRight(notification);
    
    // Auto-remove after duration
    if (options.duration && options.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, options.duration);
    }
    
    // Close button handler
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn?.addEventListener("click", () => {
      this.removeNotification(notification);
    });
    
    return notification;
  }

  private static removeNotification(notification: HTMLElement): void {
    const exitAnimation = this.slideOutToLeft(notification);
    exitAnimation.addEventListener("finish", () => {
      notification.remove();
    });
  }

  private static createNotificationContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = "notification-container";
    document.body.appendChild(container);
    return container;
  }

  private static getNotificationIcon(type: string): string {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
      loading: "⏳",
      thinking: "🤔"
    };
    return icons[type as keyof typeof icons] || "ℹ️";
  }

  // Staggered animations for lists
  static staggeredEntrance(elements: HTMLElement[], delay: number = 100): void {
    elements.forEach((element, index) => {
      setTimeout(() => {
        this.fadeIn(element, { delay: 0 });
      }, index * delay);
    });
  }

  // Utility functions
  static addRippleEffect(element: HTMLElement): void {
    element.addEventListener("click", (e) => {
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      
      element.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  static addParallaxEffect(element: HTMLElement, intensity: number = 0.5): void {
    window.addEventListener("scroll", () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -intensity;
      element.style.transform = `translateY(${rate}px)`;
    });
  }
}

// Utility functions for common patterns
export function animateOnScroll(elements: HTMLElement[], threshold: number = 0.1): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        AnimationSystem.fadeIn(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold });

  elements.forEach((element) => {
    observer.observe(element);
  });
}

export function createFeedbackSystem() {
  return {
    success: (message: string, duration: number = 3000) => 
      AnimationSystem.showNotification({ type: "success", message, duration, animated: true }),
    
    error: (message: string, duration: number = 5000) => 
      AnimationSystem.showNotification({ type: "error", message, duration, animated: true }),
    
    warning: (message: string, duration: number = 4000) => 
      AnimationSystem.showNotification({ type: "warning", message, duration, animated: true }),
    
    info: (message: string, duration: number = 3000) => 
      AnimationSystem.showNotification({ type: "info", message, duration, animated: true }),
    
    loading: (message: string = "Loading...") => 
      AnimationSystem.showNotification({ type: "loading", message, duration: 0, animated: true }),
    
    thinking: (message: string = "AI is thinking...") => 
      AnimationSystem.showNotification({ type: "thinking", message, duration: 0, animated: true })
  };
}