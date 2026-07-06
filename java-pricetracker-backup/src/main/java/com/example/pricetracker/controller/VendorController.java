package com.example.pricetracker.controller;

import com.example.pricetracker.model.Vendor;
import com.example.pricetracker.service.VendorService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@Controller
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping("/vendors")
    public String listVendors(Model model) {
        model.addAttribute("vendors", vendorService.getAllVendors());
        return "vendors"; // maps to vendors.html
    }

    @GetMapping("/vendors/add")
    public String showAddForm(Model model) {
        model.addAttribute("vendor", new Vendor());
        return "add_vendor"; // maps to add_vendor.html
    }

    @PostMapping("/vendors/add")
    public String addVendor(@ModelAttribute Vendor vendor) {
        vendorService.saveVendor(vendor);
        return "redirect:/vendors";
    }
}
