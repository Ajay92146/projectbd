// Modern Blood Donation Page Interactions (extracted from donate.html to satisfy CSP)

// FIXED: Add flag to indicate this script is handling form submissions
window.BloodConnect = window.BloodConnect || {};
window.BloodConnect.donatePageHandlersSetup = true;

class BloodDonationPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupNavbarEffects();
        this.setupFormInteractions();
        this.setupMobileMenu();
        this.setupParallaxEffects();
        this.initializeLoadingAnimation();
        this.setMinDate();
        this.setupDonorApplicationForm();
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
            if (currentScrollY > 100) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    setupFormInteractions() {
        const formFields = document.querySelectorAll('input, select');
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

    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('.parallax-element');
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.2);
                element.style.transform = `translateY(${rate * speed}px)`;
            });
        });
    }

    setMinDate() {
        const preferredDateField = document.getElementById('preferredDate');
        if (preferredDateField) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            preferredDateField.min = tomorrow.toISOString().split('T')[0];
        }
        const dobField = document.getElementById('dateOfBirth');
        if (dobField) {
            const eighteenYearsAgo = new Date();
            eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
            dobField.max = eighteenYearsAgo.toISOString().split('T')[0];
            const sixtyFiveYearsAgo = new Date();
            sixtyFiveYearsAgo.setFullYear(sixtyFiveYearsAgo.getFullYear() - 65);
            dobField.min = sixtyFiveYearsAgo.toISOString().split('T')[0];
        }
    }

    setupDonorApplicationForm() {
        const form = document.getElementById('donorApplicationForm');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitApplicationBtn');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting Application...';
                }
                document.querySelectorAll('.error-message').forEach(error => { error.textContent = ''; error.classList.remove('show'); });
                const formData = new FormData(form);
                const applicationData = {};
                for (let [key, value] of formData.entries()) {
                    applicationData[key] = key.includes('Consent') ? value === 'on' : String(value).trim();
                }
                if (!applicationData.healthConsent || !applicationData.dataConsent || !applicationData.contactConsent) {
                    throw new Error('All consent checkboxes must be checked to proceed.');
                }
                const requiredFields = ['firstName','lastName','dateOfBirth','gender','email','phoneNumber','city','state','address','bloodGroup','weight','emergencyContact','preferredDate','preferredTime'];
                const missingFields = requiredFields.filter(f => !applicationData[f]);
                if (missingFields.length > 0) throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
                const apiUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api/donors/apply`;
                const token = localStorage.getItem('token') || localStorage.getItem('bloodconnect_token') || localStorage.getItem('authToken');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const response = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(applicationData) });
                let result;
                const responseText = await response.text();
                try { result = JSON.parse(responseText); } catch { throw new Error(`Server returned invalid response (Status: ${response.status}). Please try again.`); }
                if (!response.ok) throw new Error(result.message || `Server error (${response.status}): ${response.statusText}`);
                if (result.success) {
                    this.showModal('🎉 Application Submitted Successfully!', `Thank you for applying to become a blood donor! Your application has been submitted successfully.<br><br><strong>Application ID:</strong> ${result.data.applicationId}<br><br>You will be contacted within 2-3 business days with next steps. Please keep this ID for your records.`, 'success');
                    form.reset();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    if (result.errors && Array.isArray(result.errors)) {
                        const errorMessages = [];
                        result.errors.forEach(error => {
                            const field = error.param || error.path;
                            const message = error.msg || error.message;
                            errorMessages.push(`${field}: ${message}`);
                            const errorElement = document.getElementById(`${field}-error`);
                            if (errorElement) { errorElement.textContent = message; errorElement.classList.add('show'); }
                        });
                        this.showModal('❌ Validation Error', `Please fix the following errors:<br><br>${errorMessages.join('<br>')}`, 'error');
                    } else {
                        this.showModal('❌ Application Failed', result.message || 'There was an error submitting your application. Please try again.', 'error');
                    }
                }
            } catch (error) {
                this.showModal('❌ Network Error', error.message || 'Unable to submit application. Please check your connection and try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    }

    showModal(title, message, type = 'info') {
        let modal = document.getElementById('applicationModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'applicationModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle"></h3>
                        <span class="modal-close" aria-label="Close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p id="modalMessage"></p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="applicationModalOk">OK</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            modal.querySelector('.modal-close').addEventListener('click', () => modal.style.display = 'none');
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
            modal.querySelector('#applicationModalOk').addEventListener('click', () => modal.style.display = 'none');
        }
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').innerHTML = message;
        modal.className = `modal ${type}`;
        modal.style.display = 'block';
    }

    initializeLoadingAnimation() {
        window.addEventListener('load', () => { document.body.classList.add('loaded'); });
    }

    wireModalClose() {
        const closeBtn = document.getElementById('successModalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const modal = document.getElementById('successModal');
                if (modal) modal.style.display = 'none';
            });
        }
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('successModal');
            if (e.target === modal) modal.style.display = 'none';
        });
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
    new BloodDonationPage();
    setupButtonEffects();
    setupSmoothScrolling();
    console.log('Donate page loaded - auth state manager active');
});