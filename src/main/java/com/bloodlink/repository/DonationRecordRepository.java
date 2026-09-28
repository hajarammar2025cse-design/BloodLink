package com.bloodlink.repository;

import com.bloodlink.model.DonationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRecordRepository extends JpaRepository<DonationRecord, Long> {

    List<DonationRecord> findAllByOrderByDonationDateDescIdDesc();

    List<DonationRecord> findTop10ByOrderByDonationDateDescIdDesc();

    List<DonationRecord> findByDonorIdOrderByDonationDateDesc(Long donorId);

    void deleteByDonorId(Long donorId);
}
