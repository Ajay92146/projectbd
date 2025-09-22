// Modern Contact Page Interactions (extracted to satisfy CSP)

class ModernContactPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupNavbarEffects();
        this.setupFormInteractions();
        this.setupMobileMenu();
        this.setupContactForm();
        this.initializeLoadingAnimation();
        this.wireModalClose();
    }

    setupScrollAnimations() {
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
        }, observerOptions);
        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => observer.observe(el));
    }

    setupNavbarEffects() {
        const navbar = document.querySelector('.navbar');
        window.addEventListener('scroll', () => {
            if (!navbar) return;
            const currentScrollY = window.scrollY;
            if (currentScrollY > 100) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
        });
    }

    setupFormInteractions() {
        const formFields = document.querySelectorAll('input, select, textarea');
        formFields.forEach(field => {
            field.addEventListener('focus', function() { this.parentElement.classList.add('focused'); });
            field.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
                if (this.value.trim() !== '') this.parentElement.classList.add('filled');
                else this.parentElement.classList.remove('filled');
            });
        });
    }

    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    setupContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('contactSubmitBtn');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                submitBtn.disabled = true;
            }
            if (this.validateForm()) {
                try {
                    const formData = {
                        name: document.getElementById('name').value.trim(),
                        email: document.getElementById('email').value.trim(),
                        subject: document.getElementById('subject').value.trim(),
                        message: document.getElementById('message').value.trim()
                    };
                    const apiUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api/contact/submit`;
                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
                    const result = await response.json();
                    if (result.success) { this.showSuccessMessage(); form.reset(); }
                    else { this.showErrorMessage(result.message || 'Failed to send message. Please try again.'); }
                } catch (error) {
                    this.showErrorMessage('Network error. Please check your connection and try again.');
                }
            }
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    validateForm() {
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const subject = document.getElementById('subject');
        const message = document.getElementById('message');
        let isValid = true;
        if (!name.value.trim()) { this.showError('name-error', 'Name is required'); isValid = false; } else { this.hideError('name-error'); }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) { this.showError('email-error', 'Email is required'); isValid = false; }
        else if (!emailRegex.test(email.value)) { this.showError('email-error', 'Please enter a valid email'); isValid = false; }
        else { this.hideError('email-error'); }
        if (!subject.value.trim()) { this.showError('subject-error', 'Subject is required'); isValid = false; } else { this.hideError('subject-error'); }
        if (!message.value.trim()) { this.showError('message-error', 'Message is required'); isValid = false; }
        else if (message.value.trim().length < 10) { this.showError('message-error', 'Message must be at least 10 characters'); isValid = false; }
        else { this.hideError('message-error'); }
        return isValid;
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) { errorElement.textContent = message; errorElement.classList.add('show'); }
    }
    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) { errorElement.classList.remove('show'); }
    }

    showSuccessMessage() {
        const modal = document.getElementById('successModal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        if (modal) {
            modalTitle.innerHTML = '<i class="fas fa-check-circle"></i> Message Sent!';
            modalMessage.textContent = 'Thank you for contacting us. We will get back to you soon!';
            modal.style.display = 'block';
            setTimeout(() => { modal.style.display = 'none'; }, 3000);
        }
    }

    showErrorMessage(message) {
        const modal = document.getElementById('successModal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        if (modal) {
            modalTitle.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error';
            modalMessage.textContent = message;
            modal.style.display = 'block';
            setTimeout(() => { modal.style.display = 'none'; }, 5000);
        }
    }

    initializeLoadingAnimation() { window.addEventListener('load', () => { document.body.classList.add('loaded'); }); }

    wireModalClose() {
        const closeBtn = document.getElementById('successModalClose');
        if (closeBtn) closeBtn.addEventListener('click', () => { const m = document.getElementById('successModal'); if (m) m.style.display = 'none'; });
        window.addEventListener('click', (e) => { const m = document.getElementById('successModal'); if (e.target === m) m.style.display = 'none'; });
    }
}

function setupButtonEffects() {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() { this.style.transform = 'translateY(-3px) scale(1.02)'; });
        btn.addEventListener('mouseleave', function() { this.style.transform = 'translateY(0) scale(1)'; });
    });
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    new ModernContactPage();
    setupButtonEffects();
    setupSmoothScrolling();
    console.log('Contact page loaded - auth state manager active');
});


