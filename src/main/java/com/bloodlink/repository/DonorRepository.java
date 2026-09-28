package com.bloodlink.repository;

import com.bloodlink.model.Donor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Long> {

    List<Donor> findAllByOrderByIdDesc();

    List<Donor> findByAvailableTrueOrderByIdDesc();

    @Query("SELECT d FROM Donor d WHERE d.available = true " +
           "AND (:bloodGroupName IS NULL OR LOWER(d.bloodGroup.name) = LOWER(:bloodGroupName)) " +
           "AND (:city IS NULL OR LOWER(d.city) LIKE LOWER(CONCAT('%', :city, '%'))) " +
           "ORDER BY d.id DESC")
    List<Donor> searchAvailableDonors(@Param("bloodGroupName") String bloodGroupName,
                                      @Param("city") String city);

    long countByAvailable(Boolean available);

    long countByBloodGroupId(Long bloodGroupId);
}
