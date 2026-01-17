package com.dispatch.repository;

import com.dispatch.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByDispatchIdOrderByCreatedAtAsc(Long dispatchId);

    List<ChatMessage> findByDispatchIdOrderByCreatedAtDesc(Long dispatchId);

    @Query("SELECT m FROM ChatMessage m WHERE m.dispatchId = :dispatchId AND m.isRead = false AND m.senderId != :userId")
    List<ChatMessage> findUnreadMessages(@Param("dispatchId") Long dispatchId, @Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.dispatchId = :dispatchId AND m.isRead = false AND m.senderId != :userId")
    int countUnreadMessages(@Param("dispatchId") Long dispatchId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true, m.readAt = :now WHERE m.dispatchId = :dispatchId AND m.senderId != :userId AND m.isRead = false")
    int markAsRead(@Param("dispatchId") Long dispatchId, @Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Query("SELECT m FROM ChatMessage m WHERE m.dispatchId = :dispatchId AND m.createdAt > :since ORDER BY m.createdAt ASC")
    List<ChatMessage> findMessagesSince(@Param("dispatchId") Long dispatchId, @Param("since") LocalDateTime since);
}
