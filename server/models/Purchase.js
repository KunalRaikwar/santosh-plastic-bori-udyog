const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
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
  purchaseRate: {
    type: Number,
    required: [true, 'खरीदी रेट आवश्यक है'],
    min: [0, 'रेट 0 से कम नहीं हो सकता']
  },
  totalAmount: {
    type: Number,
    required: true
  }
}, { _id: true });

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: String,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    required: [true, 'तारीख आवश्यक है'],
    default: Date.now
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'सप्लायर चुनना आवश्यक है']
  },
  supplierName: {
    type: String,
    required: true
  },
  items: [purchaseItemSchema],
  grandTotal: {
    type: Number,
    required: true,
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

purchaseSchema.index({ date: -1 });
purchaseSchema.index({ supplier: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
