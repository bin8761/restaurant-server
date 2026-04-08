package com.restaurant.tableservice.repository;

import com.restaurant.tableservice.entity.TableReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TableReservationRepository extends JpaRepository<TableReservation, Integer> {

    List<TableReservation> findByTableIdOrderByStartTimeAsc(Integer tableId);

    @Query(value = "SELECT COUNT(*) FROM table_reservations " +
            "WHERE table_id = :tableId " +
            "AND status IN ('pending', 'confirmed') " +
            "AND NOT (end_time <= :startTime OR start_time >= :endTime)", nativeQuery = true)
    Integer countOverlappingReservations(
            @Param("tableId") Integer tableId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query(value = "SELECT * FROM table_reservations " +
            "WHERE table_id = :tableId " +
            "AND start_time >= :fromTime AND start_time <= :toTime " +
            "ORDER BY start_time ASC", nativeQuery = true)
    List<TableReservation> findByTableIdAndStartTimeBetween(
            @Param("tableId") Integer tableId,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime
    );

    List<TableReservation> findByCustomerIdOrderByStartTimeDesc(Integer customerId);

        List<TableReservation> findAllByOrderByStartTimeDesc();

        List<TableReservation> findByStatusOrderByStartTimeDesc(String status);

    List<TableReservation> findByTableIdAndStatusIn(Integer tableId, List<String> statuses);

    void deleteByTableId(Integer tableId);

    /**
     * Tìm reservation confirmed tiếp theo của một bàn sau thời điểm cho trước.
     * Chỉ hiển thị lịch khi đơn đã được xác nhận.
     */
    @Query(value = "SELECT * FROM table_reservations " +
            "WHERE table_id = :tableId " +
            "AND status = 'confirmed' " +
            "AND start_time > :from " +
            "ORDER BY start_time ASC LIMIT 1", nativeQuery = true)
    java.util.Optional<TableReservation> findNextUpcomingReservation(
            @Param("tableId") Integer tableId,
            @Param("from") LocalDateTime from
    );
}
