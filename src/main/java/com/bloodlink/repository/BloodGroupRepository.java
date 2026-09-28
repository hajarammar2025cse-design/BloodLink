package com.bloodlink.repository;

import com.bloodlink.model.BloodGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BloodGroupRepository extends JpaRepository<BloodGroup, Long> {
    Optional<BloodGroup> findByName(String name);
    Optional<BloodGroup> findByNameIgnoreCase(String name);
}
