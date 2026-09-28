package com.bloodlink.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public class DonorRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Blood group is required")
    private Long bloodGroupId;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be a valid 10-digit number")
    private String phone;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    @PastOrPresent(message = "Last donation date cannot be in the future")
    private LocalDate lastDonationDate;

    public DonorRequest() {
    }

    public DonorRequest(String fullName, Long bloodGroupId, String city, String phone, String email, LocalDate lastDonationDate) {
        this.fullName = fullName;
        this.bloodGroupId = bloodGroupId;
        this.city = city;
        this.phone = phone;
        this.email = email;
        this.lastDonationDate = lastDonationDate;
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
}
