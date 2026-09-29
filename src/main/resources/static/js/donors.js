/**
 * BloodLink — Donors Registry Controller
 */

if (typeof renderAvatar !== 'function') {
    window.renderAvatar = function(name, size = 36) {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        const initials = parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return `<div class="donor-avatar" style="width:${size}px; height:${size}px; min-width:${size}px; border-radius:50%; background-color:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:${Math.max(11, Math.round(size * 0.38))}px; letter-spacing:-0.2px; flex-shrink:0;" aria-hidden="true">${initials}</div>`;
    };
}

let allDonors = [];
let bloodGroups = [];
let donorToDeleteId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadBloodGroups();
    await loadDonors();
    setupFilters();
    setupEditForm();
});

async function loadBloodGroups() {
    try {
        bloodGroups = await fetchJson('/api/blood-groups');
        const filterSelect = document.getElementById('filterBloodGroup');
        const editSelect = document.getElementById('editBloodGroup');

        filterSelect.innerHTML = '<option value="">All Blood Groups</option>';
        editSelect.innerHTML = '<option value="">Select Blood Group</option>';

        bloodGroups.forEach(bg => {
            const opt1 = document.createElement('option');
            opt1.value = bg.name;
            opt1.textContent = bg.name;
            filterSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = bg.id;
            opt2.textContent = bg.name;
            editSelect.appendChild(opt2);
        });
    } catch (e) {
        showToast('Failed to load blood groups: ' + e.message, 'error');
    }
}

