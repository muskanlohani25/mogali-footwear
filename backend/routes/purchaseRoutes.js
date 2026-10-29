const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');

// Helper to generate bill number like MF-1001, MF-1002
async function generateBillNumber() {
  const count = await Purchase.countDocuments();
  return `MF-${1001 + count}`;
}

// Helper to check if transactions are supported by the connected MongoDB deployment
function areTransactionsSupported() {
  const type = mongoose.connection.client?.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
}

// Transaction execution helper (uses database transactions where supported, with safe error handling)
async function executeWithTransaction(operation) {
  if (!areTransactionsSupported()) {
    // Standalone MongoDB: execute safely without multi-document session transaction
    return await operation(null);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// GET all purchases with customer populated
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let purchases = await Purchase.find()
      .populate('customer', 'name phone email tier loyaltyPoints totalQualifyingPurchases qualifyingPurchasesInCycle rewardAvailable')
      .sort({ purchaseDate: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      purchases = purchases.filter((p) => {
        const billMatch = p.billNumber && p.billNumber.toLowerCase().includes(q);
        const idMatch = p._id && p._id.toString().toLowerCase().includes(q);
        const customerNameMatch = p.customer && p.customer.name && p.customer.name.toLowerCase().includes(q);
        const customerPhoneMatch = p.customer && p.customer.phone && p.customer.phone.includes(q);
        return billMatch || idMatch || customerNameMatch || customerPhoneMatch;
      });
    }

    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchases: ' + err.message });
  }
});

