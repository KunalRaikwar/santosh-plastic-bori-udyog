const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'माल का नाम आवश्यक है'],
    trim: true
  },
  category: {
    type: String,
    default: 'Plastic Bori',
    trim: true
  },
  standardWeight: {
    type: Number,
    default: 0
  },
  weightUnit: {
    type: String,
    enum: ['KG', 'Gram', 'Ton'],
    default: 'KG'
  },
  defaultPurchaseRate: {
    type: Number,
    default: 0
  },
  defaultSellingRate: {
    type: Number,
    default: 0
  },
  defaultUnit: {
    type: String,
    enum: ['Nag', 'KG', 'Bundle', 'Other'],
    default: 'Nag'
  },
  openingStock: {
    type: Number,
    default: 0
  },
  currentStock: {
    type: Number,
    default: 0
  },
  weightedAvgCost: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
