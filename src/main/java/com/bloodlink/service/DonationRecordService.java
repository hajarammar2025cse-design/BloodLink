package com.bloodlink.service;

import com.bloodlink.dto.DonationRequest;
import com.bloodlink.dto.DonationResponse;
import com.bloodlink.exception.BusinessRuleException;
import com.bloodlink.model.DonationRecord;
import com.bloodlink.model.Donor;
import com.bloodlink.repository.DonationRecordRepository;
import com.bloodlink.repository.DonorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DonationRecordService {

    private final DonationRecordRepository donationRecordRepository;
    private final DonorRepository donorRepository;
    private final DonorService donorService;

    public DonationRecordService(DonationRecordRepository donationRecordRepository,
                                 DonorRepository donorRepository,
                                 DonorService donorService) {
        this.donationRecordRepository = donationRecordRepository;
        this.donorRepository = donorRepository;
        this.donorService = donorService;
    }

    public List<DonationResponse> getAllDonations() {
        List<DonationRecord> records = donationRecordRepository.findAllByOrderByDonationDateDescIdDesc();
        List<DonationResponse> responses = new ArrayList<>();
        for (DonationRecord record : records) {
            responses.add(DonationResponse.fromEntity(record));
        }
        return responses;
    }

    public List<DonationResponse> getRecentDonations() {
        List<DonationRecord> records = donationRecordRepository.findTop10ByOrderByDonationDateDescIdDesc();
        List<DonationResponse> responses = new ArrayList<>();
        for (DonationRecord record : records) {
            responses.add(DonationResponse.fromEntity(record));
        }
        return responses;
    }

    @Transactional
    public DonationResponse recordDonation(DonationRequest request) {
        // 1. Validate donor exists
        Donor donor = donorService.getDonorEntity(request.getDonorId());

        // 2. Validate donation date cannot be in the future
        LocalDate donationDate = request.getDonationDate();
        if (donationDate.isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Donation date cannot be in the future.");
        }

        // Sync donor status first
        donorService.syncDonorAvailability(donor);

        // 3. Check if donor is still inside the 90-day cooldown period
        if (!donorService.isEligible(donor)) {
            LocalDate eligibleDate = donor.getLastDonationDate().plusDays(90);
            throw new BusinessRuleException(
                    "Donor is currently unavailable. The 90-day cooldown period has not ended. Eligible again on: " + eligibleDate);
        }

        // Additional safeguard: If donationDate is earlier than their last recorded donation date
        if (donor.getLastDonationDate() != null && donationDate.isBefore(donor.getLastDonationDate())) {
            throw new BusinessRuleException(
                    "New donation date (" + donationDate + ") cannot be earlier than the last recorded donation date (" + donor.getLastDonationDate() + ").");
        }

        // 4. Create and save DonationRecord
        DonationRecord record = new DonationRecord();
        record.setDonationDate(donationDate);
        record.setDonor(donor);
        DonationRecord savedRecord = donationRecordRepository.save(record);

        // 5. Update donor.lastDonationDate and set available = false (90-day cooldown begins)
        donor.setLastDonationDate(donationDate);
        donor.setAvailable(false);
        donorRepository.save(donor);

        return DonationResponse.fromEntity(savedRecord);
    }
}
