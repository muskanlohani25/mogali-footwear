const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');

// GET all customers (supports search by name or phone)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim()) {
      const trimmed = search.trim();
      const digitsOnly = trimmed.replace(/\D/g, '');

      // Build OR conditions: search by name, email, or phone
      const orConditions = [
        { name: { $regex: trimmed, $options: 'i' } },
        { email: { $regex: trimmed, $options: 'i' } },
      ];

      // If digits were entered, search the phone field with those digits
      if (digitsOnly.length > 0) {
        orConditions.push({ phone: { $regex: digitsOnly, $options: 'i' } });
      } else {
        orConditions.push({ phone: { $regex: trimmed, $options: 'i' } });
      }

      query = { $or: orConditions };
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customers: ' + err.message });
  }
});

// GET single customer by ID + their purchase history details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid customer ID format.' });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const purchases = await Purchase.find({ customer: customer._id }).sort({ purchaseDate: -1 });
    res.json({ customer, purchases });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customer details: ' + err.message });
  }
});

// POST add new customer with validation and duplicate prevention
router.post('/', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    // 1. Validate Customer Name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Customer name must be at least 2 characters long.' });
    }
    if (cleanName.length > 100) {
      return res.status(400).json({ error: 'Customer name cannot exceed 100 characters.' });
    }

    // 2. Validate & Normalize Phone Number
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const normalizedPhone = Customer.normalizePhone(phone);
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        error: `"${phone}" is not a valid 10-digit mobile number. Please enter a valid 10-digit number (e.g. 9876543210).`,
      });
    }

    // 3. Check for Duplicate Phone Number
    const existingCustomer = await Customer.findOne({ phone: normalizedPhone });
    if (existingCustomer) {
      return res.status(409).json({
        error: `A customer with phone number "${normalizedPhone}" already exists (${existingCustomer.name}).`,
      });
    }

    // 4. Validate Email (optional)
    let cleanEmail = '';
    if (email && typeof email === 'string' && email.trim().length > 0) {
      cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address format.' });
      }
    }

    // 5. Create Customer
    const customer = new Customer({
      name: cleanName,
      phone: normalizedPhone,
      email: cleanEmail,
      totalQualifyingPurchases: 0,
      totalSpent: 0,
      loyaltyPoints: 50, // 50 Welcome bonus points
      tier: 'Silver',
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    // Duplicate Key Error handling (code 11000)
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'A customer with this phone number already exists in the system.',
      });
    }

    // Mongoose Validation Error handling
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors)
        .map((e) => e.message)
        .join('. ');
      return res.status(400).json({ error: messages });
    }

    res.status(500).json({ error: 'Failed to create customer: ' + err.message });
  }
});

module.exports = router;
