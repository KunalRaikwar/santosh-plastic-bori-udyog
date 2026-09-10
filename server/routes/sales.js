const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const StockTransaction = require('../models/StockTransaction');
const Counter = require('../models/Counter');
const Settings = require('../models/Settings');
const { auth } = require('../middleware/auth');

// Get all sales
router.get('/', auth, async (req, res) => {
  try {
    const { customer, product, startDate, endDate, status, paymentStatus } = req.query;
    const filter = {};
    if (customer) filter.customer = customer;
    if (product) filter['items.product'] = product;
    if (status) filter.status = status;
    else filter.status = 'active';
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (paymentStatus === 'pending') filter.pendingAmount = { $gt: 0 };
    if (paymentStatus === 'paid') filter.pendingAmount = 0;
    const sales = await Sale.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'बिक्री की जानकारी लाने में समस्या हुई।', error: error.message });
  }
});

// Get single sale
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'बिक्री रिकॉर्ड नहीं मिला।' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'समस्या हुई।', error: error.message });
  }
});

// Create sale
router.post('/', auth, async (req, res) => {
  try {
    const { date, customer, items, paidAmount, paymentMode, notes } = req.body;

    if (!customer) return res.status(400).json({ message: 'कृपया ग्राहक चुनें।' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'कृपया कम से कम एक माल जोड़ें।' });

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) return res.status(404).json({ message: 'ग्राहक नहीं मिला।' });

    // Get settings for invoice prefix
    let settings = await Settings.findOne();
    const prefix = settings ? settings.invoicePrefix : 'SPBU';

    const seq = await Counter.getNextSequence('invoice');
    const invoiceNumber = `${prefix}-${String(seq).padStart(4, '0')}`;

    let grandTotal = 0;
    let totalCost = 0;
    const processedItems = [];

    for (const item of items) {
      const rawName = (item.productName || item.product || '').trim();
      if (!rawName) return res.status(400).json({ message: 'कृपया माल का नाम दर्ज करें।' });
      if (item.sellingRate === undefined || item.sellingRate < 0) return res.status(400).json({ message: 'कृपया सही रेट दर्ज करें।' });

      let product = null;
      if (item.product && String(item.product).match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(item.product);
      }
      if (!product) {
        product = await Product.findOne({ name: rawName });
      }
      if (!product) {
        product = await Product.create({
          name: rawName,
          defaultUnit: item.unit || (item.rateType === 'weight' ? 'KG' : 'Nag'),
          defaultSellingRate: item.sellingRate || 0,
          currentStock: 0
        });
      }

      const rateType = item.rateType === 'weight' ? 'weight' : 'nag';
      const weight = Number(item.weight) || 0;
      const quantity = Number(item.quantity) || (rateType === 'weight' ? 1 : 0);
      
      let totalAmount;
      if (rateType === 'weight' && weight > 0) {
        totalAmount = Math.round(weight * item.sellingRate * 100) / 100;
      } else {
        totalAmount = Math.round(item.quantity * item.sellingRate * 100) / 100;
      }

      const costRate = product.weightedAvgCost;
      const costAmount = Math.round(item.quantity * costRate * 100) / 100;
      const profit = Math.round((totalAmount - costAmount) * 100) / 100;

      grandTotal += totalAmount;
      totalCost += costAmount;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unit: item.unit || product.defaultUnit,
        weight: weight,
        rateType: rateType,
        sellingRate: item.sellingRate,
        costRate,
        totalAmount,
        costAmount,
        profit
      });
    }

    const grossProfit = Math.round((grandTotal - totalCost) * 100) / 100;
    const paid = Math.min(paidAmount || 0, grandTotal);
    const pending = Math.round((grandTotal - paid) * 100) / 100;

    // Create sale record
    const sale = new Sale({
      invoiceNumber,
      date: date || new Date(),
      customer: customerDoc._id,
      customerName: customerDoc.name,
      customerMobile: customerDoc.mobile || '',
      items: processedItems,
      grandTotal,
      totalCost,
      grossProfit,
      paidAmount: paid,
      pendingAmount: pending,
      paymentMode: paid > 0 ? (paymentMode || 'Cash') : 'None',
      notes
    });
    await sale.save();

    // Update stock for each item
    for (const item of processedItems) {
      const product = await Product.findById(item.product);
      product.currentStock -= item.quantity;
      await product.save();

      await StockTransaction.create({
        product: product._id,
        productName: product.name,
        date: sale.date,
        type: 'sale',
        quantity: -item.quantity,
        unit: item.unit,
        balanceAfter: product.currentStock,
        reference: sale._id,
        referenceModel: 'Sale'
      });
    }

    // Update customer balance (they owe us the pending amount)
    customerDoc.currentBalance += pending;
    await customerDoc.save();

    // Create payment record if paid
    if (paid > 0) {
      await Payment.create({
        date: sale.date,
        partyType: 'customer',
        party: customerDoc._id,
        partyModel: 'Customer',
        partyName: customerDoc.name,
        amount: paid,
        paymentMode: paymentMode || 'Cash',
        notes: `बिल ${invoiceNumber} का भुगतान`,
        relatedSale: sale._id
      });
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: 'बिक्री सेव करने में समस्या हुई।', error: error.message });
  }
});

// Cancel sale
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'बिक्री रिकॉर्ड नहीं मिला।' });
    if (sale.status === 'cancelled') return res.status(400).json({ message: 'यह बिक्री पहले से कैंसल है।' });

    sale.status = 'cancelled';
    await sale.save();

    // Reverse stock
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.currentStock += item.quantity;
        await product.save();

        await StockTransaction.create({
          product: product._id,
          productName: product.name,
          date: new Date(),
          type: 'cancelled_sale',
          quantity: item.quantity,
          unit: item.unit,
          balanceAfter: product.currentStock,
          reference: sale._id,
          referenceModel: 'Sale',
          notes: 'बिक्री कैंसल'
        });
      }
    }

    // Reverse customer balance
    const customer = await Customer.findById(sale.customer);
    if (customer) {
      customer.currentBalance -= sale.pendingAmount;
      await customer.save();
    }

    res.json({ message: 'बिक्री सफलतापूर्वक कैंसल की गई।', sale });
  } catch (error) {
    res.status(500).json({ message: 'बिक्री कैंसल करने में समस्या हुई।', error: error.message });
  }
});

// Delete sale completely (with full rollback of stock, khata balance, and payment)
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'बिक्री रिकॉर्ड नहीं मिला।' });

    // If sale was active, rollback stock and customer balance
    if (sale.status !== 'cancelled') {
      for (const item of sale.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: item.quantity } });
        }
      }

      if (sale.pendingAmount > 0 && sale.customer) {
        await Customer.findByIdAndUpdate(sale.customer, { $inc: { currentBalance: -sale.pendingAmount } });
      }
    }

    // Delete associated payments and stock transactions
    await Payment.deleteMany({ relatedSale: sale._id });
    await StockTransaction.deleteMany({ reference: sale._id });

    // Delete the sale document
    await Sale.findByIdAndDelete(sale._id);

    res.json({ message: 'बिक्री सफलतापूर्वक हटा दी गई।' });
  } catch (error) {
    res.status(500).json({ message: 'बिक्री हटाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
