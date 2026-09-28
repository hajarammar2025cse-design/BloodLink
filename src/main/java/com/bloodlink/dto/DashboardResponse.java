package com.bloodlink.dto;

import java.util.List;
import java.util.Map;

public class DashboardResponse {

    private long totalDonors;
    private long availableDonors;
    private long unavailableDonors;
    private long totalDonations;
    private Map<String, Long> bloodGroupDistribution;
    private List<DonationResponse> recentDonations;

    public DashboardResponse() {
    }

    public DashboardResponse(long totalDonors, long availableDonors, long unavailableDonors, long totalDonations, Map<String, Long> bloodGroupDistribution, List<DonationResponse> recentDonations) {
        this.totalDonors = totalDonors;
        this.availableDonors = availableDonors;
        this.unavailableDonors = unavailableDonors;
        this.totalDonations = totalDonations;
        this.bloodGroupDistribution = bloodGroupDistribution;
        this.recentDonations = recentDonations;
    }

    public long getTotalDonors() {
        return totalDonors;
    }

    public void setTotalDonors(long totalDonors) {
        this.totalDonors = totalDonors;
    }

    public long getAvailableDonors() {
        return availableDonors;
    }

    public void setAvailableDonors(long availableDonors) {
        this.availableDonors = availableDonors;
    }

    public long getUnavailableDonors() {
        return unavailableDonors;
    }

    public void setUnavailableDonors(long unavailableDonors) {
        this.unavailableDonors = unavailableDonors;
    }

    public long getTotalDonations() {
        return totalDonations;
    }

    public void setTotalDonations(long totalDonations) {
        this.totalDonations = totalDonations;
    }

    public Map<String, Long> getBloodGroupDistribution() {
        return bloodGroupDistribution;
    }

    public void setBloodGroupDistribution(Map<String, Long> bloodGroupDistribution) {
        this.bloodGroupDistribution = bloodGroupDistribution;
    }

    public List<DonationResponse> getRecentDonations() {
        return recentDonations;
    }

    public void setRecentDonations(List<DonationResponse> recentDonations) {
        this.recentDonations = recentDonations;
    }
}
