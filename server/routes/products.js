const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');
const { auth } = require('../middleware/auth');

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const { search, active, category } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const products = await Product.find(filter).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'माल की जानकारी लाने में समस्या हुई।', error: error.message });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'माल नहीं मिला।' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'समस्या हुई।', error: error.message });
  }
});

// Get product stock history
router.get('/:id/stock-history', auth, async (req, res) => {
  try {
    const transactions = await StockTransaction.find({ product: req.params.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(100);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'स्टॉक हिस्ट्री लाने में समस्या हुई।', error: error.message });
  }
});

// Create product
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, standardWeight, weightUnit, defaultPurchaseRate, defaultSellingRate, defaultUnit, openingStock } = req.body;
    if (!name) return res.status(400).json({ message: 'माल का नाम आवश्यक है।' });
    const product = new Product({
      name, category, standardWeight, weightUnit,
      defaultPurchaseRate, defaultSellingRate, defaultUnit,
      openingStock: openingStock || 0,
      currentStock: openingStock || 0,
      weightedAvgCost: defaultPurchaseRate || 0
    });
    await product.save();
    // Create opening stock transaction if opening stock > 0
    if (openingStock > 0) {
      await StockTransaction.create({
        product: product._id,
        productName: product.name,
        date: new Date(),
        type: 'opening',
        quantity: openingStock,
        unit: defaultUnit || 'Nag',
        balanceAfter: openingStock,
        notes: 'Opening stock'
      });
    }
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'माल जोड़ने में समस्या हुई।', error: error.message });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'माल नहीं मिला।' });
    const { name, category, standardWeight, weightUnit, defaultPurchaseRate, defaultSellingRate, defaultUnit, isActive } = req.body;
    if (name) product.name = name;
    if (category !== undefined) product.category = category;
    if (standardWeight !== undefined) product.standardWeight = standardWeight;
    if (weightUnit) product.weightUnit = weightUnit;
    if (defaultPurchaseRate !== undefined) product.defaultPurchaseRate = defaultPurchaseRate;
    if (defaultSellingRate !== undefined) product.defaultSellingRate = defaultSellingRate;
    if (defaultUnit) product.defaultUnit = defaultUnit;
    if (isActive !== undefined) product.isActive = isActive;
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'माल अपडेट करने में समस्या हुई।', error: error.message });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'माल नहीं मिला।' });

    // Delete related stock transactions
    await StockTransaction.deleteMany({ product: product._id });
    await Product.findByIdAndDelete(product._id);

    res.json({ message: 'माल सफलतापूर्वक हटा दिया गया।' });
  } catch (error) {
    res.status(500).json({ message: 'माल हटाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
