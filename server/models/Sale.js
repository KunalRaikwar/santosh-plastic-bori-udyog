const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'मात्रा आवश्यक है'],
    min: [0.01, 'मात्रा 0 से अधिक होनी चाहिए']
  },
  unit: {
    type: String,
    enum: ['Nag', 'KG', 'Bundle', 'Other'],
    required: true
  },
  weight: {
    type: Number,
    default: 0
  },
  rateType: {
    type: String,
    enum: ['nag', 'weight'],
    default: 'nag'
  },
  sellingRate: {
    type: Number,
    required: [true, 'बिक्री रेट आवश्यक है'],
    min: [0, 'रेट 0 से कम नहीं हो सकता']
  },
  costRate: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  costAmount: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  }
}, { _id: true });

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    required: [true, 'तारीख आवश्यक है'],
    default: Date.now
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'ग्राहक चुनना आवश्यक है']
  },
  customerName: {
    type: String,
    required: true
  },
  customerMobile: {
    type: String,
    default: ''
  },
  items: [saleItemSchema],
  grandTotal: {
    type: Number,
    required: true,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  grossProfit: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Other', 'None'],
    default: 'Cash'
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

saleSchema.index({ date: -1 });
saleSchema.index({ customer: 1 });

module.exports = mongoose.model('Sale', saleSchema);
