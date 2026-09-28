package com.bloodlink.controller;

import com.bloodlink.model.BloodGroup;
import com.bloodlink.service.BloodGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/blood-groups")
public class BloodGroupController {

    private final BloodGroupService bloodGroupService;

    public BloodGroupController(BloodGroupService bloodGroupService) {
        this.bloodGroupService = bloodGroupService;
    }

    @GetMapping
    public ResponseEntity<List<BloodGroup>> getAllBloodGroups() {
        return ResponseEntity.ok(bloodGroupService.getAllBloodGroups());
    }
}
