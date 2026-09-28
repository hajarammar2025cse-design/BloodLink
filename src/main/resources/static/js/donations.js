/**
 * BloodLink — Donations Controller
 */

let allDonors = [];

document.addEventListener('DOMContentLoaded', async () => {
    initDatePicker();
    await loadDonors();
    await loadDonations();
    setupForm();
});

function initDatePicker() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('donationDate');
    dateInput.value = today;
    dateInput.setAttribute('max', today);
}

async function loadDonors() {
    try {
        allDonors = await fetchJson('/api/donors');
        const select = document.getElementById('selectDonor');
        select.innerHTML = '<option value="">-- Choose a registered donor --</option>';

        allDonors.forEach(donor => {
            const opt = document.createElement('option');
            opt.value = donor.id;
            const statusLabel = donor.available ? 'Eligible' : `Cooldown (${donor.daysRemaining}d left)`;
            opt.textContent = `${donor.fullName} [${donor.bloodGroupName}] — ${donor.city} (${statusLabel})`;
            select.appendChild(opt);
        });
    } catch (e) {
        showToast('Failed to load donors: ' + e.message, 'error');
    }
}

async function loadDonations() {
    try {
        const donations = await fetchJson('/api/donations');
        renderDonationsTable(donations);
    } catch (e) {
        showToast('Failed to load donations history: ' + e.message, 'error');
    }
}

function renderDonationsTable(donations) {
    const tbody = document.getElementById('donationsTableBody');
    tbody.innerHTML = '';

    if (!donations || donations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No donation records found. Record a donation using the form above.
                </td>
            </tr>
        `;
        return;
    }

    donations.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><code style="font-weight:600; color:var(--text-secondary);">#${donation.id}</code></td>
            <td>
                <div style="font-weight:600; color:var(--dark);">${escapeHtml(donation.donorName || 'Unknown')}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">Donor ID: #${donation.donorId}</div>
            </td>
            <td>${renderBloodBadge(donation.bloodGroup)}</td>
            <td>${escapeHtml(donation.city || '—')}</td>
            <td><strong style="color:var(--dark);">${formatDate(donation.donationDate)}</strong></td>
            <td>
                <a href="tel:${escapeHtml(donation.phone)}" style="color:var(--primary); font-size:0.85rem;">
                    ${escapeHtml(donation.phone || '—')}
                </a>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupForm() {
    const select = document.getElementById('selectDonor');
    const submitBtn = document.getElementById('recordSubmitBtn');
    const previewBody = document.getElementById('donorPreviewBody');
    const badgeHolder = document.getElementById('previewStatusBadge');

    select.addEventListener('change', () => {
        const donorId = parseInt(select.value, 10);
        if (!donorId) {
            badgeHolder.innerHTML = 'Select a donor';
            previewBody.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 40px 10px;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <p>Select a donor from the dropdown to check their current 90-day cooldown status and medical eligibility.</p>
                </div>
            `;
            submitBtn.disabled = false;
            return;
        }

        const donor = allDonors.find(d => d.id === donorId);
        if (!donor) return;

        badgeHolder.innerHTML = renderStatusBadge(donor.available, donor.daysRemaining, donor.eligibleDate);

        if (!donor.available) {
            // Donor is in cooldown -> Disable submit button!
            submitBtn.disabled = true;
            submitBtn.textContent = 'Donor Ineligible (In Cooldown)';

            previewBody.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <div>
                        <h4 style="font-size:1.15rem; color:var(--dark);">${escapeHtml(donor.fullName)}</h4>
                        <div style="font-size:0.85rem; color:var(--text-secondary);">${escapeHtml(donor.city)} &bull; ${escapeHtml(donor.phone)}</div>
                    </div>
                    ${renderBloodBadge(donor.bloodGroupName)}
                </div>

                <div style="background-color: var(--warning-light); border: 1px solid var(--warning-border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px;">
                    <div style="font-weight: 700; color: #92400E; font-size: 0.92rem; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        90-Day Cooldown Period Active
                    </div>
                    <p style="font-size: 0.85rem; color: #78350F;">
                        This donor donated on <strong>${formatDate(donor.lastDonationDate)}</strong> and cannot donate again until <strong>${formatDate(donor.eligibleDate)}</strong> (${donor.daysRemaining} days remaining).
                    </p>
                </div>

                <div class="donor-meta-list" style="margin-bottom:0;">
                    <div class="donor-meta-item">
                        <span class="donor-meta-label">Last Donation:</span>
                        <span class="donor-meta-val">${formatDate(donor.lastDonationDate)}</span>
                    </div>
                    <div class="donor-meta-item">
                        <span class="donor-meta-label">Next Eligible Date:</span>
                        <span class="donor-meta-val" style="color:var(--warning); font-weight:700;">${formatDate(donor.eligibleDate)}</span>
                    </div>
                </div>
            `;
        } else {
            // Donor is eligible -> Enable submit button!
            submitBtn.disabled = false;
            submitBtn.textContent = 'Record Blood Donation';

            previewBody.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <div>
                        <h4 style="font-size:1.15rem; color:var(--dark);">${escapeHtml(donor.fullName)}</h4>
                        <div style="font-size:0.85rem; color:var(--text-secondary);">${escapeHtml(donor.city)} &bull; ${escapeHtml(donor.phone)}</div>
                    </div>
                    ${renderBloodBadge(donor.bloodGroupName)}
                </div>

                <div style="background-color: var(--success-light); border: 1px solid var(--success-border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px;">
                    <div style="font-weight: 700; color: #166534; font-size: 0.92rem; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Eligible for Blood Donation
                    </div>
                    <p style="font-size: 0.85rem; color: #14532D;">
                        This donor is fully clear of the 90-day cooldown interval and is medically fit to donate blood today.
                    </p>
                </div>

                <div class="donor-meta-list" style="margin-bottom:0;">
                    <div class="donor-meta-item">
                        <span class="donor-meta-label">Previous Donation:</span>
                        <span class="donor-meta-val">${formatDate(donor.lastDonationDate)}</span>
                    </div>
                    <div class="donor-meta-item">
                        <span class="donor-meta-label">Status:</span>
                        <span class="donor-meta-val" style="color:var(--success); font-weight:700;">Ready to Donate</span>
                    </div>
                </div>
            `;
        }
    });

    const form = document.getElementById('recordDonationForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const donorId = parseInt(document.getElementById('selectDonor').value, 10);
        const donationDate = document.getElementById('donationDate').value;

        if (!donorId) {
            showToast('Please select a donor.', 'error');
            return;
        }

        if (!donationDate) {
            showToast('Please select a donation date.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Recording Donation...';

        try {
            const result = await fetchJson('/api/donations', {
                method: 'POST',
                body: JSON.stringify({ donorId, donationDate })
            });

            showToast(result.message || 'Donation recorded successfully. Donor entered 90-day cooldown.', 'success', 5000);
            
            // Reload donors and donations
            await loadDonors();
            await loadDonations();

            // Re-trigger select change for updated status
            document.getElementById('selectDonor').value = donorId;
            select.dispatchEvent(new Event('change'));

        } catch (error) {
            showToast(error.message, 'error', 5000);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Record Blood Donation';
        }
    });
}
