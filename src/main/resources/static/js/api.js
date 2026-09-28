/**
 * BloodLink — API Helper & Shared Utilities
 * Clean, readable vanilla JavaScript
 */

// Toast Notification Manager
function showToast(message, type = 'info', duration = 3800) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warning') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
        <span style="display:flex; align-items:center;">${iconSvg}</span>
        <div style="flex:1; font-weight:500;">${escapeHtml(message)}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// Fetch wrapper with error normalization
async function fetchJson(url, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        const contentType = response.headers.get('content-type');
        let data = null;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            let errorMsg = 'An unexpected error occurred.';
            if (data && typeof data === 'object') {
                if (data.message) {
                    errorMsg = data.message;
                } else if (data.error) {
                    errorMsg = data.error;
                }
            } else if (typeof data === 'string' && data.length > 0) {
                errorMsg = data;
            }
            throw new Error(errorMsg);
        }

        return data;
    } catch (err) {
        console.error(`API Error on ${url}:`, err);
        throw err;
    }
}

// Format ISO date (e.g., 2026-09-28) to user-friendly format (28 Sep 2026)
function formatDate(dateStr) {
    if (!dateStr) return 'Never';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[parseInt(parts[1], 10) - 1];
            const day = parts[2];
            return `${day} ${month} ${year}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

// Render status badge HTML
function renderStatusBadge(available, daysRemaining = 0, eligibleDate = null) {
    if (available) {
        return `<span class="badge badge-available">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Available
        </span>`;
    } else {
        const text = daysRemaining > 0 ? `In Cooldown (${daysRemaining}d left)` : 'In Cooldown';
        const title = eligibleDate ? `Eligible on: ${formatDate(eligibleDate)}` : 'In 90-day cooldown period';
        return `<span class="badge badge-cooldown" title="${title}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${text}
        </span>`;
    }
}

// Render blood badge HTML
function renderBloodBadge(groupName) {
    return `<span class="blood-badge">${escapeHtml(groupName || 'Unknown')}</span>`;
}

// Utility: HTML Escaper to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Setup mobile sidebar toggle & global modal escape listener
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.querySelector('.sidebar');

    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar on click outside on mobile
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !hamburgerBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Close any open modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop.open').forEach(modal => {
                modal.classList.remove('open');
            });
        }
    });

    // Close modal on clicking outside the modal box
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('open');
            }
        });
    });
});
