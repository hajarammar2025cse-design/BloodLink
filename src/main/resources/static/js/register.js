/**
 * BloodLink — Donor Registration Controller
 */

let bloodGroups = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadBloodGroups();
    setupDateLimits();
    setupFormValidation();
});

async function loadBloodGroups() {
    try {
        bloodGroups = await fetchJson('/api/blood-groups');
        const select = document.getElementById('bloodGroupId');
        select.innerHTML = '<option value="">Select Blood Group</option>';

        bloodGroups.forEach(bg => {
            const opt = document.createElement('option');
            opt.value = bg.id;
            opt.textContent = bg.name;
            select.appendChild(opt);
        });
    } catch (e) {
        showToast('Failed to load blood groups: ' + e.message, 'error');
    }
}

function setupDateLimits() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lastDonationDate').setAttribute('max', today);
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control, .form-select').forEach(el => el.classList.remove('error'));
}

function setupFormValidation() {
    const form = document.getElementById('registerDonorForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const fullName = document.getElementById('fullName').value.trim();
        const bloodGroupIdVal = document.getElementById('bloodGroupId').value;
        const city = document.getElementById('city').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const lastDonationDateVal = document.getElementById('lastDonationDate').value;

        let hasError = false;

        // Name validation
        if (!fullName) {
            setError('fullName', 'Full name is required.');
            hasError = true;
        }

        // Blood group validation
        if (!bloodGroupIdVal) {
            setError('bloodGroupId', 'Please select a blood group.');
            hasError = true;
        }

        // City validation
        if (!city) {
            setError('city', 'City is required.');
            hasError = true;
        }

        // Phone validation (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phone) {
            setError('phone', 'Phone number is required.');
            hasError = true;
        } else if (!phoneRegex.test(phone)) {
            setError('phone', 'Phone number must be exactly 10 digits.');
            hasError = true;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setError('email', 'Email address is required.');
            hasError = true;
        } else if (!emailRegex.test(email)) {
            setError('email', 'Please enter a valid email address.');
            hasError = true;
        }

        // Date validation
        const today = new Date().toISOString().split('T')[0];
        if (lastDonationDateVal && lastDonationDateVal > today) {
            setError('lastDonationDate', 'Last donation date cannot be in the future.');
            hasError = true;
        }

        if (hasError) {
            showToast('Please fix the errors in the form.', 'error');
            return;
        }

        const payload = {
            fullName,
            bloodGroupId: parseInt(bloodGroupIdVal, 10),
            city,
            phone,
            email,
            lastDonationDate: lastDonationDateVal ? lastDonationDateVal : null
        };

        const submitBtn = document.getElementById('submitRegisterBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        try {
            const response = await fetchJson('/api/donors', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const donor = response.data;
            if (donor.available) {
                showToast(`Success! ${donor.fullName} registered as an Available Donor.`, 'success', 5000);
            } else {
                showToast(`Registered! ${donor.fullName} is in 90-day cooldown until ${formatDate(donor.eligibleDate)}.`, 'warning', 6000);
            }

            form.reset();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register Donor';
        }
    });
}

function setError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (input) {
        input.classList.add('error');
    }
    const errSpan = document.getElementById(fieldId + 'Error');
    if (errSpan) {
        errSpan.textContent = message;
    }
}
