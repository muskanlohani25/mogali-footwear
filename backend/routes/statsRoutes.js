const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');

// GET dashboard statistics derived entirely from MongoDB
router.get('/', async (req, res) => {
  try {
    // 1. Total registered customers from MongoDB
    const totalCustomers = await Customer.countDocuments();

    // 2. Completed purchases count from MongoDB
    const completedPurchases = await Purchase.countDocuments();

    // 3. MongoDB Aggregation pipeline to derive total sales, discounts granted, and original volume
    const salesAgg = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$finalAmount' },
          discountsGranted: { $sum: '$discountAmount' },
          totalOriginalAmount: { $sum: { $ifNull: ['$originalAmount', '$billAmount'] } },
        },
      },
    ]);

    const totalSales = salesAgg.length > 0 ? salesAgg[0].totalSales : 0;
    const discountsGranted = salesAgg.length > 0 ? salesAgg[0].discountsGranted : 0;
    const totalOriginalAmount = salesAgg.length > 0 ? salesAgg[0].totalOriginalAmount : 0;

    // 4. Circulating active loyalty points aggregation from Customer collection
    const pointsAgg = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalActivePoints: { $sum: '$loyaltyPoints' },
        },
      },
    ]);
    const totalActivePoints = pointsAgg.length > 0 ? pointsAgg[0].totalActivePoints : 0;

    // 5. Tier breakdown derived from MongoDB queries
    const [silverCount, goldCount, platinumCount] = await Promise.all([
      Customer.countDocuments({ tier: 'Silver' }),
      Customer.countDocuments({ tier: 'Gold' }),
      Customer.countDocuments({ tier: 'Platinum' }),
    ]);

    // 6. Recent in-store purchases
    const recentPurchases = await Purchase.find()
      .populate('customer', 'name phone tier')
      .sort({ purchaseDate: -1 })
      .limit(5);

    // 7. Top loyal customer champions
    const topLoyalCustomers = await Customer.find()
      .sort({ loyaltyPoints: -1 })
      .limit(5);

    res.json({
      totalCustomers,
      completedPurchases,
      totalPurchases: completedPurchases,
      totalSales,
      totalRevenue: totalSales,
      discountsGranted,
      totalOriginalAmount,
      totalActivePoints,
      tierDistribution: {
        silver: silverCount,
        gold: goldCount,
        platinum: platinumCount,
      },
      recentPurchases,
      topLoyalCustomers,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to derive dashboard statistics: ' + err.message });
  }
});

module.exports = router;
