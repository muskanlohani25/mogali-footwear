require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Purchase = require('./models/Purchase');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mogali_footwear';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Clearing existing data...');

    await Customer.deleteMany({});
    await Purchase.deleteMany({});

    console.log('Seeding initial customers with loyalty cycles...');
    // Customer staged at 4 purchases (test 5th purchase)
    const c0 = await Customer.create({
      name: 'Vikram Malhotra',
      phone: '9876500004',
      email: 'vikram.malhotra@example.com',
      totalQualifyingPurchases: 4,
      qualifyingPurchasesInCycle: 4,
      rewardAvailable: false,
      loyaltyPoints: 240,
      totalSpent: 8000,
      tier: 'Silver',
    });

    // Customer staged at 5 purchases with 10% discount ready (test 6th purchase with discount)
    const c1 = await Customer.create({
      name: 'Priya Patel',
      phone: '9812345678',
      email: 'priya.patel@example.com',
      totalQualifyingPurchases: 5,
      qualifyingPurchasesInCycle: 5,
      rewardAvailable: true,
      loyaltyPoints: 780,
      totalSpent: 15600,
      tier: 'Platinum',
    });

    const c2 = await Customer.create({
      name: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul.sharma@example.com',
      totalQualifyingPurchases: 1,
      qualifyingPurchasesInCycle: 1,
      rewardAvailable: false,
      loyaltyPoints: 320,
      totalSpent: 6400,
      tier: 'Gold',
    });

    const c3 = await Customer.create({
      name: 'Amit Verma',
      phone: '9944556677',
      email: 'amit.verma@example.com',
      totalQualifyingPurchases: 2,
      qualifyingPurchasesInCycle: 2,
      rewardAvailable: false,
      loyaltyPoints: 120,
      totalSpent: 2400,
      tier: 'Silver',
    });

    const c4 = await Customer.create({
      name: 'Sneha Reddy',
      phone: '9789012345',
      email: 'sneha.reddy@example.com',
      totalQualifyingPurchases: 0,
      qualifyingPurchasesInCycle: 0,
      rewardAvailable: false,
      loyaltyPoints: 50,
      totalSpent: 0,
      tier: 'Silver',
    });

    console.log('Seeding initial purchases...');
    await Purchase.create([
      {
        billNumber: 'MF-1001',
        customer: c2._id,
        items: [
          { category: 'Sneakers', description: 'Air Mesh Athletic Running Shoes', quantity: 1, price: 3400 },
          { category: 'Shoe Care & Accessories', description: 'Waterproof Protect Spray', quantity: 1, price: 600 },
        ],
        originalAmount: 4000,
        billAmount: 4000,
        discountAmount: 0,
        loyaltyDiscountApplied: false,
        finalAmount: 4000,
        pointsEarned: 200,
        paymentMethod: 'UPI / QR',
        purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        billNumber: 'MF-1002',
        customer: c1._id,
        items: [
          { category: 'Formal Shoes', description: 'Italian Leather Derby Brogues', quantity: 1, price: 5500 },
          { category: 'Loafers', description: 'Velvet Slip-on Loafers', quantity: 1, price: 3200 },
        ],
        originalAmount: 8700,
        billAmount: 8700,
        discountAmount: 200,
        loyaltyDiscountApplied: false,
        finalAmount: 8500,
        pointsEarned: 425,
        paymentMethod: 'Card',
        purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        billNumber: 'MF-1003',
        customer: c3._id,
        items: [
          { category: 'Sandals & Slippers', description: 'Comfort Leather Daily Sandals', quantity: 1, price: 2400 },
        ],
        originalAmount: 2400,
        billAmount: 2400,
        discountAmount: 0,
        loyaltyDiscountApplied: false,
        finalAmount: 2400,
        pointsEarned: 120,
        paymentMethod: 'Cash',
        purchaseDate: new Date(),
      },
    ]);

    console.log('Database seeded successfully with initial Mogali Footwear data and test customers!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedData();
