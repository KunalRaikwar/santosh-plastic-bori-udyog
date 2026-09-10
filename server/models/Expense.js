const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'तारीख आवश्यक है'],
    default: Date.now
  },
  category: {
    type: String,
    required: [true, 'खर्चा श्रेणी आवश्यक है'],
    enum: [
      'Gaadi Bhada',
      'Loading',
      'Unloading',
      'Transport',
      'Worker',
      'Diesel',
      'Electricity',
      'Rent',
      'Maintenance',
      'Miscellaneous',
      'Other'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'खर्चा राशि आवश्यक है'],
    min: [0.01, 'राशि 0 से अधिक होनी चाहिए']
  },
  description: {
    type: String,
    default: ''
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'],
    default: 'Cash'
  },
  notes: {
    type: String,
    default: ''
  },
  relatedSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  relatedPurchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  }
}, { timestamps: true });

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
