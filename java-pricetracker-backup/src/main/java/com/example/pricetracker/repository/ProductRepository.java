package com.example.pricetracker.repository;

import com.example.pricetracker.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Optional: find products by name
    Product findByName(String name);
}
