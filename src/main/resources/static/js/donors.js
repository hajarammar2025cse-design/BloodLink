/**
 * BloodLink — Donors Registry Controller
 */

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
                <div style="font-weight:600; color:var(--dark);">${escapeHtml(donor.fullName)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">ID: #${donor.id}</div>
            </td>
            <td>${renderBloodBadge(donor.bloodGroupName)}</td>
            <td>${escapeHtml(donor.city)}</td>
            <td>
                <div><a href="tel:${escapeHtml(donor.phone)}" style="color:var(--primary); font-weight:500;">${escapeHtml(donor.phone)}</a></div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(donor.email)}</div>
            </td>
            <td>${formatDate(donor.lastDonationDate)}</td>
            <td>${renderStatusBadge(donor.available, donor.daysRemaining, donor.eligibleDate)}</td>
            <td style="text-align: right;">
                <div style="display:inline-flex; gap:6px;">
                    <button class="btn btn-secondary btn-sm" onclick="openViewModal(${donor.id})">View</button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${donor.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${donor.id}, '${escapeHtml(donor.fullName)}')">Delete</button>
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
    const eligibleText = donor.available ? 'Eligible to donate today' : `Eligible on ${formatDate(donor.eligibleDate)} (${donor.daysRemaining} days remaining)`;

    modalBody.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h4 style="font-size:1.25rem; font-weight:700; color:var(--dark);">${escapeHtml(donor.fullName)}</h4>
                <div style="font-size:0.82rem; color:var(--text-secondary);">${escapeHtml(donor.city)}</div>
            </div>
            ${renderBloodBadge(donor.bloodGroupName)}
        </div>
        <div class="donor-meta-list">
            <div class="donor-meta-item">
                <span class="donor-meta-label">Phone:</span>
                <span class="donor-meta-val"><a href="tel:${escapeHtml(donor.phone)}" style="color:var(--primary);">${escapeHtml(donor.phone)}</a></span>
            </div>
            <div class="donor-meta-item">
                <span class="donor-meta-label">Email:</span>
                <span class="donor-meta-val">${escapeHtml(donor.email)}</span>
            </div>
            <div class="donor-meta-item">
                <span class="donor-meta-label">Last Donation:</span>
                <span class="donor-meta-val">${formatDate(donor.lastDonationDate)}</span>
            </div>
            <div class="donor-meta-item">
                <span class="donor-meta-label">Status:</span>
                <span class="donor-meta-val">${renderStatusBadge(donor.available, donor.daysRemaining, donor.eligibleDate)}</span>
            </div>
            <div class="donor-meta-item">
                <span class="donor-meta-label">Eligibility Note:</span>
                <span class="donor-meta-val" style="font-size:0.85rem; color:${donor.available ? 'var(--success)' : 'var(--warning)'}; font-weight:600;">
                    ${eligibleText}
                </span>
            </div>
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
