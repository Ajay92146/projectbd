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
            return `<div class="loading" style="text-align:center;padding:16px;color:#6b7280;"><i class="fas fa-spinner fa-spin"></i> ${message}</div>`;
        },
        empty(title = 'Nothing here', description = 'No data to show yet.') {
            return `<div class="empty" style="text-align:center;padding:24px;color:#6b7280;"><h3 style="margin-bottom:6px;">${title}</h3><p>${description}</p></div>`;
        },
        error(title = 'Error', description = 'Something went wrong.') {
            return `<div class="error" style="text-align:center;padding:24px;color:#991b1b;background:#fee2e2;border:1px solid #fecaca;border-radius:10px;"><h3 style="margin-bottom:6px;">${title}</h3><p>${description}</p></div>`;
        }
    };

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
    async function loadDonations(page = 1, limit = 10) {
        const container = qs('#donationsContent');
        if (!container) return;
        setContent(container, UI.loading('Loading your donations...'));
        try {
            const data = await api.get(`/api/profile/donations?page=${page}&limit=${limit}`);
            const donations = data?.data?.donations || [];
            if (!donations.length) { setContent(container, UI.empty('No Donations Yet', 'Start saving lives today!')); return; }
            const html = donations.map(d => {
                const status = (d.status || 'Recorded').toLowerCase();
                const date = d.donationDate ? new Date(d.donationDate).toLocaleDateString() : 'Not specified';
                const center = d.donationCenter?.name || 'Blood Bank';
                const city = d.city || '';
                const state = d.state || '';
                return `
                    <div class="item">
                        <div class="header">
                            <h4 style="margin:0;font-weight:600;">Blood Donation</h4>
                            <span class="badge">${status}</span>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;">
                            <p><strong>Date:</strong> ${date}</p>
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
    async function loadRequests(page = 1, limit = 10) {
        const container = qs('#requestsContent');
        if (!container) return;
        setContent(container, UI.loading('Loading your blood requests...'));
        try {
            const data = await api.get(`/api/profile/requests?page=${page}&limit=${limit}`);
            const requests = data?.data?.requests || [];
            if (!requests.length) { setContent(container, UI.empty('No Blood Requests', "You haven't made any requests yet.")); return; }
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
                return `
                    <div class="item">
                        <div class="header">
                            <h4 style="margin:0;font-weight:600;">${r.patientName || 'Patient'}</h4>
                            <span class="badge">${status}</span>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;">
                            <p><strong>Blood Group:</strong> ${blood}</p>
                            <p><strong>Required Units:</strong> ${units}</p>
                            <p><strong>Fulfilled:</strong> ${fulfilled}/${units}</p>
                            <p><strong>Hospital:</strong> ${hospital}</p>
                            <p><strong>Location:</strong> ${location || '—'}</p>
                            <p><strong>Request Date:</strong> ${reqDate}</p>
                            ${requiredBy ? `<p><strong>Required By:</strong> ${requiredBy}</p>` : ''}
                            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                        </div>
                    </div>`;
            }).join('');
            setContent(container, html);
        } catch (e) {
            setContent(container, UI.error('Unable to load requests', e.message));
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
            if (qs('#profileName')) qs('#profileName').value = name;
            if (qs('#profileEmail')) qs('#profileEmail').value = user.email || '';
            if (qs('#profilePhone')) qs('#profilePhone').value = user.phoneNumber || '';
            if (qs('#profileBloodType')) qs('#profileBloodType').value = user.bloodGroup || '';
        } catch (e) {
            // noop UI fallback
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
                bloodGroup: qs('#profileBloodType')?.value || ''
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
    });
})();


