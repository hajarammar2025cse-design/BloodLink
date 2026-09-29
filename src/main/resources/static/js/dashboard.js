/**
 * BloodLink — Dashboard Controller
 */

if (typeof renderAvatar !== 'function') {
    window.renderAvatar = function(name, size = 36) {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        const initials = parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return `<div class="donor-avatar" style="width:${size}px; height:${size}px; min-width:${size}px; border-radius:50%; background-color:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:${Math.max(11, Math.round(size * 0.38))}px; letter-spacing:-0.2px; flex-shrink:0;" aria-hidden="true">${initials}</div>`;
    };
}

let bloodGroupChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const stats = await fetchJson('/api/dashboard');
        renderStatCards(stats);
        renderBloodGroupChart(stats.bloodGroupDistribution);
        renderRecentDonations(stats.recentDonations);
    } catch (error) {
        showToast('Failed to load dashboard metrics: ' + error.message, 'error');
    }
}

function renderStatCards(stats) {
    document.getElementById('statTotalDonors').textContent = stats.totalDonors ?? 0;
    document.getElementById('statAvailableDonors').textContent = stats.availableDonors ?? 0;
    document.getElementById('statUnavailableDonors').textContent = stats.unavailableDonors ?? 0;
    document.getElementById('statTotalDonations').textContent = stats.totalDonations ?? 0;
}

function renderBloodGroupChart(distribution) {
    const summaryContainer = document.getElementById('bloodGroupSummaryList');
    summaryContainer.innerHTML = '';

    if (!distribution || Object.keys(distribution).length === 0) {
        summaryContainer.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1; padding: 20px; text-align: center;">No blood group data available.</p>';
        return;
    }

    const labels = Object.keys(distribution);
    const dataValues = Object.values(distribution);
    const totalDonorsInDist = dataValues.reduce((acc, val) => acc + (val || 0), 0);

    // Build the enhanced summary cards list
    labels.forEach((label) => {
        const count = distribution[label] || 0;
        const percentage = totalDonorsInDist > 0 ? Math.round((count / totalDonorsInDist) * 100) : 0;

        const item = document.createElement('div');
        item.className = 'blood-summary-card';
        item.innerHTML = `
            <div class="blood-summary-header">
                <span class="blood-group-tag">${escapeHtml(label)}</span>
                <span class="blood-summary-count">${count}</span>
            </div>
            <div class="blood-summary-meta">
                <span>${count === 1 ? '1 donor' : `${count} donors`}</span>
                <span>${percentage}%</span>
            </div>
            <div class="blood-progress-bar">
                <div class="blood-progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        summaryContainer.appendChild(item);
    });

    const ctx = document.getElementById('bloodGroupChart').getContext('2d');

    if (bloodGroupChartInstance) {
        bloodGroupChartInstance.destroy();
    }

    // Professional clinical palette
    const chartColors = [
        '#C92A3E', '#F43F5E', '#2563EB', '#60A5FA', 
        '#7C3AED', '#A78BFA', '#059669', '#34D399'
    ];

    bloodGroupChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: chartColors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 12,
                        font: {
                            family: 'Inter',
                            size: 11,
                            weight: 500
                        },
                        color: '#475569'
                    }
                },
                tooltip: {
                    backgroundColor: '#0F172A',
                    titleFont: { family: 'Inter', size: 12, weight: 600 },
                    bodyFont: { family: 'Inter', size: 12 },
                    padding: 10,
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw || 0;
                            const pct = totalDonorsInDist > 0 ? Math.round((val / totalDonorsInDist) * 100) : 0;
                            return ` ${context.label}: ${val} registered (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function renderRecentDonations(donations) {
    const tbody = document.getElementById('recentDonationsTableBody');
    tbody.innerHTML = '';

    if (!donations || donations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted);"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                        <p style="font-weight: 500; font-size: 0.875rem; color: var(--text-secondary);">No donations recorded yet.</p>
                        <a href="donations.html" class="btn btn-primary btn-sm" style="margin-top: 4px;">Record First Donation</a>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    donations.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    ${renderAvatar(donation.donorName, 36)}
                    <div>
                        <div style="font-weight:600; color:var(--navy); font-size:0.9rem;">${escapeHtml(donation.donorName || 'Unknown')}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">Donor ID: #${donation.donorId}</div>
                    </div>
                </div>
            </td>
            <td>${renderBloodBadge(donation.bloodGroup)}</td>
            <td><span style="color:var(--text-secondary); font-weight:500;">${escapeHtml(donation.city || '—')}</span></td>
            <td><span style="font-weight:600; color:var(--navy);">${formatDate(donation.donationDate)}</span></td>
            <td>
                <a href="tel:${escapeHtml(donation.phone)}" class="contact-link">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span>${escapeHtml(donation.phone || '—')}</span>
                </a>
            </td>
        `;
        tbody.appendChild(row);
    });
}
