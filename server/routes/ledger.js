const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { auth } = require('../middleware/auth');

// Get ledger for a party
router.get('/:partyType/:partyId', auth, async (req, res) => {
  try {
    const { partyType, partyId } = req.params;

    if (!['customer', 'supplier'].includes(partyType)) {
      return res.status(400).json({ message: 'Invalid party type' });
    }

    let party;
    if (partyType === 'customer') {
      party = await Customer.findById(partyId);
    } else {
      party = await Supplier.findById(partyId);
    }
    if (!party) return res.status(404).json({ message: 'पार्टी नहीं मिली।' });

    const entries = [];

    // Opening balance
    if (party.openingBalance > 0) {
      entries.push({
        date: party.createdAt,
        type: 'opening',
        description: 'Opening Balance',
        debit: partyType === 'customer' ? party.openingBalance : 0,
        credit: partyType === 'supplier' ? party.openingBalance : 0
      });
    }

    if (partyType === 'customer') {
      // Sales (debit - customer owes us)
      const sales = await Sale.find({ customer: partyId, status: 'active' }).sort({ date: 1 });
      for (const sale of sales) {
        entries.push({
          date: sale.date,
          type: 'sale',
          description: `बिक्री - ${sale.invoiceNumber}`,
          debit: sale.grandTotal,
          credit: 0,
          reference: sale._id
        });
        // Inline payment at time of sale
        if (sale.paidAmount > 0) {
          entries.push({
            date: sale.date,
            type: 'payment',
            description: `भुगतान - ${sale.invoiceNumber} (${sale.paymentMode})`,
            debit: 0,
            credit: sale.paidAmount,
            reference: sale._id
          });
        }
      }
      // Standalone payments
      const payments = await Payment.find({
        party: partyId,
        partyType: 'customer',
        relatedSale: { $exists: false }
      }).sort({ date: 1 });
      for (const p of payments) {
        entries.push({
          date: p.date,
          type: 'payment',
          description: `भुगतान प्राप्त (${p.paymentMode})${p.referenceNumber ? ' - Ref: ' + p.referenceNumber : ''}`,
          debit: 0,
          credit: p.amount,
          reference: p._id
        });
      }
    } else {
      // Purchases (credit - we owe supplier)
      const purchases = await Purchase.find({ supplier: partyId, status: 'active' }).sort({ date: 1 });
      for (const purchase of purchases) {
        entries.push({
          date: purchase.date,
          type: 'purchase',
          description: `खरीदी - ${purchase.purchaseNumber}`,
          debit: 0,
          credit: purchase.grandTotal,
          reference: purchase._id
        });
        if (purchase.paidAmount > 0) {
          entries.push({
            date: purchase.date,
            type: 'payment',
            description: `भुगतान - ${purchase.purchaseNumber} (${purchase.paymentMode})`,
            debit: purchase.paidAmount,
            credit: 0,
            reference: purchase._id
          });
        }
      }
      // Standalone payments
      const payments = await Payment.find({
        party: partyId,
        partyType: 'supplier',
        relatedPurchase: { $exists: false }
      }).sort({ date: 1 });
      for (const p of payments) {
        entries.push({
          date: p.date,
          type: 'payment',
          description: `सप्लायर भुगतान (${p.paymentMode})${p.referenceNumber ? ' - Ref: ' + p.referenceNumber : ''}`,
          debit: p.amount,
          credit: 0,
          reference: p._id
        });
      }
    }

    // Sort by date
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let balance = 0;
    const ledger = entries.map(e => {
      if (partyType === 'customer') {
        balance += e.debit - e.credit;
      } else {
        balance += e.credit - e.debit;
      }
      return { ...e, balance: Math.round(balance * 100) / 100 };
    });

    res.json({
      party: { _id: party._id, name: party.name, mobile: party.mobile, currentBalance: party.currentBalance },
      partyType,
      ledger,
      closingBalance: party.currentBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'हिसाब लाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
