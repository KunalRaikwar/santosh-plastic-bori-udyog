const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'खर्चों की जानकारी लाने में समस्या हुई।', error: error.message });
  }
});

// Create expense
router.post('/', auth, async (req, res) => {
  try {
    const { date, category, amount, description, paymentMode, notes } = req.body;
    if (!category) return res.status(400).json({ message: 'कृपया खर्चा श्रेणी चुनें।' });
    if (!amount || amount <= 0) return res.status(400).json({ message: 'कृपया सही खर्चा राशि दर्ज करें।' });

    const expense = new Expense({
      date: date || new Date(),
      category, amount, description,
      paymentMode: paymentMode || 'Cash',
      notes
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'खर्चा सेव करने में समस्या हुई।', error: error.message });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'खर्चा नहीं मिला।' });
    res.json({ message: 'खर्चा हटा दिया गया।' });
  } catch (error) {
    res.status(500).json({ message: 'खर्चा हटाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
