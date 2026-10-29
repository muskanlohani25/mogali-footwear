const mongoose = require('mongoose');

// Helper to normalize phone numbers (e.g. removes +91, 0, spaces, hyphens)
function normalizePhoneNumber(val) {
  if (!val) return '';
  let cleaned = String(val).trim().replace(/\D/g, '');
  // If 12 digits starting with 91 (India country code), strip 91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }
  // If 11 digits starting with 0, strip leading 0
  else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Customer name must be at least 2 characters long'],
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      set: normalizePhoneNumber,
      validate: {
        validator: function (v) {
          const normalized = normalizePhoneNumber(v);
          return /^[6-9]\d{9}$/.test(normalized);
        },
        message: (props) =>
          `"${props.value}" is not a valid 10-digit mobile number. Must be 10 digits starting with 6, 7, 8, or 9.`,
      },
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    totalQualifyingPurchases: {
      type: Number,
      default: 0,
      min: [0, 'Total qualifying purchases cannot be negative'],
    },
    qualifyingPurchasesInCycle: {
      type: Number,
      default: 0,
      min: [0, 'Cycle purchases cannot be negative'],
    },
    rewardAvailable: {
      type: Boolean,
      default: false,
    },
    rewardCyclesCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, 'Total spent cannot be negative'],
    },
    loyaltyPoints: {
      type: Number,
      default: 50, // 50 Welcome bonus points on registration
      min: 0,
    },
    tier: {
      type: String,
      enum: ['Silver', 'Gold', 'Platinum'],
      default: 'Silver',
    },
  },
  {
    timestamps: true,
  }
);

// Helper function to update loyalty tier based on active points
customerSchema.methods.updateTier = function () {
  if (this.loyaltyPoints >= 700) {
    this.tier = 'Platinum';
  } else if (this.loyaltyPoints >= 250) {
    this.tier = 'Gold';
  } else {
    this.tier = 'Silver';
  }
};

customerSchema.statics.normalizePhone = normalizePhoneNumber;

module.exports = mongoose.model('Customer', customerSchema);
