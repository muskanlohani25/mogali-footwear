const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['Formal Shoes', 'Sneakers', 'Loafers', 'Sandals & Slippers', 'Boots', 'Shoe Care & Accessories'],
      default: 'Sneakers',
    },
    description: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    items: [purchaseItemSchema],
    originalAmount: {
      type: Number,
      required: [true, 'Original amount is required'],
      min: 0,
    },
    billAmount: {
      type: Number,
      required: [true, 'Bill amount is required'],
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyDiscountApplied: {
      type: Boolean,
      default: false,
    },
    loyaltyDiscountPercent: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    pointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    submissionToken: {
      type: String,
      sparse: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI / QR', 'Cash', 'Card'],
      default: 'UPI / QR',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Purchase', purchaseSchema);

