package com.example.pricetracker.repository;

import com.example.pricetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Optional: custom query to find user by username or email
    User findByUsername(String username);
    User findByEmail(String email);
}
