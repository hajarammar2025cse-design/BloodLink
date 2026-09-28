package com.bloodlink.service;

import com.bloodlink.model.BloodGroup;
import com.bloodlink.repository.BloodGroupRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BloodGroupService {

    private final BloodGroupRepository bloodGroupRepository;

    public BloodGroupService(BloodGroupRepository bloodGroupRepository) {
        this.bloodGroupRepository = bloodGroupRepository;
    }

    public List<BloodGroup> getAllBloodGroups() {
        return bloodGroupRepository.findAll();
    }

    public BloodGroup getById(Long id) {
        return bloodGroupRepository.findById(id).orElse(null);
    }
}
