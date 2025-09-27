// New Profile Script (from scratch) - self-contained and dependency-free
// Features: auth token handling, tabs, API client, loading/empty/error states,
// donations/requests pagination-ready, settings load/save, change-password

(function() {
    'use strict';

    // ------------------------- Utilities -------------------------
    const qs = (sel, root = document) => root.querySelector(sel);
    const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function getToken() {
        return localStorage.getItem('token') || localStorage.getItem('bloodconnect_token') || '';
    }

    function ensureAuth() {
        const token = getToken();
        if (!token) {
            window.location.href = 'login.html';
            return null;
        }
        return token;
    }

    function setContent(el, html) {
        if (el) el.innerHTML = html;
    }

        const UI = {
        loading(message = 'Loading...') {
            return `<div class="loading" style="text-align:center;padding:2rem;color:var(--gray-500);"><i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:1rem;color:var(--gray-400);"></i><br>${message}</div>`;
        },
        empty(title = 'Nothing here', description = 'No data to show yet.', actionButton = '') {
            return `<div class="empty-state" style="text-align:center;padding:3rem 1rem;color:var(--gray-500);">
                <i class="fas fa-inbox" style="font-size:4rem;margin-bottom:1rem;color:var(--gray-400);"></i>
                <h3 style="margin-bottom:0.5rem;color:var(--gray-600);">${title}</h3>
                <p>${description}</p>
                ${actionButton}
            </div>`;
        },
        error(title = 'Error', description = 'Something went wrong.') {
            return `<div class="error" style="text-align:center;padding:2rem;color:var(--danger-color);background:var(--gray-100);border:1px solid var(--gray-300);border-radius:var(--border-radius);">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:1rem;"></i><br>
                <h3 style="margin-bottom:0.5rem;">${title}</h3><p>${description}</p>
            </div>`;
        }
    };

        // MUST process replacements in provided order
        // NEVER make parallel calls on same file
        // MUST ensure earlier replacements don't interfere with later ones

    // ------------------------- API Client -------------------------
    const api = {
        async get(path) {
            const token = ensureAuth();
            if (!token) return null;
            const res = await fetch(path, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401) { localStorage.removeItem('token'); window.location.href = 'login.html'; return null; }
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res.json();
        },
        async put(path, body) {
            const token = ensureAuth();
            if (!token) return null;
            const res = await fetch(path, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res.status === 401) { localStorage.removeItem('token'); window.location.href = 'login.html'; return null; }
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res.json();
        },
        async delete(path) {
            const token = ensureAuth();
            if (!token) return null;
            const res = await fetch(path, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401) { localStorage.removeItem('token'); window.location.href = 'login.html'; return null; }
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res.json();
        }
    };

    // ------------------------- Tabs Controller -------------------------
    function initTabs() {
        const buttons = qsa('.tab-button');
        const panes = qsa('.tab-content');

        function show(name) {
            panes.forEach(p => p.style.display = 'none');
            panes.forEach(p => p.classList.remove('active'));
            buttons.forEach(b => b.classList.remove('active'));
            const pane = qs(`#${name}`);
            const btn = buttons.find(b => b.getAttribute('data-tab') === name);
            if (pane) { pane.style.display = 'block'; pane.classList.add('active'); }
            if (btn) btn.classList.add('active');
            if (name === 'donations') loadDonations();
            if (name === 'requests') loadRequests();
        }

        buttons.forEach(b => b.addEventListener('click', () => show(b.getAttribute('data-tab'))));
        // Default
        show('donations');
    }

    // ------------------------- Donations -------------------------
    let donationsPage = 1; let donationsFilter = '';
    async function loadDonations(page = 1, limit = 10) {
        const container = qs('#donationsContent');
        if (!container) return;
        setContent(container, UI.loading('Loading your donations...'));
        try {
            const data = await api.get(`/api/profile/donations?page=${page}&limit=${limit}`);
            const donations = data?.data?.donations || [];
            const filtered = donationsFilter ? donations.filter(d => (d.status||'').toLowerCase() === donationsFilter) : donations;
            if (!filtered.length) { 
                const actionButton = '<a href="donate.html" class="btn btn-primary" style="margin-top: 1rem;"><i class="fas fa-plus"></i> Donate Now</a>';
                const statusInfo = donationsFilter ? 
                    `<p style="color: #666; margin-top: 1rem;">No donations found with status "${donationsFilter}". Try changing the filter or submit a new donation.</p>` :
                    '';
                setContent(container, UI.empty('No Donations Yet', 'Start making a difference by donating blood today!' + statusInfo, actionButton)); 
                return; 
            }
            const html = filtered.map(d => {
                const status = (d.status || 'Recorded').toLowerCase();
                const date = d.donationDate ? new Date(d.donationDate).toLocaleDateString() : 'Not specified';
                const center = d.donationCenter?.name || 'Blood Bank';
                const city = d.city || '';
                const state = d.state || '';
                
                // Status explanation
                const statusExplanation = {
                    'pending': 'Your donation application is being reviewed by our blood bank staff.',
                    'completed': 'Your donation has been successfully completed and approved.',
                    'cancelled': 'This donation was cancelled or rejected.',
                    'recorded': 'Your donation has been recorded in our system.'
                };
                
                return `
                    <div class="item-card">
                        <div class="item-header">
                            <div>
                                <h4 class="item-title">Blood Donation</h4>
                                <div class="item-meta">Donated on ${date}</div>
                            </div>
                            <div style="display: flex; gap: 0.75rem; align-items: center;">
                                <span class="status-badge status-${status}" title="${statusExplanation[status] || 'Status information'}">${status}</span>
                                ${status === 'pending' ? `
                                    <button class="btn-cancel-donation" onclick="cancelDonation('${d._id}')" 
                                        style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; 
                                               border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer;
                                               font-size: 0.85rem; font-weight: 600; transition: all 0.3s;
                                               display: flex; align-items: center; gap: 0.5rem;"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(220, 53, 69, 0.3)';"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
                            <p><strong>Blood Group:</strong> ${d.bloodGroup || 'N/A'}</p>
                            <p><strong>Units:</strong> ${d.unitsCollected || 1}</p>
                            <p><strong>Center:</strong> ${center}</p>
                            <p><strong>Location:</strong> ${city}${city && state ? ', ' : ''}${state}</p>
                        </div>
                    </div>`;
            }).join('');
            setContent(container, html);
        } catch (e) {
            setContent(container, UI.error('Unable to load donations', e.message));
        }
    }

    // ------------------------- Requests -------------------------
    let requestsPage = 1; let requestsStatus = '';
    async function loadRequests(page = 1, limit = 10) {
        const container = qs('#requestsContent');
        if (!container) return;
        setContent(container, UI.loading('Loading your blood requests...'));
        try {
            const statusParam = requestsStatus ? `&status=${encodeURIComponent(requestsStatus)}` : '';
            const data = await api.get(`/api/profile/requests?page=${page}&limit=${limit}${statusParam}`);
            const requests = data?.data?.requests || [];
            if (!requests.length) { 
                const actionButton = '<a href="request.html" class="btn btn-primary" style="margin-top: 1rem;"><i class="fas fa-plus"></i> Create Request</a>';
                setContent(container, UI.empty('No Blood Requests', "You haven't made any requests yet.", actionButton)); 
                return; 
            }
            const html = requests.map(r => {
                const status = (r.status || 'Pending').toLowerCase().replace(/\s+/g,'-');
                const reqDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—';
                const requiredBy = r.requiredBy ? new Date(r.requiredBy).toLocaleDateString() : '';
                const blood = r.bloodGroup || r.bloodType || 'N/A';
                const units = r.requiredUnits || r.units || 1;
                const fulfilled = r.fulfilledUnits || 0;
                const hospital = r.hospitalName || r.hospital?.name || '—';
                const location = r.location || `${r.city||''}${r.city&&r.state?', ':''}${r.state||''}`;
                const notes = r.additionalNotes || '';
                
                // Blood bank contact information if request is accepted
                let bloodBankContactInfo = '';
                if (r.hasBloodBankContact && r.bloodBankContactInfo) {
                    const contact = r.bloodBankContactInfo;
                    const acceptedDate = contact.acceptedDate ? new Date(contact.acceptedDate).toLocaleDateString() : '';
                    const fulfillmentDate = contact.fulfillmentDate ? new Date(contact.fulfillmentDate).toLocaleDateString() : '';
                    
                    bloodBankContactInfo = `
                        <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #e8f5e8, #f0f8f0); 
                                    border-left: 4px solid #28a745; border-radius: 8px;">
                            <h5 style="color: #28a745; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-hospital"></i> Blood Bank Contact Information
                            </h5>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                <p><strong>Blood Bank:</strong> ${contact.name || 'N/A'}</p>
                                <p><strong>Contact Person:</strong> ${contact.contactPerson || 'N/A'}</p>
                                <p><strong>Phone:</strong> 
                                    ${contact.contactNumber ? `<a href="tel:${contact.contactNumber}" style="color: #28a745; font-weight: 600;">${contact.contactNumber}</a>` : 'N/A'}
                                </p>
                                <p><strong>Email:</strong> 
                                    ${contact.email ? `<a href="mailto:${contact.email}" style="color: #28a745; font-weight: 600;">${contact.email}</a>` : 'N/A'}
                                </p>
                                ${acceptedDate ? `<p><strong>Accepted On:</strong> ${acceptedDate}</p>` : ''}
                                ${fulfillmentDate ? `<p><strong>Fulfilled On:</strong> ${fulfillmentDate}</p>` : ''}
                            </div>
                            ${contact.address ? `<p style="margin-top: 10px;"><strong>Address:</strong> ${contact.address}</p>` : ''}
                            ${contact.notes ? `<p style="margin-top: 10px; font-style: italic;"><strong>Notes:</strong> ${contact.notes}</p>` : ''}
                            ${contact.fulfillmentNotes ? `<p style="margin-top: 10px; font-style: italic;"><strong>Fulfillment Notes:</strong> ${contact.fulfillmentNotes}</p>` : ''}
                        </div>
                    `;
                }
                
                return `
                    <div class="item-card">
                        <div class="item-header">
                            <div>
                                <h4 class="item-title">${r.patientName || 'Patient'}</h4>
                                <div class="item-meta">Requested on ${reqDate}</div>
                            </div>
                            <div style="display: flex; gap: 0.75rem; align-items: center;">
                                <span class="status-badge status-${status}">${r.status || 'Pending'}</span>
                                ${['pending', 'in-progress'].includes(status) ? `
                                    <button class="btn-cancel-request" onclick="cancelRequest('${r._id}')" 
                                        style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; 
                                               border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer;
                                               font-size: 0.85rem; font-weight: 600; transition: all 0.3s;
                                               display: flex; align-items: center; gap: 0.5rem;"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(220, 53, 69, 0.3)';"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
                            <p><strong>Blood Group:</strong> ${blood}</p>
                            <p><strong>Required Units:</strong> ${units}</p>
                            <p><strong>Fulfilled:</strong> ${fulfilled}/${units}</p>
                            <p><strong>Hospital:</strong> ${hospital}</p>
                            <p><strong>Location:</strong> ${location || '—'}</p>
                            ${requiredBy ? `<p><strong>Required By:</strong> ${requiredBy}</p>` : ''}
                            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                        </div>
                        ${bloodBankContactInfo}
                    </div>`;
            }).join('');
            setContent(container, html);
        } catch (e) {
            setContent(container, UI.error('Unable to load requests', e.message));
        }
    }

    // ------------------------- Load Statistics -------------------------
    async function loadStatistics() {
        try {
            // Load donations count
            const donationsData = await api.get('/api/profile/donations?page=1&limit=1000');
            const totalDonations = donationsData?.data?.donations?.length || 0;
            if (qs('#totalDonations')) qs('#totalDonations').textContent = totalDonations;
            
            // Load requests count
            const requestsData = await api.get('/api/profile/requests?page=1&limit=1000');
            const totalRequests = requestsData?.data?.requests?.length || 0;
            if (qs('#totalRequests')) qs('#totalRequests').textContent = totalRequests;
            
            // Calculate lives impacted (assuming 1 donation can help 3 people)
            const livesImpacted = totalDonations * 3;
            if (qs('#livesImpacted')) qs('#livesImpacted').textContent = livesImpacted;
            
        } catch (e) {
            console.error('Failed to load statistics:', e);
        }
    }

    // ------------------------- Settings -------------------------
    async function loadProfile() {
        const token = ensureAuth();
        if (!token) return;
        try {
            const res = await fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            const result = await res.json();
            const user = result?.data?.user || {};
            const name = [user.firstName||'', user.lastName||''].join(' ').trim();
            
            // Update form fields
            if (qs('#profileName')) qs('#profileName').value = name;
            if (qs('#profileEmail')) qs('#profileEmail').value = user.email || '';
            if (qs('#profileEmailInput')) qs('#profileEmailInput').value = user.email || '';
            if (qs('#profilePhone')) qs('#profilePhone').value = user.phoneNumber || '';
            if (qs('#profileBloodType')) qs('#profileBloodType').value = user.bloodGroup || '';
            if (qs('#profileAddress')) qs('#profileAddress').value = user.address || '';
            if (qs('#profileCity')) qs('#profileCity').value = user.city || '';
            
            // Update profile header
            if (qs('#profileDisplayName')) qs('#profileDisplayName').textContent = name || 'User';
            if (qs('#profileEmail')) qs('#profileEmail').textContent = user.email || '';
            
            // Update user avatar initials
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
            if (qs('#profileAvatar')) qs('#profileAvatar').innerHTML = initials;
            if (qs('#userAvatar')) qs('#userAvatar').innerHTML = initials;
            
            // Update member since
            if (user.createdAt && qs('#memberSince')) {
                const year = new Date(user.createdAt).getFullYear();
                qs('#memberSince').textContent = year;
            }
        } catch (e) {
            console.error('Failed to load profile:', e);
        }
    }

    function initSettings() {
        const editBtn = qs('#editBtn');
        const saveBtn = qs('#saveBtn');
        const cancelBtn = qs('#cancelBtn');
        const inputs = () => qsa('#settingsForm input, #settingsForm select');

        function setDisabled(disabled) { inputs().forEach(i => i.disabled = disabled); }

        if (editBtn) editBtn.addEventListener('click', () => { setDisabled(false); editBtn.style.display='none'; saveBtn.style.display='inline-block'; cancelBtn.style.display='inline-block'; });
        if (cancelBtn) cancelBtn.addEventListener('click', () => { setDisabled(true); editBtn.style.display='inline-block'; saveBtn.style.display='none'; cancelBtn.style.display='none'; loadProfile(); });
        if (saveBtn) saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const fullName = (qs('#profileName')?.value || '').trim();
            const [firstName, ...rest] = fullName.split(' ');
            const payload = {
                firstName: firstName || '',
                lastName: rest.join(' '),
                phoneNumber: qs('#profilePhone')?.value || '',
                bloodGroup: qs('#profileBloodType')?.value || '',
                address: qs('#profileAddress')?.value || '',
                city: qs('#profileCity')?.value || ''
            };
            // remove empty
            Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
            try {
                await api.put('/api/auth/profile', payload);
                setDisabled(true);
                editBtn.style.display='inline-block'; saveBtn.style.display='none'; cancelBtn.style.display='none';
                loadProfile();
                alert('Profile updated successfully');
            } catch (e) {
                alert('Failed to update profile: ' + e.message);
            }
        });

        setDisabled(true);
        loadProfile();
    }

    // ------------------------- Change Password -------------------------
    function initChangePassword() {
        const form = qs('#changePasswordForm');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = qs('#currentPassword')?.value || '';
            const newPassword = qs('#newPassword')?.value || '';
            const confirmPassword = qs('#confirmPassword')?.value || '';
            if (newPassword.length < 6) { alert('New password must be at least 6 characters'); return; }
            if (newPassword !== confirmPassword) { alert('New passwords do not match'); return; }
            try {
                await api.put('/api/auth/change-password', { currentPassword, newPassword, confirmPassword });
                form.reset();
                alert('Password changed successfully');
            } catch (e) {
                alert('Failed to change password: ' + e.message);
            }
        });
    }

    // ------------------------- Init -------------------------
    document.addEventListener('DOMContentLoaded', function() {
        if (!ensureAuth()) return;
        initTabs();
        initSettings();
        initChangePassword();
        loadStatistics(); // Load profile statistics

        // Filters and pagination bindings
        qsa('[data-status]').forEach(chip => chip.addEventListener('click', () => {
            qsa('[data-status]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            requestsStatus = chip.getAttribute('data-status') || '';
            requestsPage = 1;
            loadRequests(requestsPage);
        }));
        const reqMore = qs('#requestsMore');
        if (reqMore) reqMore.addEventListener('click', () => { requestsPage += 1; loadRequests(requestsPage); });

        qsa('[data-donation-filter]').forEach(chip => chip.addEventListener('click', () => {
            qsa('[data-donation-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            donationsFilter = chip.getAttribute('data-donation-filter');
            if (donationsFilter === 'all') donationsFilter = '';
            donationsPage = 1;
            loadDonations(donationsPage);
        }));
        const donMore = qs('#donationsMore');
        if (donMore) donMore.addEventListener('click', () => { donationsPage += 1; loadDonations(donationsPage); });
        
        // User avatar dropdown functionality (if needed)
        const userAvatar = qs('#userAvatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', function() {
                // Could add dropdown menu functionality here
                console.log('User avatar clicked');
            });
        }
    });

    // ------------------------- Cancel Functions -------------------------
    // Note: Enhanced cancel functions are now defined in the HTML script tag
    // to provide better UI/UX with modal confirmations and loading states
    
    // Make necessary functions globally accessible for cancel operations
    window.api = api;
    window.loadDonations = loadDonations;
    window.loadRequests = loadRequests;
})();


