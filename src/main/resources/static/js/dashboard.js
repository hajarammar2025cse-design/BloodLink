/**
 * BloodLink — Dashboard Controller
 */

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
        summaryContainer.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1;">No blood group data available.</p>';
        return;
    }

    const labels = Object.keys(distribution);
    const dataValues = Object.values(distribution);

    // Build the summary cards list
    labels.forEach((label) => {
        const count = distribution[label] || 0;
        const item = document.createElement('div');
        item.style.cssText = 'background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:8px 12px; display:flex; align-items:center; justify-content:space-between;';
        item.innerHTML = `
            <span style="font-weight:700; color:var(--primary); font-size:0.95rem;">${escapeHtml(label)}</span>
            <span style="font-weight:600; color:var(--dark); font-size:1rem;">${count}</span>
        `;
        summaryContainer.appendChild(item);
    });

    const ctx = document.getElementById('bloodGroupChart').getContext('2d');

    if (bloodGroupChartInstance) {
        bloodGroupChartInstance.destroy();
    }

    const chartColors = [
        '#D62839', '#F87171', '#2563EB', '#60A5FA', 
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
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 12,
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw} registered`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderRecentDonations(donations) {
    const tbody = document.getElementById('recentDonationsTableBody');
    tbody.innerHTML = '';

    if (!donations || donations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No donations recorded yet. Click "Record New" to log a donation.
                </td>
            </tr>
        `;
        return;
    }

    donations.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="font-weight:600; color:var(--dark);">${escapeHtml(donation.donorName || 'Unknown')}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">ID: #${donation.donorId}</div>
            </td>
            <td>${renderBloodBadge(donation.bloodGroup)}</td>
            <td>${escapeHtml(donation.city || '—')}</td>
            <td><strong>${formatDate(donation.donationDate)}</strong></td>
            <td>
                <a href="tel:${escapeHtml(donation.phone)}" style="color:var(--primary); font-size:0.85rem; font-weight:500;">
                    ${escapeHtml(donation.phone || '—')}
                </a>
            </td>
        `;
        tbody.appendChild(row);
    });
}
