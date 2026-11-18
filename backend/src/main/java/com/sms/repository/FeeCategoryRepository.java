package com.sms.repository;

import com.sms.entity.FeeCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeeCategoryRepository extends JpaRepository<FeeCategory, Long> {
    Optional<FeeCategory> findByCode(String code);
    boolean existsByCode(String code);
    List<FeeCategory> findByIsActiveTrueOrderByCodeAsc();
}
