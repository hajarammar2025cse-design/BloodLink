/**
 * BloodLink — Search Page Controller
 */

let bloodGroups = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadBloodGroups();
    setupSearchForm();
    setupCityChips();

    // Check if query params were passed in URL (e.g., ?bloodGroup=O%2B&city=Coimbatore)
    const urlParams = new URLSearchParams(window.location.search);
    const bgParam = urlParams.get('bloodGroup');
    const cityParam = urlParams.get('city');

    if (bgParam) {
        document.getElementById('searchBloodGroup').value = bgParam;
    }
    if (cityParam) {
        document.getElementById('searchCity').value = cityParam;
    }

    // Execute initial search
    executeSearch();
});

async function loadBloodGroups() {
    try {
        bloodGroups = await fetchJson('/api/blood-groups');
        const select = document.getElementById('searchBloodGroup');
        select.innerHTML = '<option value="">All Blood Groups</option>';

        bloodGroups.forEach(bg => {
            const opt = document.createElement('option');
            opt.value = bg.name;
            opt.textContent = bg.name;
            select.appendChild(opt);
        });
    } catch (e) {
        showToast('Failed to load blood groups: ' + e.message, 'error');
    }
}

function setupSearchForm() {
    const form = document.getElementById('donorSearchForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        executeSearch();
    });

    const resetBtn = document.getElementById('searchResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('searchBloodGroup').value = '';
            document.getElementById('searchCity').value = '';
            executeSearch();
        });
    }
}

function setupCityChips() {
    const chips = document.querySelectorAll('.city-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const city = chip.getAttribute('data-city');
            document.getElementById('searchCity').value = city;
            executeSearch();
        });
    });
}

async function executeSearch() {
    const bg = document.getElementById('searchBloodGroup').value.trim();
    const city = document.getElementById('searchCity').value.trim();
    const grid = document.getElementById('donorCardsGrid');
    const resultCount = document.getElementById('searchResultCount');
    const searchBtn = document.getElementById('searchSubmitBtn');

    searchBtn.disabled = true;
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Searching eligible donors...</div>';

    let url = '/api/donors/search?';
    const params = [];
    if (bg) params.push(`bloodGroup=${encodeURIComponent(bg)}`);
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    url += params.join('&');

    try {
        const donors = await fetchJson(url);
        renderDonorCards(donors, bg, city);
    } catch (error) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 40px;">Error searching donors: ${escapeHtml(error.message)}</div>`;
        showToast('Search failed: ' + error.message, 'error');
    } finally {
        searchBtn.disabled = false;
    }
}

function renderDonorCards(donors, bgFilter, cityFilter) {
    const grid = document.getElementById('donorCardsGrid');
    const resultCount = document.getElementById('searchResultCount');
    const resultTitle = document.getElementById('searchResultTitle');

    resultCount.textContent = `Showing ${donors.length} eligible donor${donors.length === 1 ? '' : 's'}`;

    if (bgFilter || cityFilter) {
        const parts = [];
        if (bgFilter) parts.push(`Group "${bgFilter}"`);
        if (cityFilter) parts.push(`"${cityFilter}"`);
        resultTitle.textContent = `Results for ${parts.join(' in ')}`;
    } else {
        resultTitle.textContent = 'All Available Donors';
    }

    grid.innerHTML = '';

    if (!donors || donors.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3>No eligible donors found for this search.</h3>
                <p>
                    We couldn't find any available donors matching your criteria. Note that donors currently in their <strong>90-day cooldown period</strong> are strictly excluded for safety.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('searchResetBtn').click()">Clear Filters</button>
                    <a href="register-donor.html" class="btn btn-primary btn-sm">+ Register as a Donor</a>
                </div>
            </div>
        `;
        return;
    }

    donors.forEach(donor => {
        const card = document.createElement('div');
        card.className = 'donor-card';
        card.innerHTML = `
            <div>
                <div class="donor-card-top">
                    <div>
                        <div class="donor-card-name">${escapeHtml(donor.fullName)}</div>
                        <div class="donor-card-city">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${escapeHtml(donor.city)}
                        </div>
                    </div>
                    ${renderBloodBadge(donor.bloodGroupName)}
                </div>

                <div class="donor-meta-list">
                    <div class="donor-meta-item">
                        <span class="donor-meta-label">Last Donation:</span>
                        <span class="donor-meta-val">${formatDate(donor.lastDonationDate)}</span>
                    </div>
                    <div class="donor-meta-item">
                        <span class="donor-meta-label">Status:</span>
                        <span class="donor-meta-val">${renderStatusBadge(donor.available, 0, null)}</span>
                    </div>
                </div>
            </div>

            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: var(--success); font-weight: 600; display:flex; align-items:center; gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Ready to Donate
                </span>
                <button class="btn btn-primary btn-sm" onclick="openContactModal(${donor.id}, '${escapeHtml(donor.fullName)}', '${escapeHtml(donor.phone)}', '${escapeHtml(donor.email)}', '${escapeHtml(donor.bloodGroupName)}', '${escapeHtml(donor.city)}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Contact
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openContactModal(id, name, phone, email, bg, city) {
    const modalBody = document.getElementById('contactModalBody');
    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 18px;">
            <div style="margin-bottom: 8px;">${renderBloodBadge(bg)}</div>
            <h4 style="font-size: 1.15rem; font-weight:700; color: var(--dark);">${escapeHtml(name)}</h4>
            <div style="font-size: 0.8125rem; color: var(--text-secondary);">${escapeHtml(city)}</div>
        </div>

        <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 18px;">
            <div style="font-size: 0.75rem; font-weight:600; color: var(--text-muted); text-transform:uppercase; margin-bottom: 4px;">Phone Number</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--dark); margin-bottom: 12px;">
                ${escapeHtml(phone)}
            </div>

            <div style="font-size: 0.75rem; font-weight:600; color: var(--text-muted); text-transform:uppercase; margin-bottom: 4px;">Email Address</div>
            <div style="font-size: 0.9rem; font-weight: 500; color: var(--dark);">
                ${escapeHtml(email)}
            </div>
        </div>

        <div style="display: flex; gap: 10px;">
            <a href="tel:${escapeHtml(phone)}" class="btn btn-primary" style="flex: 1;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Call Now
            </a>
            <a href="mailto:${escapeHtml(email)}?subject=BloodLink: Urgent Blood Inquiry (${escapeHtml(bg)})" class="btn btn-secondary" style="flex: 1;">
                Send Email
            </a>
        </div>
    `;

    document.getElementById('contactModal').classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}
