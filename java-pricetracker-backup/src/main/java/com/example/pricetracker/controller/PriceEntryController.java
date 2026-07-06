package com.example.pricetracker.controller;

import com.example.pricetracker.model.PriceEntry;
import com.example.pricetracker.model.Product;
import com.example.pricetracker.model.Vendor;
import com.example.pricetracker.service.PriceEntryService;
import com.example.pricetracker.service.ProductService;
import com.example.pricetracker.service.VendorService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.time.LocalDateTime;
import java.util.List;

@Controller
public class PriceEntryController {

    private final PriceEntryService priceEntryService;
    private final ProductService productService;
    private final VendorService vendorService;

    public PriceEntryController(PriceEntryService priceEntryService, ProductService productService, VendorService vendorService) {
        this.priceEntryService = priceEntryService;
        this.productService = productService;
        this.vendorService = vendorService;
    }

    // List all price entries
    @GetMapping("/prices")
    public String listPriceEntries(Model model) {
        model.addAttribute("prices", priceEntryService.getAllPriceEntries());
        return "prices"; // maps to prices.html
    }

    // Show form to add new price entry
    @GetMapping("/prices/add")
    public String showAddForm(Model model) {
        List<Product> products = productService.getAllProducts();
        List<Vendor> vendors = vendorService.getAllVendors();
        model.addAttribute("priceEntry", new PriceEntry());
        model.addAttribute("products", products);
        model.addAttribute("vendors", vendors);
        return "add_price"; // maps to add_price.html
    }

    // Handle form submission
    @PostMapping("/prices/add")
    public String addPriceEntry(@ModelAttribute PriceEntry priceEntry) {
        priceEntry.setDateAdded(LocalDateTime.now());
        priceEntryService.savePriceEntry(priceEntry);
        return "redirect:/prices";
    }
}
