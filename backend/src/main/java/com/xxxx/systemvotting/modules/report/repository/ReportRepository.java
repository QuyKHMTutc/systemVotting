package com.xxxx.systemvotting.modules.report.repository;

import com.xxxx.systemvotting.modules.report.entity.Report;
import com.xxxx.systemvotting.modules.report.enums.ReportStatus;
import com.xxxx.systemvotting.modules.report.enums.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);
    Page<Report> findByTargetType(ReportTargetType targetType, Pageable pageable);
    Page<Report> findByStatusAndTargetType(ReportStatus status, ReportTargetType targetType, Pageable pageable);
    boolean existsByReporterIdAndTargetTypeAndTargetId(Long reporterId, ReportTargetType targetType, Long targetId);
}
