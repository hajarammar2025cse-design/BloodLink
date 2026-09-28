package com.bloodlink.dto;

import com.bloodlink.model.DonationRecord;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DonationResponse {

    private Long id;
    private LocalDate donationDate;
    private Long donorId;
    private String donorName;
    private String bloodGroup;
    private String city;
    private String phone;
    private LocalDateTime createdAt;

    public DonationResponse() {
    }

    public static DonationResponse fromEntity(DonationRecord record) {
        DonationResponse dto = new DonationResponse();
        dto.setId(record.getId());
        dto.setDonationDate(record.getDonationDate());
        dto.setCreatedAt(record.getCreatedAt());

        if (record.getDonor() != null) {
            dto.setDonorId(record.getDonor().getId());
            dto.setDonorName(record.getDonor().getFullName());
            if (record.getDonor().getBloodGroup() != null) {
                dto.setBloodGroup(record.getDonor().getBloodGroup().getName());
            }
            dto.setCity(record.getDonor().getCity());
            dto.setPhone(record.getDonor().getPhone());
        }

        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDonationDate() {
        return donationDate;
    }

    public void setDonationDate(LocalDate donationDate) {
        this.donationDate = donationDate;
    }

    public Long getDonorId() {
        return donorId;
    }

    public void setDonorId(Long donorId) {
        this.donorId = donorId;
    }

    public String getDonorName() {
        return donorName;
    }

    public void setDonorName(String donorName) {
        this.donorName = donorName;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
