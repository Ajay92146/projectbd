/**
 * Blood Donation Website - Animations JavaScript
 * Handles advanced animations and interactive effects
 */

// Animation controller
class AnimationController {
    constructor() {
        this.observers = new Map();
        this.animatedElements = new Set();
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupParallaxEffects();
        this.setupHoverAnimations();
        this.setupLoadingAnimations();
    }
    
    /**
     * Setup intersection observer for scroll-triggered animations
     */
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: [0.1, 0.3, 0.5],
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.triggerAnimation(entry.target);
                    this.animatedElements.add(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe elements with animation classes
        const animatedElements = document.querySelectorAll(
            '.fade-in, .slide-in-left, .slide-in-right, .scale-in, .bounce-in, .animate-on-scroll'
        );
        
        animatedElements.forEach(element => {
            observer.observe(element);
        });
        
        this.observers.set('intersection', observer);
    }
    
    /**
     * Trigger animation for an element
     * @param {HTMLElement} element - Element to animate
     */
    triggerAnimation(element) {
        const delay = element.getAttribute('data-delay') || 0;
        
        setTimeout(() => {
            element.classList.add('in-view');
            
            // Add specific animation classes based on element type
            if (element.classList.contains('stat-number')) {
                this.animateCounter(element);
            }
            
            if (element.classList.contains('progress-bar')) {
                this.animateProgressBar(element);
            }
            
            // Trigger custom animation events
            element.dispatchEvent(new CustomEvent('animationTriggered', {
                detail: { element, delay }
            }));
        }, parseInt(delay));
    }
    
    /**
     * Animate counter numbers
     * @param {HTMLElement} element - Counter element
     */
    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target')) || 0;
        const duration = parseInt(element.getAttribute('data-duration')) || 2000;
        const easing = element.getAttribute('data-easing') || 'easeOutQuart';
        
        let start = 0;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply easing function
            const easedProgress = this.applyEasing(progress, easing);
            const current = Math.floor(start + (target - start) * easedProgress);
            
            element.textContent = this.formatNumber(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = this.formatNumber(target);
                element.classList.add('animation-complete');
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Animate progress bars
     * @param {HTMLElement} element - Progress bar element
     */
    animateProgressBar(element) {
        const progress = parseInt(element.getAttribute('data-progress')) || 100;
        const duration = parseInt(element.getAttribute('data-duration')) || 1500;
        
        element.style.setProperty('--progress', '0%');
        
        setTimeout(() => {
            element.style.transition = `--progress ${duration}ms ease-out`;
            element.style.setProperty('--progress', `${progress}%`);
        }, 100);
    }
    
    /**
     * Apply easing functions
     * @param {number} t - Progress (0-1)
     * @param {string} easing - Easing function name
     * @returns {number} - Eased value
     */
    applyEasing(t, easing) {
        const easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInQuart: t => t * t * t * t,
            easeOutQuart: t => 1 - (--t) * t * t * t,
            easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
            easeInBounce: t => 1 - easingFunctions.easeOutBounce(1 - t),
            easeOutBounce: t => {
                if (t < 1 / 2.75) return 7.5625 * t * t;
                if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        };
        
        return easingFunctions[easing] ? easingFunctions[easing](t) : t;
    }
    
    /**
     * Format numbers with commas
     * @param {number} num - Number to format
     * @returns {string} - Formatted number
     */
    formatNumber(num) {
        return num.toLocaleString();
    }
    
    /**
     * Setup scroll-based animations
     */
    setupScrollAnimations() {
        let ticking = false;
        
        const updateScrollAnimations = () => {
            const scrollY = window.pageYOffset;
            const windowHeight = window.innerHeight;
            
            // Parallax elements
            const parallaxElements = document.querySelectorAll('.parallax');
            parallaxElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const speed = parseFloat(element.getAttribute('data-speed')) || 0.5;
                
                if (rect.bottom >= 0 && rect.top <= windowHeight) {
                    const yPos = -(scrollY * speed);
                    element.style.transform = `translateY(${yPos}px)`;
                }
            });
            
            // Navbar background opacity
            const navbar = document.getElementById('navbar');
            if (navbar) {
                const opacity = Math.min(scrollY / 100, 0.95);
                navbar.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
            }
            
            ticking = false;
        };
        
        const requestScrollUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    }
    
    /**
     * Setup parallax effects
     */
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
            element.setAttribute('data-speed', speed);
            element.classList.add('parallax');
        });
    }
    
    /**
     * Setup hover animations
     */
    setupHoverAnimations() {
        // Add hover effects to cards
        const cards = document.querySelectorAll('.action-card, .feature-card, .donor-card, .stat-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });
        
        // Add ripple effect to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', this.createRippleEffect.bind(this));
        });
    }
    
    /**
     * Create ripple effect on button click
     * @param {Event} event - Click event
     */
    createRippleEffect(event) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        // Ensure button has relative positioning
        if (getComputedStyle(button).position === 'static') {
            button.style.position = 'relative';
        }
        
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    /**
     * Setup loading animations
     */
    setupLoadingAnimations() {
        // Stagger animations for lists
        const staggerContainers = document.querySelectorAll('.actions-grid, .features-grid, .faq-container');
        
        staggerContainers.forEach(container => {
            const items = container.children;
            Array.from(items).forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
                item.classList.add('stagger-item');
            });
        });
    }
    
    /**
     * Animate element entrance
     * @param {HTMLElement} element - Element to animate
     * @param {string} animation - Animation type
     * @param {number} delay - Animation delay
     */
    animateIn(element, animation = 'fadeIn', delay = 0) {
        element.style.animationDelay = `${delay}ms`;
        element.classList.add(animation);
    }
    
    /**
     * Animate element exit
     * @param {HTMLElement} element - Element to animate
     * @param {string} animation - Animation type
     * @returns {Promise} - Promise that resolves when animation completes
     */
    animateOut(element, animation = 'fadeOut') {
        return new Promise(resolve => {
            element.classList.add(animation);
            element.addEventListener('animationend', () => {
                resolve();
            }, { once: true });
        });
    }
    
    /**
     * Create floating animation
     * @param {HTMLElement} element - Element to float
     * @param {Object} options - Animation options
     */
    createFloatingAnimation(element, options = {}) {
        const {
            amplitude = 10,
            frequency = 2000,
            delay = 0
        } = options;
        
        let startTime = null;
        
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime - delay;
            
            const elapsed = currentTime - startTime;
            const y = Math.sin(elapsed / frequency * Math.PI * 2) * amplitude;
            
            element.style.transform = `translateY(${y}px)`;
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Cleanup animations and observers
     */
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.animatedElements.clear();
    }
}

// CSS for ripple animation
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

// Add ripple CSS to document
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Initialize animation controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.animationController = new AnimationController();
});

// Export for use in other files
window.AnimationController = AnimationController;
