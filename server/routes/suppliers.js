const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

// Get all suppliers
router.get('/', auth, async (req, res) => {
  try {
    const { search, active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };
    const suppliers = await Supplier.find(filter).sort({ name: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'सप्लायर की जानकारी लाने में समस्या हुई।', error: error.message });
  }
});

// Get single supplier with summary
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'सप्लायर नहीं मिला।' });

    const purchases = await Purchase.find({ supplier: req.params.id, status: 'active' });
    const payments = await Payment.find({ party: req.params.id, partyType: 'supplier' });

    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) +
                      purchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const lastPurchase = purchases.length > 0 ? purchases.sort((a, b) => b.date - a.date)[0] : null;
    const lastPayment = payments.length > 0 ? payments.sort((a, b) => b.date - a.date)[0] : null;

    res.json({
      ...supplier.toObject(),
      summary: {
        totalPurchases,
        totalAmount,
        totalPaid,
        totalPending: supplier.currentBalance,
        lastPurchase: lastPurchase ? lastPurchase.date : null,
        lastPayment: lastPayment ? lastPayment.date : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'समस्या हुई।', error: error.message });
  }
});

// Create supplier
router.post('/', auth, async (req, res) => {
  try {
    const { name, mobile, address, openingBalance, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'सप्लायर का नाम आवश्यक है।' });
    const supplier = new Supplier({
      name, mobile, address,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      notes
    });
    await supplier.save();
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'सप्लायर जोड़ने में समस्या हुई।', error: error.message });
  }
});

// Update supplier
router.put('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'सप्लायर नहीं मिला।' });
    const { name, mobile, address, notes, isActive } = req.body;
    if (name) supplier.name = name;
    if (mobile !== undefined) supplier.mobile = mobile;
    if (address !== undefined) supplier.address = address;
    if (notes !== undefined) supplier.notes = notes;
    if (isActive !== undefined) supplier.isActive = isActive;
    await supplier.save();
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'सप्लायर अपडेट करने में समस्या हुई।', error: error.message });
  }
});

// Delete supplier
router.delete('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'सप्लायर नहीं मिला।' });

    await Supplier.findByIdAndDelete(supplier._id);
    res.json({ message: 'सप्लायर सफलतापूर्वक हटा दिया गया।' });
  } catch (error) {
    res.status(500).json({ message: 'सप्लायर हटाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
