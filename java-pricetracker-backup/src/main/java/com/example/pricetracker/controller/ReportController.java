package com.example.pricetracker.controller;

import com.example.pricetracker.model.PriceEntry;
import com.example.pricetracker.model.Product;
import com.example.pricetracker.service.PriceEntryService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class ReportController {

    private final PriceEntryService priceEntryService;

    public ReportController(PriceEntryService priceEntryService) {
        this.priceEntryService = priceEntryService;
    }

    @GetMapping("/snapshot")
    public String priceComparisonSnapshot(Model model) {
        List<PriceEntry> allPrices = priceEntryService.getAllPriceEntries();

        // Compute lowest price per product
        Map<Product, PriceEntry> snapshot = allPrices.stream()
                .collect(Collectors.groupingBy(
                        PriceEntry::getProduct,
                        Collectors.collectingAndThen(
                                Collectors.minBy((p1, p2) -> p1.getPrice().compareTo(p2.getPrice())),
                                opt -> opt.orElse(null)
                        )
                ));

        model.addAttribute("snapshot", snapshot);
        return "price_snapshot"; // maps to price_snapshot.html
    }
}
