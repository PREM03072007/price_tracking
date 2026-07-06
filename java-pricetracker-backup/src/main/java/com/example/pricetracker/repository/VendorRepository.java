package com.example.pricetracker.repository;

import com.example.pricetracker.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
    // Optional: find vendor by name
    Vendor findByName(String name);
}