async function loadDonors() {
    try {
        allDonors = await fetchJson('/api/donors');
        applyFilters();
    } catch (e) {
        showToast('Failed to load donors: ' + e.message, 'error');
        document.getElementById('donorTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--danger); padding: 30px;">
                    Failed to load donor data. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

function setupFilters() {
    const bgFilter = document.getElementById('filterBloodGroup');
    const cityFilter = document.getElementById('filterCity');
    const availFilter = document.getElementById('filterAvailability');
    const resetBtn = document.getElementById('resetFilterBtn');

    bgFilter.addEventListener('change', applyFilters);
    cityFilter.addEventListener('input', applyFilters);
    availFilter.addEventListener('change', applyFilters);

    resetBtn.addEventListener('click', () => {
        bgFilter.value = '';
        cityFilter.value = '';
        availFilter.value = '';
        applyFilters();
    });
}

function applyFilters() {
    const selectedBg = document.getElementById('filterBloodGroup').value.trim().toLowerCase();
    const cityQuery = document.getElementById('filterCity').value.trim().toLowerCase();
    const selectedAvail = document.getElementById('filterAvailability').value;

    const filtered = allDonors.filter(donor => {
        // Blood Group match
        if (selectedBg && (!donor.bloodGroupName || donor.bloodGroupName.toLowerCase() !== selectedBg)) {
            return false;
        }

        // City match
        if (cityQuery && (!donor.city || !donor.city.toLowerCase().includes(cityQuery))) {
            return false;
        }

        // Availability match
        if (selectedAvail === 'available' && !donor.available) {
            return false;
        }
        if (selectedAvail === 'cooldown' && donor.available) {
            return false;
        }

        return true;
    });

    renderDonorTable(filtered);
}

function renderDonorTable(donors) {
    const tbody = document.getElementById('donorTableBody');
    document.getElementById('donorCountHeader').textContent = donors.length;
    tbody.innerHTML = '';

    if (donors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">
                    No donors found matching the current filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    donors.forEach(donor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    ${renderAvatar(donor.fullName, 36)}
                    <div>
                        <div style="font-weight:600; color:var(--dark); font-size:0.9rem;">${escapeHtml(donor.fullName)}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">ID: #${donor.id}</div>
                    </div>
                </div>
            </td>
            <td>${renderBloodBadge(donor.bloodGroupName)}</td>
            <td><span style="font-weight:500; color:var(--dark);">${escapeHtml(donor.city)}</span></td>
            <td>
                <div><a href="tel:${escapeHtml(donor.phone)}" style="color:var(--primary); font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    ${escapeHtml(donor.phone)}
                </a></div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(donor.email)}</div>
            </td>
            <td><span style="font-weight:600; color:var(--dark);">${formatDate(donor.lastDonationDate)}</span></td>
            <td>${renderStatusBadge(donor.available, donor.daysRemaining, donor.eligibleDate)}</td>
            <td style="text-align: right;">
                <div style="display:inline-flex; gap:6px;">
                    <button class="btn btn-secondary btn-sm" onclick="openViewModal(${donor.id})" title="View Details">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${donor.id})" title="Edit Donor">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${donor.id}, '${escapeHtml(donor.fullName)}')" title="Delete Donor">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Modal View
function openViewModal(id) {
    const donor = allDonors.find(d => d.id === id);
    if (!donor) return;

    const modalBody = document.getElementById('viewModalBody');
    const eligibleText = donor.available ? 'Medically eligible to donate blood today' : `In 90-day cooldown until ${formatDate(donor.eligibleDate)} (${donor.daysRemaining} days remaining)`;

    modalBody.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--border-light);">
            ${renderAvatar(donor.fullName, 52)}
            <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <h4 style="font-size:1.25rem; font-weight:700; color:var(--dark); margin:0;">${escapeHtml(donor.fullName)}</h4>
                    ${renderBloodBadge(donor.bloodGroupName)}
                </div>
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:2px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${escapeHtml(donor.city)} &bull; Donor ID: #${donor.id}
                </div>
            </div>
        </div>

        <div style="background-color:${donor.available ? 'var(--success-light)' : 'var(--warning-light)'}; border:1px solid ${donor.available ? 'var(--success-border)' : 'var(--warning-border)'}; border-radius:var(--radius-sm); padding:12px 14px; margin-bottom:18px;">
            <div style="font-weight:700; font-size:0.85rem; color:${donor.available ? '#166534' : '#92400E'}; display:flex; align-items:center; gap:6px;">
                ${donor.available 
                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Clinical Safety Status: Available' 
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Clinical Safety Status: In 90-Day Cooldown'}
            </div>
            <p style="font-size:0.8125rem; color:${donor.available ? '#14532D' : '#78350F'}; margin-top:4px; line-height:1.4;">
                ${eligibleText}
            </p>
        </div>

        <div class="donor-meta-list" style="margin-bottom:20px;">
            <div class="donor-meta-item">
                <span class="donor-meta-label">Phone Contact:</span>
                <span class="donor-meta-val"><a href="tel:${escapeHtml(donor.phone)}" style="color:var(--primary); font-weight:600;">${escapeHtml(donor.phone)}</a></span>
            </div>
            <div class="donor-meta-item">
                <span class="donor-meta-label">Email Address:</span>
                <span class="donor-meta-val">${escapeHtml(donor.email)}</span>
            </div>
            <div class="donor-meta-item">
                <span class="donor-meta-label">City:</span>
                <span class="donor-meta-val">${escapeHtml(donor.city)}</span>
            </div>
            <div class="donor-meta-item">
                <span class="donor-meta-label">Last Donation Date:</span>
                <span class="donor-meta-val">${formatDate(donor.lastDonationDate)}</span>
            </div>
            <div class="donor-meta-item">
                <span class="donor-meta-label">Current Status:</span>
                <span class="donor-meta-val">${renderStatusBadge(donor.available, donor.daysRemaining, donor.eligibleDate)}</span>
            </div>
        </div>

        <div style="display:flex; gap:10px;">
            <a href="tel:${escapeHtml(donor.phone)}" class="btn btn-primary" style="flex:1;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Call Donor
            </a>
            <a href="mailto:${escapeHtml(donor.email)}?subject=BloodLink Donation Inquiry" class="btn btn-secondary" style="flex:1;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Send Email
            </a>
        </div>
    `;

    openModal('viewModal');
}

// Modal Edit
function openEditModal(id) {
    const donor = allDonors.find(d => d.id === id);
    if (!donor) return;

    document.getElementById('editDonorId').value = donor.id;
    document.getElementById('editFullName').value = donor.fullName;
    document.getElementById('editBloodGroup').value = donor.bloodGroupId;
    document.getElementById('editCity').value = donor.city;
    document.getElementById('editPhone').value = donor.phone;
    document.getElementById('editEmail').value = donor.email;
    document.getElementById('editLastDonationDate').value = donor.lastDonationDate || '';

    openModal('editModal');
}

function setupEditForm() {
    const form = document.getElementById('editDonorForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editDonorId').value;
        const lastDonationDateVal = document.getElementById('editLastDonationDate').value;

        const payload = {
            fullName: document.getElementById('editFullName').value.trim(),
            bloodGroupId: parseInt(document.getElementById('editBloodGroup').value, 10),
            city: document.getElementById('editCity').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            lastDonationDate: lastDonationDateVal ? lastDonationDateVal : null
        };

        const saveBtn = document.getElementById('saveEditBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            await fetchJson(`/api/donors/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showToast('Donor updated successfully!', 'success');
            closeModal('editModal');
            await loadDonors();
        } catch (error) {
            showToast('Update failed: ' + error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    });

    // Delete modal confirmation hook
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if (!donorToDeleteId) return;

        const delBtn = document.getElementById('confirmDeleteBtn');
        delBtn.disabled = true;
        delBtn.textContent = 'Deleting...';

        try {
            await fetchJson(`/api/donors/${donorToDeleteId}`, {
                method: 'DELETE'
            });
            showToast('Donor deleted successfully.', 'success');
            closeModal('deleteModal');
            await loadDonors();
        } catch (error) {
            showToast('Delete failed: ' + error.message, 'error');
        } finally {
            delBtn.disabled = false;
            delBtn.textContent = 'Delete Donor';
            donorToDeleteId = null;
        }
    });
}

function openDeleteModal(id, name) {
    donorToDeleteId = id;
    document.getElementById('deleteDonorName').textContent = name;
    openModal('deleteModal');
}

// Modal generic helpers
function openModal(modalId) {
    document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}
