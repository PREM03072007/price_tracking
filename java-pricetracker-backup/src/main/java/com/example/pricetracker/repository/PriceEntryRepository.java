package com.example.pricetracker.repository;

import com.example.pricetracker.model.PriceEntry;
import com.example.pricetracker.model.Product;
import com.example.pricetracker.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceEntryRepository extends JpaRepository<PriceEntry, Long> {
    // Find all price entries for a specific product
    List<PriceEntry> findByProduct(Product product);

    // Find all price entries for a specific vendor
    List<PriceEntry> findByVendor(Vendor vendor);
}
