const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const WorkerPayment = require('../models/WorkerPayment');
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');

// Get all workers
router.get('/', auth, async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    const workers = await Worker.find(filter).sort({ name: 1 });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'कर्मचारी जानकारी लाने में समस्या हुई।', error: error.message });
  }
});

// Get worker with payments
router.get('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'कर्मचारी नहीं मिला।' });
    const payments = await WorkerPayment.find({ worker: req.params.id }).sort({ date: -1 });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({ ...worker.toObject(), payments, totalPaid });
  } catch (error) {
    res.status(500).json({ message: 'समस्या हुई।', error: error.message });
  }
});

// Create worker
router.post('/', auth, async (req, res) => {
  try {
    const { name, mobile, paymentType, dailyRate, monthlyRate, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'कर्मचारी का नाम आवश्यक है।' });
    const worker = new Worker({ name, mobile, paymentType, dailyRate, monthlyRate, notes });
    await worker.save();
    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ message: 'कर्मचारी जोड़ने में समस्या हुई।', error: error.message });
  }
});

// Update worker
router.put('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'कर्मचारी नहीं मिला।' });
    Object.assign(worker, req.body);
    await worker.save();
    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: 'कर्मचारी अपडेट करने में समस्या हुई।', error: error.message });
  }
});

// Record worker payment
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const { date, amount, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'कृपया सही राशि दर्ज करें।' });

    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'कर्मचारी नहीं मिला।' });

    // Create expense automatically
    const expense = await Expense.create({
      date: date || new Date(),
      category: 'Worker',
      amount,
      description: `${worker.name} को भुगतान`,
      paymentMode: 'Cash',
      notes
    });

    const wp = await WorkerPayment.create({
      worker: worker._id,
      workerName: worker.name,
      date: date || new Date(),
      amount,
      notes,
      expenseRef: expense._id
    });

    res.status(201).json(wp);
  } catch (error) {
    res.status(500).json({ message: 'कर्मचारी भुगतान सेव करने में समस्या हुई।', error: error.message });
  }
});

// Delete worker payment
router.delete('/payment/:paymentId', auth, async (req, res) => {
  try {
    const wp = await WorkerPayment.findById(req.params.paymentId);
    if (!wp) return res.status(404).json({ message: 'भुगतान रिकॉर्ड नहीं मिला।' });

    if (wp.expenseRef) {
      await Expense.findByIdAndDelete(wp.expenseRef);
    }
    await WorkerPayment.findByIdAndDelete(wp._id);

    res.json({ message: 'कर्मचारी भुगतान हटा दिया गया।' });
  } catch (error) {
    res.status(500).json({ message: 'कर्मचारी भुगतान हटाने में समस्या हुई।', error: error.message });
  }
});

// Delete worker
router.delete('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'कर्मचारी नहीं मिला।' });

    // Delete all payments and linked expenses
    const payments = await WorkerPayment.find({ worker: worker._id });
    for (const p of payments) {
      if (p.expenseRef) {
        await Expense.findByIdAndDelete(p.expenseRef);
      }
    }
    await WorkerPayment.deleteMany({ worker: worker._id });
    await Worker.findByIdAndDelete(worker._id);

    res.json({ message: 'कर्मचारी सफलतापूर्वक हटा दिया गया।' });
  } catch (error) {
    res.status(500).json({ message: 'कर्मचारी हटाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
