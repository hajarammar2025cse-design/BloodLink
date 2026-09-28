package com.bloodlink.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import java.time.LocalDate;

public class DonationRequest {

    @NotNull(message = "Donor ID is required")
    private Long donorId;

    @NotNull(message = "Donation date is required")
    @PastOrPresent(message = "Donation date cannot be in the future")
    private LocalDate donationDate;

    public DonationRequest() {
    }

    public DonationRequest(Long donorId, LocalDate donationDate) {
        this.donorId = donorId;
        this.donationDate = donationDate;
    }

    public Long getDonorId() {
        return donorId;
    }

    public void setDonorId(Long donorId) {
        this.donorId = donorId;
    }

    public LocalDate getDonationDate() {
        return donationDate;
    }

    public void setDonationDate(LocalDate donationDate) {
        this.donationDate = donationDate;
    }
}
