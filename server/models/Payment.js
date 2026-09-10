const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'तारीख आवश्यक है'],
    default: Date.now
  },
  partyType: {
    type: String,
    enum: ['customer', 'supplier'],
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'partyType',
    required: [true, 'पार्टी चुनना आवश्यक है']
  },
  partyModel: {
    type: String,
    enum: ['Customer', 'Supplier'],
    required: true
  },
  partyName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'भुगतान राशि आवश्यक है'],
    min: [0.01, 'राशि 0 से अधिक होनी चाहिए']
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'],
    default: 'Cash'
  },
  referenceNumber: {
    type: String,
    default: ''
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

paymentSchema.index({ date: -1 });
paymentSchema.index({ party: 1 });
paymentSchema.index({ partyType: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
