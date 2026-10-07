package com.shiftops.user.repository;

import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithPessimisticLock(@Param("id") UUID id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.primaryBranch WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmailIgnoreCaseWithBranch(@Param("email") String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByPrimaryBranchId(UUID branchId);

    long countByPrimaryBranchId(UUID branchId);

    long countByPrimaryBranchIdAndIsActiveTrue(UUID branchId);

    long countByPrimaryBranchIdAndRole(UUID branchId, Role role);
}
