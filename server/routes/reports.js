const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { auth } = require('../middleware/auth');

// Monthly report
router.get('/monthly', auth, async (req, res) => {
  try {
    let { startDate, endDate } = req.query;
    if (!startDate) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    const sales = await Sale.find({ date: { $gte: start, $lte: end }, status: 'active' });
    const purchases = await Purchase.find({ date: { $gte: start, $lte: end }, status: 'active' });
    const expenses = await Expense.find({ date: { $gte: start, $lte: end } });

    const totalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const grossProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    // Expense breakdown
    const expenseByCategory = {};
    expenses.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    // Payment stats
    const totalSalesPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalSalesPending = sales.reduce((sum, s) => sum + s.pendingAmount, 0);
    const totalPurchasesPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalPurchasesPending = purchases.reduce((sum, p) => sum + p.pendingAmount, 0);

    res.json({
      period: { startDate, endDate },
      totalSales,
      totalPurchases,
      grossProfit,
      totalExpenses,
      netProfit,
      expenseByCategory,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      totalSalesPaid,
      totalSalesPending,
      totalPurchasesPaid,
      totalPurchasesPending
    });
  } catch (error) {
    res.status(500).json({ message: 'रिपोर्ट लाने में समस्या हुई।', error: error.message });
  }
});

// Profit by product
router.get('/profit-by-product', auth, async (req, res) => {
  try {
    let { startDate, endDate } = req.query;
    const filter = { status: 'active' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const sales = await Sale.find(filter);
    const productProfit = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.product.toString();
        if (!productProfit[key]) {
          productProfit[key] = {
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            unit: item.unit,
            avgSellingRate: 0,
            avgCostRate: 0
          };
        }
        productProfit[key].totalQuantity += item.quantity;
        productProfit[key].totalRevenue += item.totalAmount;
        productProfit[key].totalCost += item.costAmount;
        productProfit[key].totalProfit += item.profit;
      });
    });

    // Calculate averages
    const result = Object.values(productProfit).map(p => ({
      ...p,
      avgSellingRate: p.totalQuantity > 0 ? Math.round((p.totalRevenue / p.totalQuantity) * 100) / 100 : 0,
      avgCostRate: p.totalQuantity > 0 ? Math.round((p.totalCost / p.totalQuantity) * 100) / 100 : 0,
      profitPercent: p.totalRevenue > 0 ? Math.round((p.totalProfit / p.totalRevenue) * 10000) / 100 : 0
    }));

    res.json(result.sort((a, b) => b.totalProfit - a.totalProfit));
  } catch (error) {
    res.status(500).json({ message: 'रिपोर्ट लाने में समस्या हुई।', error: error.message });
  }
});

// Customer pending report
router.get('/customer-pending', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ currentBalance: { $gt: 0 }, isActive: true }).sort({ currentBalance: -1 });
    const result = [];
    for (const c of customers) {
      const lastSale = await Sale.findOne({ customer: c._id, status: 'active' }).sort({ date: -1 });
      const lastPayment = await require('../models/Payment').findOne({ party: c._id, partyType: 'customer' }).sort({ date: -1 });
      result.push({
        _id: c._id,
        name: c.name,
        mobile: c.mobile,
        pending: c.currentBalance,
        lastSale: lastSale ? lastSale.date : null,
        lastPayment: lastPayment ? lastPayment.date : null,
        daysPending: lastSale ? Math.floor((new Date() - new Date(lastSale.date)) / (1000 * 60 * 60 * 24)) : 0
      });
    }
    const totalReceivable = result.reduce((sum, r) => sum + r.pending, 0);
    res.json({ customers: result, totalReceivable });
  } catch (error) {
    res.status(500).json({ message: 'रिपोर्ट लाने में समस्या हुई।', error: error.message });
  }
});

// Supplier pending report
router.get('/supplier-pending', auth, async (req, res) => {
  try {
    const suppliers = await Supplier.find({ currentBalance: { $gt: 0 }, isActive: true }).sort({ currentBalance: -1 });
    const result = [];
    for (const s of suppliers) {
      const lastPurchase = await Purchase.findOne({ supplier: s._id, status: 'active' }).sort({ date: -1 });
      const lastPayment = await require('../models/Payment').findOne({ party: s._id, partyType: 'supplier' }).sort({ date: -1 });
      result.push({
        _id: s._id,
        name: s.name,
        mobile: s.mobile,
        pending: s.currentBalance,
        lastPurchase: lastPurchase ? lastPurchase.date : null,
        lastPayment: lastPayment ? lastPayment.date : null
      });
    }
    const totalPayable = result.reduce((sum, r) => sum + r.pending, 0);
    res.json({ suppliers: result, totalPayable });
  } catch (error) {
    res.status(500).json({ message: 'रिपोर्ट लाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
