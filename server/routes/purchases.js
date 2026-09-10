const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Payment = require('../models/Payment');
const StockTransaction = require('../models/StockTransaction');
const Counter = require('../models/Counter');
const { auth } = require('../middleware/auth');

// Get all purchases
router.get('/', auth, async (req, res) => {
  try {
    const { supplier, product, startDate, endDate, status } = req.query;
    const filter = {};
    if (supplier) filter.supplier = supplier;
    if (product) filter['items.product'] = product;
    if (status) filter.status = status;
    else filter.status = 'active';
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    const purchases = await Purchase.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'खरीदी की जानकारी लाने में समस्या हुई।', error: error.message });
  }
});

// Get single purchase
router.get('/:id', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'खरीदी रिकॉर्ड नहीं मिला।' });
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: 'समस्या हुई।', error: error.message });
  }
});

// Create purchase
router.post('/', auth, async (req, res) => {
  try {
    const { date, supplier, items, paidAmount, paymentMode, notes } = req.body;

    // Validate
    if (!supplier) return res.status(400).json({ message: 'कृपया सप्लायर चुनें।' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'कृपया कम से कम एक माल जोड़ें।' });

    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) return res.status(404).json({ message: 'सप्लायर नहीं मिला।' });

    // Generate purchase number
    const seq = await Counter.getNextSequence('purchase');
    const purchaseNumber = `PUR-${String(seq).padStart(4, '0')}`;

    // Process items
    let grandTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const rawName = (item.productName || item.product || '').trim();
      if (!rawName) return res.status(400).json({ message: 'कृपया माल का नाम दर्ज करें।' });
      if (item.purchaseRate === undefined || item.purchaseRate < 0) return res.status(400).json({ message: 'कृपया सही रेट दर्ज करें।' });

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
          defaultPurchaseRate: item.purchaseRate || 0,
          currentStock: 0
        });
      }

      const rateType = item.rateType === 'weight' ? 'weight' : 'nag';
      const weight = Number(item.weight) || 0;
      const quantity = Number(item.quantity) || (rateType === 'weight' ? 1 : 0);

      let totalAmount;
      if (rateType === 'weight' && weight > 0) {
        totalAmount = Math.round(weight * item.purchaseRate * 100) / 100;
      } else {
        totalAmount = Math.round(item.quantity * item.purchaseRate * 100) / 100;
      }

      grandTotal += totalAmount;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unit: item.unit || product.defaultUnit,
        weight: weight,
        rateType: rateType,
        purchaseRate: item.purchaseRate,
        totalAmount
      });
    }

    const paid = Math.min(paidAmount || 0, grandTotal);
    const pending = Math.round((grandTotal - paid) * 100) / 100;

    // Create purchase record
    const purchase = new Purchase({
      purchaseNumber,
      date: date || new Date(),
      supplier: supplierDoc._id,
      supplierName: supplierDoc.name,
      items: processedItems,
      grandTotal,
      paidAmount: paid,
      pendingAmount: pending,
      paymentMode: paid > 0 ? (paymentMode || 'Cash') : 'None',
      notes
    });
    await purchase.save();

    // Update stock and weighted average cost for each item
    for (const item of processedItems) {
      const product = await Product.findById(item.product);

      // Update weighted average cost
      const oldTotal = product.currentStock * product.weightedAvgCost;
      const newTotal = item.quantity * item.purchaseRate;
      const newStock = product.currentStock + item.quantity;
      product.weightedAvgCost = newStock > 0 ? Math.round(((oldTotal + newTotal) / newStock) * 100) / 100 : item.purchaseRate;
      product.currentStock = newStock;
      await product.save();

      // Create stock transaction
      await StockTransaction.create({
        product: product._id,
        productName: product.name,
        date: purchase.date,
        type: 'purchase',
        quantity: item.quantity,
        unit: item.unit,
        balanceAfter: product.currentStock,
        reference: purchase._id,
        referenceModel: 'Purchase'
      });
    }

    // Update supplier balance (we owe them the pending amount)
    supplierDoc.currentBalance += pending;
    await supplierDoc.save();

    // Create payment record if paid
    if (paid > 0) {
      await Payment.create({
        date: purchase.date,
        partyType: 'supplier',
        party: supplierDoc._id,
        partyModel: 'Supplier',
        partyName: supplierDoc.name,
        amount: paid,
        paymentMode: paymentMode || 'Cash',
        notes: `खरीदी ${purchaseNumber} का भुगतान`,
        relatedPurchase: purchase._id
      });
    }

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ message: 'खरीदी सेव करने में समस्या हुई।', error: error.message });
  }
});

// Cancel purchase
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'खरीदी रिकॉर्ड नहीं मिला।' });
    if (purchase.status === 'cancelled') return res.status(400).json({ message: 'यह खरीदी पहले से कैंसल है।' });

    purchase.status = 'cancelled';
    await purchase.save();

    // Reverse stock
    for (const item of purchase.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.currentStock -= item.quantity;
        await product.save();

        await StockTransaction.create({
          product: product._id,
          productName: product.name,
          date: new Date(),
          type: 'cancelled_purchase',
          quantity: -item.quantity,
          unit: item.unit,
          balanceAfter: product.currentStock,
          reference: purchase._id,
          referenceModel: 'Purchase',
          notes: 'खरीदी कैंसल'
        });
      }
    }

    // Reverse supplier balance
    const supplier = await Supplier.findById(purchase.supplier);
    if (supplier) {
      supplier.currentBalance -= purchase.pendingAmount;
      await supplier.save();
    }

    res.json({ message: 'खरीदी सफलतापूर्वक कैंसल की गई।', purchase });
  } catch (error) {
    res.status(500).json({ message: 'खरीदी कैंसल करने में समस्या हुई।', error: error.message });
  }
});

// Delete purchase completely (with full rollback of stock and supplier balance)
router.delete('/:id', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'खरीदी रिकॉर्ड नहीं मिला।' });

    // If purchase was active, rollback stock and supplier balance
    if (purchase.status !== 'cancelled') {
      for (const item of purchase.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: -item.quantity } });
        }
      }

      if (purchase.pendingAmount > 0 && purchase.supplier) {
        await Supplier.findByIdAndUpdate(purchase.supplier, { $inc: { currentBalance: -purchase.pendingAmount } });
      }
    }

    // Delete associated payments and stock transactions
    await Payment.deleteMany({ relatedPurchase: purchase._id });
    await StockTransaction.deleteMany({ reference: purchase._id });

    // Delete purchase document
    await Purchase.findByIdAndDelete(purchase._id);

    res.json({ message: 'खरीदी सफलतापूर्वक हटा दी गई।' });
  } catch (error) {
    res.status(500).json({ message: 'खरीदी हटाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
