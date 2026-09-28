package com.bloodlink.dto;

import com.bloodlink.model.Donor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class DonorResponse {

    private Long id;
    private String fullName;
    private Long bloodGroupId;
    private String bloodGroupName;
    private String city;
    private String phone;
    private String email;
    private LocalDate lastDonationDate;
    private Boolean available;
    private LocalDate eligibleDate;
    private Long daysRemaining;
    private LocalDateTime createdAt;

    public DonorResponse() {
    }

    public static DonorResponse fromEntity(Donor donor) {
        DonorResponse dto = new DonorResponse();
        dto.setId(donor.getId());
        dto.setFullName(donor.getFullName());
        if (donor.getBloodGroup() != null) {
            dto.setBloodGroupId(donor.getBloodGroup().getId());
            dto.setBloodGroupName(donor.getBloodGroup().getName());
        }
        dto.setCity(donor.getCity());
        dto.setPhone(donor.getPhone());
        dto.setEmail(donor.getEmail());
        dto.setLastDonationDate(donor.getLastDonationDate());
        dto.setAvailable(donor.getAvailable());
        dto.setCreatedAt(donor.getCreatedAt());

        if (donor.getLastDonationDate() != null) {
            LocalDate eligibleDate = donor.getLastDonationDate().plusDays(90);
            dto.setEligibleDate(eligibleDate);
            LocalDate today = LocalDate.now();
            if (today.isBefore(eligibleDate)) {
                dto.setDaysRemaining(ChronoUnit.DAYS.between(today, eligibleDate));
            } else {
                dto.setDaysRemaining(0L);
            }
        } else {
            dto.setEligibleDate(null);
            dto.setDaysRemaining(0L);
        }

        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Long getBloodGroupId() {
        return bloodGroupId;
    }

    public void setBloodGroupId(Long bloodGroupId) {
        this.bloodGroupId = bloodGroupId;
    }

    public String getBloodGroupName() {
        return bloodGroupName;
    }

    public void setBloodGroupName(String bloodGroupName) {
        this.bloodGroupName = bloodGroupName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getLastDonationDate() {
        return lastDonationDate;
    }

    public void setLastDonationDate(LocalDate lastDonationDate) {
        this.lastDonationDate = lastDonationDate;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }

    public LocalDate getEligibleDate() {
        return eligibleDate;
    }

    public void setEligibleDate(LocalDate eligibleDate) {
        this.eligibleDate = eligibleDate;
    }

    public Long getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(Long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
