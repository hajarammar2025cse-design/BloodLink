package com.bloodlink;

import com.bloodlink.model.BloodGroup;
import com.bloodlink.model.DonationRecord;
import com.bloodlink.model.Donor;
import com.bloodlink.repository.BloodGroupRepository;
import com.bloodlink.repository.DonationRecordRepository;
import com.bloodlink.repository.DonorRepository;
import com.bloodlink.service.DonorService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private final BloodGroupRepository bloodGroupRepository;
    private final DonorRepository donorRepository;
    private final DonationRecordRepository donationRecordRepository;
    private final DonorService donorService;

    public DataInitializer(BloodGroupRepository bloodGroupRepository,
                           DonorRepository donorRepository,
                           DonationRecordRepository donationRecordRepository,
                           DonorService donorService) {
        this.bloodGroupRepository = bloodGroupRepository;
        this.donorRepository = donorRepository;
        this.donationRecordRepository = donationRecordRepository;
        this.donorService = donorService;
    }

    @Override
    public void run(String... args) {
        // 1. Seed Blood Groups if empty
        String[] groupNames = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};
        Map<String, BloodGroup> groupMap = new HashMap<>();

        for (String name : groupNames) {
            BloodGroup group = bloodGroupRepository.findByName(name)
                    .orElseGet(() -> bloodGroupRepository.save(new BloodGroup(name)));
            groupMap.put(name, group);
        }

        // 2. Seed Sample Donors if no donors exist
        if (donorRepository.count() == 0) {
            // Rahul (Specified test case: O+, Coimbatore, last donation 2026-09-01 -> Cooldown)
            Donor rahul = createDonor(
                    "Rahul",
                    groupMap.get("O+"),
                    "Coimbatore",
                    "9876543210",
                    "rahul.donor@example.com",
                    LocalDate.of(2026, 9, 1)
            );

            // Other diverse sample donors across Tamil Nadu cities
            createDonor(
                    "Priya Sharma",
                    groupMap.get("A+"),
                    "Coimbatore",
                    "9876543211",
                    "priya.sharma@example.com",
                    LocalDate.of(2026, 5, 15) // > 90 days ago -> Eligible
            );

            createDonor(
                    "Karthik Raj",
                    groupMap.get("B+"),
                    "Chennai",
                    "9876543212",
                    "karthik.raj@example.com",
                    null // Never donated -> Eligible
            );

            createDonor(
                    "Ananya Iyer",
                    groupMap.get("AB+"),
                    "Salem",
                    "9876543213",
                    "ananya.iyer@example.com",
                    LocalDate.of(2026, 4, 10) // Eligible
            );

            createDonor(
                    "Suresh Kumar",
                    groupMap.get("O-"),
                    "Erode",
                    "9876543214",
                    "suresh.k@example.com",
                    LocalDate.of(2026, 9, 10) // Cooldown
            );

            createDonor(
                    "Deepa Nathan",
                    groupMap.get("B-"),
                    "Tiruchengode",
                    "9876543215",
                    "deepa.n@example.com",
                    LocalDate.of(2026, 3, 20) // Eligible
            );

            createDonor(
                    "Vigneshwaran S",
                    groupMap.get("O+"),
                    "Namakkal",
                    "9876543216",
                    "vignesh.s@example.com",
                    LocalDate.of(2026, 6, 1) // Eligible
            );

            createDonor(
                    "Meenakshi Sundaram",
                    groupMap.get("A-"),
                    "Chennai",
                    "9876543217",
                    "meenakshi.s@example.com",
                    LocalDate.of(2026, 9, 18) // Cooldown
            );

            createDonor(
                    "Prakash M",
                    groupMap.get("AB-"),
                    "Coimbatore",
                    "9876543218",
                    "prakash.m@example.com",
                    null // Eligible
            );

            // Add sample donation records for donors with donation dates
            createDonationRecord(rahul, LocalDate.of(2026, 9, 1));
        }
    }

    private Donor createDonor(String name, BloodGroup group, String city, String phone, String email, LocalDate lastDate) {
        Donor donor = new Donor();
        donor.setFullName(name);
        donor.setBloodGroup(group);
        donor.setCity(city);
        donor.setPhone(phone);
        donor.setEmail(email);
        donor.setLastDonationDate(lastDate);
        donor.setAvailable(donorService.isEligible(donor));
        return donorRepository.save(donor);
    }

    private void createDonationRecord(Donor donor, LocalDate donationDate) {
        DonationRecord record = new DonationRecord();
        record.setDonor(donor);
        record.setDonationDate(donationDate);
        donationRecordRepository.save(record);
    }
}