// GET discount preview for customer and purchase amount (backend calculation)
router.get('/discount-preview', async (req, res) => {
  try {
    const { customerId, amount } = req.query;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid Customer ID format.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const originalAmount = Math.max(0, parseFloat(amount) || 0);

    // Business rule: After five qualifying purchases, customer earns 10% discount on their next eligible purchase
    const cyclePurchases = customer.qualifyingPurchasesInCycle || 0;
    const isRewardEligible = customer.rewardAvailable || cyclePurchases >= 5;

    let discountPercent = 0;
    let discountAmount = 0;

    if (isRewardEligible && originalAmount > 0) {
      discountPercent = 10;
      discountAmount = Math.round(originalAmount * 0.10);
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const purchasesNeededForNextReward = isRewardEligible ? 0 : Math.max(0, 5 - cyclePurchases);

    res.json({
      customerId: customer._id,
      customerName: customer.name,
      totalQualifyingPurchases: customer.totalQualifyingPurchases || 0,
      qualifyingPurchasesInCycle: cyclePurchases,
      purchasesNeededForNextReward,
      isRewardEligible,
      discountPercent,
      originalAmount,
      discountAmount,
      finalAmount,
      message: isRewardEligible
        ? '🎉 10% Loyalty Reward applied! (Earned after completing 5 qualifying purchases)'
        : `${cyclePurchases} of 5 qualifying purchases completed in current cycle (${purchasesNeededForNextReward} more purchase${purchasesNeededForNextReward === 1 ? '' : 's'} needed for 10% discount).`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate discount preview: ' + err.message });
  }
});

// POST record new purchase with loyalty discount & duplicate submission prevention
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      amount,
      billAmount,
      items,
      paymentMethod = 'UPI / QR',
      purchaseDate,
      submissionToken,
    } = req.body;

    // 1. Validate Customer
    if (!customerId) {
      return res.status(400).json({ error: 'Customer is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID format.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // 2. Validate Amount
    const originalAmount = parseFloat(amount !== undefined ? amount : billAmount);
    if (isNaN(originalAmount) || originalAmount <= 0) {
      return res.status(400).json({ error: 'Valid purchase amount greater than ₹0 is required.' });
    }

    // 3. Prevent Duplicate Submissions (idempotency check)
    if (submissionToken && typeof submissionToken === 'string' && submissionToken.trim().length > 0) {
      const existingPurchase = await Purchase.findOne({ submissionToken: submissionToken.trim() })
        .populate('customer', 'name phone email tier totalQualifyingPurchases qualifyingPurchasesInCycle rewardAvailable');
      if (existingPurchase) {
        return res.status(200).json({
          message: 'Duplicate submission detected; returning existing recorded purchase without re-charging.',
          duplicatePrevented: true,
          purchase: existingPurchase,
        });
      }
    }

    // 4. Calculate Discount & Final Amount on the Backend
    const cyclePurchases = customer.qualifyingPurchasesInCycle || 0;
    const isRewardEligible = customer.rewardAvailable || cyclePurchases >= 5;

    let discountAmount = 0;
    let loyaltyDiscountApplied = false;
    let loyaltyDiscountPercent = 0;

    if (isRewardEligible) {
      loyaltyDiscountPercent = 10;
      discountAmount = Math.round(originalAmount * 0.10);
      loyaltyDiscountApplied = true;
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    // 5. Generate Bill Number and Prepare Purchase Object
    const billNumber = await generateBillNumber();
    let purchaseTimestamp = new Date();
    if (purchaseDate) {
      const parsed = new Date(purchaseDate);
      if (!isNaN(parsed.getTime())) {
        purchaseTimestamp = parsed;
      }
    }

    const purchaseItems =
      Array.isArray(items) && items.length > 0
        ? items
        : [{ category: 'Sneakers', description: 'Footwear Purchase', quantity: 1, price: originalAmount }];

    // Loyalty points calculation: 1 point per ₹20 paid (5% loyalty rewards)
    const pointsEarned = Math.floor(finalAmount * 0.05);

    // 6. Execute Database Write using transaction where supported
    const savedResult = await executeWithTransaction(async (session) => {
      // Create and save Purchase
      const purchaseDoc = new Purchase({
        billNumber,
        customer: customer._id,
        items: purchaseItems,
        originalAmount,
        billAmount: originalAmount,
        discountAmount,
        loyaltyDiscountApplied,
        loyaltyDiscountPercent,
        finalAmount,
        pointsEarned,
        paymentMethod,
        purchaseDate: purchaseTimestamp,
        submissionToken: submissionToken ? submissionToken.trim() : undefined,
      });

      if (session) {
        await purchaseDoc.save({ session });
      } else {
        await purchaseDoc.save();
      }

      // Update Customer Totals & Loyalty Cycle Consistently
      // Rule 1: Each completed purchase counts as one qualifying purchase
      customer.totalQualifyingPurchases = (customer.totalQualifyingPurchases || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + finalAmount;

      // Rule 2 & 3: If reward was redeemed, start a new cycle. Otherwise, increment cycle counter.
      if (loyaltyDiscountApplied) {
        // Redeem the reward only once, then start a new cycle
        customer.rewardAvailable = false;
        customer.qualifyingPurchasesInCycle = 0; // Fresh cycle starts!
        customer.rewardCyclesCompleted = (customer.rewardCyclesCompleted || 0) + 1;
      } else {
        customer.qualifyingPurchasesInCycle = cyclePurchases + 1;
        // After 5 qualifying purchases, customer earns 10% discount on next eligible purchase
        if (customer.qualifyingPurchasesInCycle >= 5) {
          customer.rewardAvailable = true;
        }
      }

      customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;
      customer.updateTier();

      if (session) {
        await customer.save({ session });
      } else {
        await customer.save();
      }

      return purchaseDoc;
    });

    const populated = await Purchase.findById(savedResult._id).populate(
      'customer',
      'name phone email tier loyaltyPoints totalQualifyingPurchases qualifyingPurchasesInCycle rewardAvailable'
    );

    res.status(201).json({
      message: loyaltyDiscountApplied
        ? 'Purchase recorded with 10% Loyalty Discount applied! New reward cycle started.'
        : 'Purchase recorded successfully.',
      purchase: populated,
      customerSummary: {
        totalQualifyingPurchases: customer.totalQualifyingPurchases,
        qualifyingPurchasesInCycle: customer.qualifyingPurchasesInCycle,
        rewardAvailable: customer.rewardAvailable,
        totalSpent: customer.totalSpent,
        loyaltyPoints: customer.loyaltyPoints,
        tier: customer.tier,
      },
      discountDetails: {
        originalAmount,
        discountPercent: loyaltyDiscountPercent,
        discountAmount,
        finalAmount,
        loyaltyDiscountApplied,
      },
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.submissionToken) {
      return res.status(409).json({ error: 'Duplicate purchase submission detected.' });
    }
    res.status(500).json({ error: 'Failed to record purchase: ' + err.message });
  }
});

module.exports = router;
