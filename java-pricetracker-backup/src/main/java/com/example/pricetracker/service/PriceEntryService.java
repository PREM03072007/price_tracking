package com.example.pricetracker.service;

import com.example.pricetracker.model.PriceEntry;
import com.example.pricetracker.model.Product;
import com.example.pricetracker.model.Vendor;
import com.example.pricetracker.repository.PriceEntryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PriceEntryService {

    private final PriceEntryRepository priceEntryRepository;

    public PriceEntryService(PriceEntryRepository priceEntryRepository) {
        this.priceEntryRepository = priceEntryRepository;
    }

    public List<PriceEntry> getAllPriceEntries() {
        return priceEntryRepository.findAll();
    }

    public PriceEntry getPriceEntryById(Long id) {
        Optional<PriceEntry> entry = priceEntryRepository.findById(id);
        return entry.orElse(null);
    }

    public PriceEntry savePriceEntry(PriceEntry priceEntry) {
        return priceEntryRepository.save(priceEntry);
    }

    public void deletePriceEntry(Long id) {
        priceEntryRepository.deleteById(id);
    }

    public List<PriceEntry> getEntriesByProduct(Product product) {
        return priceEntryRepository.findByProduct(product);
    }

    public List<PriceEntry> getEntriesByVendor(Vendor vendor) {
        return priceEntryRepository.findByVendor(vendor);
    }
}
