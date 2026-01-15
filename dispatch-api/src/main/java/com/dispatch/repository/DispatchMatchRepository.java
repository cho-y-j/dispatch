package com.dispatch.repository;

import com.dispatch.entity.DispatchMatch;
import com.dispatch.entity.DispatchRequest;
import com.dispatch.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchMatchRepository extends JpaRepository<DispatchMatch, Long> {

    Optional<DispatchMatch> findByRequest(DispatchRequest request);

    List<DispatchMatch> findByDriver(Driver driver);

    List<DispatchMatch> findByDriverAndStatus(Driver driver, DispatchMatch.MatchStatus status);

    @Query("SELECT m FROM DispatchMatch m WHERE m.driver = :driver ORDER BY m.matchedAt DESC")
    List<DispatchMatch> findByDriverOrderByMatchedAtDesc(@Param("driver") Driver driver);

    @Query("SELECT m FROM DispatchMatch m WHERE m.driver = :driver AND m.status NOT IN ('COMPLETED', 'SIGNED', 'CANCELLED')")
    List<DispatchMatch> findActiveMatchesByDriver(@Param("driver") Driver driver);
}
