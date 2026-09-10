const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: 'Santosh Plastic Bori Udyog'
  },
  address: {
    type: String,
    default: ''
  },
  mobile: {
    type: String,
    default: ''
  },
  gstNumber: {
    type: String,
    default: ''
  },
  invoicePrefix: {
    type: String,
    default: 'SPBU'
  },
  defaultPaymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'],
    default: 'Cash'
  },
  currency: {
    type: String,
    default: '₹'
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
