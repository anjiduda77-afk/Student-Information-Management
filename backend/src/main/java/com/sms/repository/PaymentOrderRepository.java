package com.sms.repository;

import com.sms.entity.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {
    Optional<PaymentOrder> findByOrderId(String orderId);
    Optional<PaymentOrder> findByGatewayOrderId(String gatewayOrderId);
    List<PaymentOrder> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
