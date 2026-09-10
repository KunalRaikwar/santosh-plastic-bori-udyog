const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

// Get all customers
router.get('/', auth, async (req, res) => {
  try {
    const { search, active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    const customers = await Customer.find(filter).sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'ग्राहकों की जानकारी लाने में समस्या हुई।', error: error.message });
  }
});

// Get single customer with summary
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'ग्राहक नहीं मिला।' });

    const sales = await Sale.find({ customer: req.params.id, status: 'active' });
    const payments = await Payment.find({ party: req.params.id, partyType: 'customer' });

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) +
                      sales.reduce((sum, s) => sum + s.paidAmount, 0);
    const lastSale = sales.length > 0 ? sales.sort((a, b) => b.date - a.date)[0] : null;
    const lastPayment = payments.length > 0 ? payments.sort((a, b) => b.date - a.date)[0] : null;

    res.json({
      ...customer.toObject(),
      summary: {
        totalSales,
        totalAmount,
        totalPaid,
        totalPending: customer.currentBalance,
        lastSale: lastSale ? lastSale.date : null,
        lastPayment: lastPayment ? lastPayment.date : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'समस्या हुई।', error: error.message });
  }
});

// Create customer
router.post('/', auth, async (req, res) => {
  try {
    const { name, mobile, address, openingBalance, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'ग्राहक का नाम आवश्यक है।' });
    const customer = new Customer({
      name, mobile, address,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      notes
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'ग्राहक जोड़ने में समस्या हुई।', error: error.message });
  }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'ग्राहक नहीं मिला।' });
    const { name, mobile, address, notes, isActive } = req.body;
    if (name) customer.name = name;
    if (mobile !== undefined) customer.mobile = mobile;
    if (address !== undefined) customer.address = address;
    if (notes !== undefined) customer.notes = notes;
    if (isActive !== undefined) customer.isActive = isActive;
    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'ग्राहक अपडेट करने में समस्या हुई।', error: error.message });
  }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'ग्राहक नहीं मिला।' });

    await Customer.findByIdAndDelete(customer._id);
    res.json({ message: 'ग्राहक सफलतापूर्वक हटा दिया गया।' });
  } catch (error) {
    res.status(500).json({ message: 'ग्राहक हटाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
