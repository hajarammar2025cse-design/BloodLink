package com.bloodlink.service;

import com.bloodlink.dto.DonorRequest;
import com.bloodlink.dto.DonorResponse;
import com.bloodlink.exception.BusinessRuleException;
import com.bloodlink.exception.ResourceNotFoundException;
import com.bloodlink.model.BloodGroup;
import com.bloodlink.model.Donor;
import com.bloodlink.repository.BloodGroupRepository;
import com.bloodlink.repository.DonationRecordRepository;
import com.bloodlink.repository.DonorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DonorService {

    private final DonorRepository donorRepository;
    private final BloodGroupRepository bloodGroupRepository;
    private final DonationRecordRepository donationRecordRepository;

    public DonorService(DonorRepository donorRepository,
                        BloodGroupRepository bloodGroupRepository,
                        DonationRecordRepository donationRecordRepository) {
        this.donorRepository = donorRepository;
        this.bloodGroupRepository = bloodGroupRepository;
        this.donationRecordRepository = donationRecordRepository;
    }

    /**
     * Determines whether a donor is currently eligible based on the 90-day cooldown rule.
     * If the donor has never donated, they are eligible.
     * If they donated within the last 90 days, they are ineligible.
     */
    public boolean isEligible(Donor donor) {
        if (donor.getLastDonationDate() == null) {
            return true;
        }

        LocalDate eligibleDate = donor.getLastDonationDate().plusDays(90);
        return !LocalDate.now().isBefore(eligibleDate);
    }

    /**
     * Synchronizes the stored 'available' flag with the actual 90-day cooldown rule.
     * This ensures donors automatically re-enable after 90 days without manual admin action.
     */
    @Transactional
    public void syncDonorAvailability(Donor donor) {
        boolean eligible = isEligible(donor);
        if (donor.getAvailable() != eligible) {
            donor.setAvailable(eligible);
            donorRepository.save(donor);
        }
    }

    @Transactional
    public List<DonorResponse> getAllDonors() {
        List<Donor> donors = donorRepository.findAllByOrderByIdDesc();
        List<DonorResponse> responseList = new ArrayList<>();

        for (Donor donor : donors) {
            syncDonorAvailability(donor);
            responseList.add(DonorResponse.fromEntity(donor));
        }

        return responseList;
    }

    @Transactional
    public DonorResponse getDonorById(Long id) {
        Donor donor = getDonorEntity(id);
        syncDonorAvailability(donor);
        return DonorResponse.fromEntity(donor);
    }

    public Donor getDonorEntity(Long id) {
        return donorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found with ID: " + id));
    }

    @Transactional
    public DonorResponse registerDonor(DonorRequest request) {
        BloodGroup bloodGroup = bloodGroupRepository.findById(request.getBloodGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Blood group not found with ID: " + request.getBloodGroupId()));

        if (request.getLastDonationDate() != null && request.getLastDonationDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Last donation date cannot be in the future.");
        }

        Donor donor = new Donor();
        donor.setFullName(request.getFullName().trim());
        donor.setBloodGroup(bloodGroup);
        donor.setCity(request.getCity().trim());
        donor.setPhone(request.getPhone().trim());
        donor.setEmail(request.getEmail().trim().toLowerCase());
        donor.setLastDonationDate(request.getLastDonationDate());

        // Apply 90-day cooldown rule upon registration
        boolean eligible = isEligible(donor);
        donor.setAvailable(eligible);

        Donor savedDonor = donorRepository.save(donor);
        return DonorResponse.fromEntity(savedDonor);
    }

    @Transactional
    public DonorResponse updateDonor(Long id, DonorRequest request) {
        Donor donor = getDonorEntity(id);

        BloodGroup bloodGroup = bloodGroupRepository.findById(request.getBloodGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Blood group not found with ID: " + request.getBloodGroupId()));

        if (request.getLastDonationDate() != null && request.getLastDonationDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Last donation date cannot be in the future.");
        }

        donor.setFullName(request.getFullName().trim());
        donor.setBloodGroup(bloodGroup);
        donor.setCity(request.getCity().trim());
        donor.setPhone(request.getPhone().trim());
        donor.setEmail(request.getEmail().trim().toLowerCase());
        donor.setLastDonationDate(request.getLastDonationDate());

        // Re-evaluate eligibility
        donor.setAvailable(isEligible(donor));

        Donor updated = donorRepository.save(donor);
        return DonorResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteDonor(Long id) {
        if (!donorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Donor not found with ID: " + id);
        }
        // First delete any associated donation records to maintain referential integrity
        donationRecordRepository.deleteByDonorId(id);
        donorRepository.deleteById(id);
    }

    /**
     * Search donors by blood group and/or city.
     * Returns ONLY available/eligible donors (not in cooldown).
     */
    @Transactional
    public List<DonorResponse> searchDonors(String bloodGroup, String city) {
        // First sync all existing donors so cooldown expiration is applied
        List<Donor> allDonors = donorRepository.findAll();
        for (Donor d : allDonors) {
            syncDonorAvailability(d);
        }

        String bgParam = (bloodGroup != null && !bloodGroup.trim().isEmpty()) ? bloodGroup.trim() : null;
        String cityParam = (city != null && !city.trim().isEmpty()) ? city.trim() : null;

        List<Donor> matches = donorRepository.searchAvailableDonors(bgParam, cityParam);
        List<DonorResponse> results = new ArrayList<>();

        for (Donor donor : matches) {
            // Double-check eligibility defensively
            if (isEligible(donor)) {
                results.add(DonorResponse.fromEntity(donor));
            }
        }

        return results;
    }
}
