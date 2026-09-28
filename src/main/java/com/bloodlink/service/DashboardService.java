package com.bloodlink.service;

import com.bloodlink.dto.DashboardResponse;
import com.bloodlink.dto.DonationResponse;
import com.bloodlink.model.BloodGroup;
import com.bloodlink.model.Donor;
import com.bloodlink.repository.BloodGroupRepository;
import com.bloodlink.repository.DonationRecordRepository;
import com.bloodlink.repository.DonorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final DonorRepository donorRepository;
    private final BloodGroupRepository bloodGroupRepository;
    private final DonationRecordRepository donationRecordRepository;
    private final DonorService donorService;
    private final DonationRecordService donationRecordService;

    public DashboardService(DonorRepository donorRepository,
                            BloodGroupRepository bloodGroupRepository,
                            DonationRecordRepository donationRecordRepository,
                            DonorService donorService,
                            DonationRecordService donationRecordService) {
        this.donorRepository = donorRepository;
        this.bloodGroupRepository = bloodGroupRepository;
        this.donationRecordRepository = donationRecordRepository;
        this.donorService = donorService;
        this.donationRecordService = donationRecordService;
    }

    @Transactional
    public DashboardResponse getDashboardStatistics() {
        // Sync all donors availability first
        List<Donor> allDonors = donorRepository.findAll();
        long availableCount = 0;
        long unavailableCount = 0;

        for (Donor donor : allDonors) {
            donorService.syncDonorAvailability(donor);
            if (donor.getAvailable()) {
                availableCount++;
            } else {
                unavailableCount++;
            }
        }

        long totalDonors = allDonors.size();
        long totalDonations = donationRecordRepository.count();

        // Blood group distribution
        Map<String, Long> distribution = new LinkedHashMap<>();
        List<BloodGroup> bloodGroups = bloodGroupRepository.findAll();
        for (BloodGroup bg : bloodGroups) {
            long count = donorRepository.countByBloodGroupId(bg.getId());
            distribution.put(bg.getName(), count);
        }

        // Recent donations
        List<DonationResponse> recentDonations = donationRecordService.getRecentDonations();

        return new DashboardResponse(
                totalDonors,
                availableCount,
                unavailableCount,
                totalDonations,
                distribution,
                recentDonations
        );
    }
}
