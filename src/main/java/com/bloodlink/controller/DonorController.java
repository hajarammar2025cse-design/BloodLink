package com.bloodlink.controller;

import com.bloodlink.dto.ApiResponse;
import com.bloodlink.dto.DonorRequest;
import com.bloodlink.dto.DonorResponse;
import com.bloodlink.service.DonorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    private final DonorService donorService;

    public DonorController(DonorService donorService) {
        this.donorService = donorService;
    }

    @GetMapping
    public ResponseEntity<List<DonorResponse>> getAllDonors() {
        return ResponseEntity.ok(donorService.getAllDonors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonorResponse> getDonorById(@PathVariable Long id) {
        return ResponseEntity.ok(donorService.getDonorById(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DonorResponse>> registerDonor(@Valid @RequestBody DonorRequest request) {
        DonorResponse created = donorService.registerDonor(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Donor registered successfully.", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DonorResponse>> updateDonor(@PathVariable Long id,
                                                                 @Valid @RequestBody DonorRequest request) {
        DonorResponse updated = donorService.updateDonor(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Donor updated successfully.", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDonor(@PathVariable Long id) {
        donorService.deleteDonor(id);
        return ResponseEntity.ok(ApiResponse.ok("Donor deleted successfully."));
    }

    @GetMapping("/search")
    public ResponseEntity<List<DonorResponse>> searchDonors(
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(donorService.searchDonors(bloodGroup, city));
    }
}
