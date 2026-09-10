const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { auth } = require('../middleware/auth');

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    const { partyType, party, startDate, endDate, paymentMode } = req.query;
    const filter = {};
    if (partyType) filter.partyType = partyType;
    if (party) filter.party = party;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    const payments = await Payment.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'भुगतान की जानकारी लाने में समस्या हुई।', error: error.message });
  }
});

// Record customer payment (भुगतान प्राप्त)
router.post('/receive', auth, async (req, res) => {
  try {
    const { date, party, amount, paymentMode, referenceNumber, notes } = req.body;

    if (!party) return res.status(400).json({ message: 'कृपया ग्राहक चुनें।' });
    if (!amount || amount <= 0) return res.status(400).json({ message: 'कृपया सही भुगतान राशि दर्ज करें।' });

    const customer = await Customer.findById(party);
    if (!customer) return res.status(404).json({ message: 'ग्राहक नहीं मिला।' });

    const payment = new Payment({
      date: date || new Date(),
      partyType: 'customer',
      party: customer._id,
      partyModel: 'Customer',
      partyName: customer.name,
      amount,
      paymentMode: paymentMode || 'Cash',
      referenceNumber,
      notes
    });
    await payment.save();

    // Update customer balance
    customer.currentBalance -= amount;
    await customer.save();

    res.status(201).json({
      payment,
      newBalance: customer.currentBalance,
      customerName: customer.name
    });
  } catch (error) {
    res.status(500).json({ message: 'भुगतान सेव करने में समस्या हुई।', error: error.message });
  }
});

// Record supplier payment (सप्लायर भुगतान)
router.post('/pay', auth, async (req, res) => {
  try {
    const { date, party, amount, paymentMode, referenceNumber, notes } = req.body;

    if (!party) return res.status(400).json({ message: 'कृपया सप्लायर चुनें।' });
    if (!amount || amount <= 0) return res.status(400).json({ message: 'कृपया सही भुगतान राशि दर्ज करें।' });

    const supplier = await Supplier.findById(party);
    if (!supplier) return res.status(404).json({ message: 'सप्लायर नहीं मिला।' });

    const payment = new Payment({
      date: date || new Date(),
      partyType: 'supplier',
      party: supplier._id,
      partyModel: 'Supplier',
      partyName: supplier.name,
      amount,
      paymentMode: paymentMode || 'Cash',
      referenceNumber,
      notes
    });
    await payment.save();

    // Update supplier balance
    supplier.currentBalance -= amount;
    await supplier.save();

    res.status(201).json({
      payment,
      newBalance: supplier.currentBalance,
      supplierName: supplier.name
    });
  } catch (error) {
    res.status(500).json({ message: 'भुगतान सेव करने में समस्या हुई।', error: error.message });
  }
});

// Delete payment (with full rollback of party balance)
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'भुगतान रिकॉर्ड नहीं मिला।' });

    // Rollback party balance
    if (payment.partyType === 'customer' && payment.party) {
      await Customer.findByIdAndUpdate(payment.party, { $inc: { currentBalance: payment.amount } });
    } else if (payment.partyType === 'supplier' && payment.party) {
      await Supplier.findByIdAndUpdate(payment.party, { $inc: { currentBalance: payment.amount } });
    }

    // If related to a sale, update sale paid/pending
    if (payment.relatedSale) {
      const sale = await Sale.findById(payment.relatedSale);
      if (sale) {
        sale.paidAmount = Math.max(0, sale.paidAmount - payment.amount);
        sale.pendingAmount = sale.grandTotal - sale.paidAmount;
        await sale.save();
      }
    }

    await Payment.findByIdAndDelete(payment._id);

    res.json({ message: 'भुगतान सफलतापूर्वक हटा दिया गया।' });
  } catch (error) {
    res.status(500).json({ message: 'भुगतान हटाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
