package com.bloodlink.controller;

import com.bloodlink.dto.ApiResponse;
import com.bloodlink.dto.DonationRequest;
import com.bloodlink.dto.DonationResponse;
import com.bloodlink.service.DonationRecordService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donations")
public class DonationRecordController {

    private final DonationRecordService donationRecordService;

    public DonationRecordController(DonationRecordService donationRecordService) {
        this.donationRecordService = donationRecordService;
    }

    @GetMapping
    public ResponseEntity<List<DonationResponse>> getAllDonations() {
        return ResponseEntity.ok(donationRecordService.getAllDonations());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DonationResponse>> recordDonation(@Valid @RequestBody DonationRequest request) {
        DonationResponse recorded = donationRecordService.recordDonation(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Donation recorded successfully. Donor has entered the 90-day cooldown period.", recorded));
    }
}
