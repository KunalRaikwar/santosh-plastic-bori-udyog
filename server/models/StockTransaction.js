const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['opening', 'purchase', 'sale', 'return', 'adjustment', 'cancelled_purchase', 'cancelled_sale'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['Nag', 'KG', 'Bundle', 'Other'],
    default: 'Nag'
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceModel: {
    type: String,
    enum: ['Purchase', 'Sale']
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

stockTransactionSchema.index({ product: 1, date: -1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
