const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Today's data
    const todaySales = await Sale.find({ date: { $gte: today, $lt: tomorrow }, status: 'active' });
    const todayPurchases = await Purchase.find({ date: { $gte: today, $lt: tomorrow }, status: 'active' });
    const todayExpenses = await Expense.find({ date: { $gte: today, $lt: tomorrow } });

    const todaySaleTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const todayPurchaseTotal = todayPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const todayGrossProfit = todaySales.reduce((sum, s) => sum + s.grossProfit, 0);
    const todayNetProfit = todayGrossProfit - todayExpenseTotal;

    // Monthly data
    const monthSales = await Sale.find({ date: { $gte: monthStart, $lte: monthEnd }, status: 'active' });
    const monthPurchases = await Purchase.find({ date: { $gte: monthStart, $lte: monthEnd }, status: 'active' });
    const monthExpenses = await Expense.find({ date: { $gte: monthStart, $lte: monthEnd } });

    const monthSaleTotal = monthSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const monthPurchaseTotal = monthPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthGrossProfit = monthSales.reduce((sum, s) => sum + s.grossProfit, 0);
    const monthNetProfit = monthGrossProfit - monthExpenseTotal;

    // Pending amounts
    const customers = await Customer.find({ isActive: true });
    const suppliers = await Supplier.find({ isActive: true });
    const totalReceivable = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);
    const totalPayable = suppliers.reduce((sum, s) => sum + Math.max(0, s.currentBalance), 0);

    // Stock
    const products = await Product.find({ isActive: true });
    const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
    const lowStockItems = products.filter(p => p.currentStock < 100).map(p => ({
      _id: p._id, name: p.name, currentStock: p.currentStock, unit: p.defaultUnit
    }));

    // Recent transactions (last 10)
    const recentSales = await Sale.find({ status: 'active' }).sort({ createdAt: -1 }).limit(5)
      .select('invoiceNumber date customerName grandTotal pendingAmount');
    const recentPurchases = await Purchase.find({ status: 'active' }).sort({ createdAt: -1 }).limit(5)
      .select('purchaseNumber date supplierName grandTotal pendingAmount');

    const recentTransactions = [
      ...recentSales.map(s => ({ type: 'sale', ...s.toObject() })),
      ...recentPurchases.map(p => ({ type: 'purchase', ...p.toObject() }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    // Pending payments (customers)
    const pendingCustomers = customers
      .filter(c => c.currentBalance > 0)
      .map(c => ({ _id: c._id, name: c.name, mobile: c.mobile, pending: c.currentBalance }))
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 10);

    // Monthly chart data (last 6 months)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const dEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mSales = await Sale.find({ date: { $gte: d, $lte: dEnd }, status: 'active' });
      const mPurchases = await Purchase.find({ date: { $gte: d, $lte: dEnd }, status: 'active' });
      const mExpenses = await Expense.find({ date: { $gte: d, $lte: dEnd } });

      const mSaleTotal = mSales.reduce((sum, s) => sum + s.grandTotal, 0);
      const mPurchaseTotal = mPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
      const mExpenseTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);
      const mGrossProfit = mSales.reduce((sum, s) => sum + s.grossProfit, 0);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      chartData.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        sales: mSaleTotal,
        purchases: mPurchaseTotal,
        expenses: mExpenseTotal,
        profit: mGrossProfit - mExpenseTotal
      });
    }

    res.json({
      today: {
        sales: todaySaleTotal,
        purchases: todayPurchaseTotal,
        expenses: todayExpenseTotal,
        grossProfit: todayGrossProfit,
        netProfit: todayNetProfit
      },
      month: {
        sales: monthSaleTotal,
        purchases: monthPurchaseTotal,
        expenses: monthExpenseTotal,
        grossProfit: monthGrossProfit,
        netProfit: monthNetProfit
      },
      totalReceivable,
      totalPayable,
      totalStock,
      lowStockItems,
      recentTransactions,
      pendingCustomers,
      chartData
    });
  } catch (error) {
    res.status(500).json({ message: 'डैशबोर्ड डेटा लाने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
