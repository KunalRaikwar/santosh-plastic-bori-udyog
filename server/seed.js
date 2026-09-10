const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const User = require('./models/User');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');
const Purchase = require('./models/Purchase');
const Sale = require('./models/Sale');
const Payment = require('./models/Payment');
const Expense = require('./models/Expense');
const Worker = require('./models/Worker');
const WorkerPayment = require('./models/WorkerPayment');
const StockTransaction = require('./models/StockTransaction');
const Settings = require('./models/Settings');
const Counter = require('./models/Counter');

const seed = async () => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  console.log('Clearing database...');

  await Promise.all([
    User.deleteMany({}), Customer.deleteMany({}), Supplier.deleteMany({}),
    Product.deleteMany({}), Purchase.deleteMany({}), Sale.deleteMany({}),
    Payment.deleteMany({}), Expense.deleteMany({}), Worker.deleteMany({}),
    WorkerPayment.deleteMany({}), StockTransaction.deleteMany({}),
    Settings.deleteMany({}), Counter.deleteMany({})
  ]);

  // Settings
  await Settings.create({
    businessName: 'Santosh Plastic Bori Udyog',
    address: 'Main Market, City',
    mobile: '9876543210',
    invoicePrefix: 'SPBU'
  });

  // User
  const user = await User.create({
    username: 'admin',
    password: 'admin123',
    name: 'Santosh Ji',
    role: 'owner'
  });
  console.log('Owner created: admin / admin123');

  // Customers
  const [rakesh, mohan, sharma] = await Customer.create([
    { name: 'Rakesh Traders', mobile: '9876000001', address: 'Industrial Area', openingBalance: 5000, currentBalance: 5000 },
    { name: 'Mohan Traders', mobile: '9876000002', address: 'Market Road', openingBalance: 0, currentBalance: 0 },
    { name: 'Sharma Traders', mobile: '9876000003', address: 'Station Road', openingBalance: 2000, currentBalance: 2000 }
  ]);
  console.log('3 Customers created');

  // Suppliers
  const [abc, xyz] = await Supplier.create([
    { name: 'ABC Plastic', mobile: '9876000010', address: 'Factory Area', openingBalance: 0, currentBalance: 0 },
    { name: 'XYZ Plastic', mobile: '9876000011', address: 'Industrial Zone', openingBalance: 3000, currentBalance: 3000 }
  ]);
  console.log('2 Suppliers created');

  // Products
  const [bori30, bori50, bori25, bori40] = await Product.create([
    { name: '30 KG Bori', category: 'Plastic Bori', standardWeight: 30, weightUnit: 'KG', defaultPurchaseRate: 15, defaultSellingRate: 20, defaultUnit: 'Nag', openingStock: 2000, currentStock: 2000, weightedAvgCost: 15 },
    { name: '50 KG Bori', category: 'Plastic Bori', standardWeight: 50, weightUnit: 'KG', defaultPurchaseRate: 22, defaultSellingRate: 28, defaultUnit: 'Nag', openingStock: 1500, currentStock: 1500, weightedAvgCost: 22 },
    { name: '25 KG Bori', category: 'Plastic Bori', standardWeight: 25, weightUnit: 'KG', defaultPurchaseRate: 12, defaultSellingRate: 16, defaultUnit: 'Nag', openingStock: 3000, currentStock: 3000, weightedAvgCost: 12 },
    { name: '40 KG Bori', category: 'Plastic Bori', standardWeight: 40, weightUnit: 'KG', defaultPurchaseRate: 18, defaultSellingRate: 24, defaultUnit: 'Nag', openingStock: 1000, currentStock: 1000, weightedAvgCost: 18 }
  ]);
  console.log('4 Products created');

  // Opening stock transactions
  for (const p of [bori30, bori50, bori25, bori40]) {
    await StockTransaction.create({
      product: p._id, productName: p.name, date: new Date('2026-09-01'),
      type: 'opening', quantity: p.openingStock, unit: 'Nag', balanceAfter: p.openingStock
    });
  }

  // Counters
  await Counter.create([
    { _id: 'purchase', sequence_value: 0 },
    { _id: 'invoice', sequence_value: 0 }
  ]);

  // ============= PURCHASES =============
  const purchases = [];

  // Purchase 1: Sep 2 - ABC Plastic - 30 KG Bori
  const pur1 = await createPurchase({
    date: '2026-09-02', supplier: abc,
    items: [{ product: bori30, quantity: 500, purchaseRate: 15 }],
    paidAmount: 5000, paymentMode: 'Cash'
  });
  purchases.push(pur1);

  // Purchase 2: Sep 3 - XYZ Plastic - 50 KG Bori + 25 KG Bori
  const pur2 = await createPurchase({
    date: '2026-09-03', supplier: xyz,
    items: [
      { product: bori50, quantity: 300, purchaseRate: 22 },
      { product: bori25, quantity: 400, purchaseRate: 12 }
    ],
    paidAmount: 8000, paymentMode: 'UPI'
  });
  purchases.push(pur2);

  // Purchase 3: Sep 5 - ABC Plastic - 40 KG Bori
  const pur3 = await createPurchase({
    date: '2026-09-05', supplier: abc,
    items: [{ product: bori40, quantity: 200, purchaseRate: 18 }],
    paidAmount: 3600, paymentMode: 'Cash'
  });
  purchases.push(pur3);

  // Purchase 4: Sep 7 - ABC Plastic - 30 KG Bori (different rate)
  const pur4 = await createPurchase({
    date: '2026-09-07', supplier: abc,
    items: [{ product: bori30, quantity: 300, purchaseRate: 16 }],
    paidAmount: 3000, paymentMode: 'Bank Transfer'
  });
  purchases.push(pur4);

  // Purchase 5: Sep 9 - XYZ Plastic
  const pur5 = await createPurchase({
    date: '2026-09-09', supplier: xyz,
    items: [
      { product: bori50, quantity: 200, purchaseRate: 23 },
      { product: bori30, quantity: 400, purchaseRate: 15.5 }
    ],
    paidAmount: 5000, paymentMode: 'Cash'
  });
  purchases.push(pur5);

  console.log('5 Purchases created');

  // ============= SALES =============
  const sales = [];

  // Sale 1: Sep 3 - Rakesh - 30 KG Bori
  const sale1 = await createSale({
    date: '2026-09-03', customer: rakesh,
    items: [{ product: bori30, quantity: 200, sellingRate: 20 }],
    paidAmount: 3000, paymentMode: 'Cash'
  });
  sales.push(sale1);

  // Sale 2: Sep 4 - Mohan - Multi product
  const sale2 = await createSale({
    date: '2026-09-04', customer: mohan,
    items: [
      { product: bori30, quantity: 100, sellingRate: 20 },
      { product: bori50, quantity: 50, sellingRate: 28 },
      { product: bori25, quantity: 200, sellingRate: 16 }
    ],
    paidAmount: 4000, paymentMode: 'UPI'
  });
  sales.push(sale2);

  // Sale 3: Sep 5 - Sharma - 50 KG Bori
  const sale3 = await createSale({
    date: '2026-09-05', customer: sharma,
    items: [{ product: bori50, quantity: 150, sellingRate: 28 }],
    paidAmount: 2000, paymentMode: 'Cash'
  });
  sales.push(sale3);

  // Sale 4: Sep 6 - Rakesh - 40 KG Bori + 25 KG Bori
  const sale4 = await createSale({
    date: '2026-09-06', customer: rakesh,
    items: [
      { product: bori40, quantity: 100, sellingRate: 24 },
      { product: bori25, quantity: 300, sellingRate: 16 }
    ],
    paidAmount: 5000, paymentMode: 'Bank Transfer'
  });
  sales.push(sale4);

  // Sale 5: Sep 8 - Mohan - 30 KG Bori
  const sale5 = await createSale({
    date: '2026-09-08', customer: mohan,
    items: [{ product: bori30, quantity: 300, sellingRate: 21 }],
    paidAmount: 4000, paymentMode: 'Cash'
  });
  sales.push(sale5);

  // Sale 6: Sep 9 - Sharma
  const sale6 = await createSale({
    date: '2026-09-09', customer: sharma,
    items: [
      { product: bori50, quantity: 100, sellingRate: 29 },
      { product: bori40, quantity: 50, sellingRate: 25 }
    ],
    paidAmount: 2500, paymentMode: 'UPI'
  });
  sales.push(sale6);

  // Sale 7: Sep 10 (today)
  const sale7 = await createSale({
    date: '2026-09-10', customer: rakesh,
    items: [
      { product: bori30, quantity: 100, sellingRate: 20 },
      { product: bori25, quantity: 150, sellingRate: 17 }
    ],
    paidAmount: 2000, paymentMode: 'Cash'
  });
  sales.push(sale7);

  console.log('7 Sales created');

  // ============= STANDALONE PAYMENTS =============

  // Customer payment
  await createPayment({
    date: '2026-09-06', partyType: 'customer', party: rakesh,
    amount: 2000, paymentMode: 'Cash', notes: 'Partial payment'
  });

  await createPayment({
    date: '2026-09-08', partyType: 'customer', party: mohan,
    amount: 1500, paymentMode: 'UPI', notes: 'Payment received'
  });

  await createPayment({
    date: '2026-09-09', partyType: 'customer', party: sharma,
    amount: 1000, paymentMode: 'Cash', notes: 'Advance payment'
  });

  // Supplier payment
  await createPayment({
    date: '2026-09-07', partyType: 'supplier', party: abc,
    amount: 2000, paymentMode: 'Bank Transfer', notes: 'Supplier payment'
  });

  console.log('4 Standalone payments created');

  // ============= EXPENSES =============
  await Expense.create([
    { date: new Date('2026-09-02'), category: 'Gaadi Bhada', amount: 1500, description: 'Maal delivery transport', paymentMode: 'Cash' },
    { date: new Date('2026-09-03'), category: 'Loading', amount: 500, description: 'Loading charges', paymentMode: 'Cash' },
    { date: new Date('2026-09-04'), category: 'Diesel', amount: 800, description: 'Truck diesel', paymentMode: 'Cash' },
    { date: new Date('2026-09-05'), category: 'Transport', amount: 1200, description: 'Local transport', paymentMode: 'UPI' },
    { date: new Date('2026-09-07'), category: 'Electricity', amount: 2500, description: 'Monthly electricity bill', paymentMode: 'Bank Transfer' },
    { date: new Date('2026-09-08'), category: 'Maintenance', amount: 600, description: 'Godown repair', paymentMode: 'Cash' },
    { date: new Date('2026-09-09'), category: 'Unloading', amount: 400, description: 'Unloading charges', paymentMode: 'Cash' },
    { date: new Date('2026-09-10'), category: 'Gaadi Bhada', amount: 1000, description: 'Today delivery', paymentMode: 'Cash' },
    { date: new Date('2026-09-10'), category: 'Loading', amount: 300, description: 'Today loading', paymentMode: 'Cash' }
  ]);
  console.log('9 Expenses created');

  // ============= WORKERS =============
  const [ramesh, suresh] = await Worker.create([
    { name: 'Ramesh', mobile: '9876000020', paymentType: 'daily', dailyRate: 500 },
    { name: 'Suresh', mobile: '9876000021', paymentType: 'monthly', monthlyRate: 15000 }
  ]);

  // Worker payments
  for (let day = 2; day <= 10; day++) {
    const exp = await Expense.create({
      date: new Date(`2026-09-${String(day).padStart(2, '0')}`),
      category: 'Worker', amount: 500,
      description: `Ramesh को भुगतान`, paymentMode: 'Cash'
    });
    await WorkerPayment.create({
      worker: ramesh._id, workerName: 'Ramesh',
      date: new Date(`2026-09-${String(day).padStart(2, '0')}`),
      amount: 500, expenseRef: exp._id
    });
  }

  const sureshExp = await Expense.create({
    date: new Date('2026-09-01'), category: 'Worker', amount: 15000,
    description: 'Suresh monthly salary', paymentMode: 'Bank Transfer'
  });
  await WorkerPayment.create({
    worker: suresh._id, workerName: 'Suresh',
    date: new Date('2026-09-01'), amount: 15000, expenseRef: sureshExp._id
  });
  console.log('2 Workers created with payments');

  // Final stats
  const finalProducts = await Product.find({});
  console.log('\n=== FINAL STOCK ===');
  for (const p of finalProducts) {
    console.log(`${p.name}: ${p.currentStock} Nag (Avg Cost: ₹${p.weightedAvgCost})`);
  }

  const finalCustomers = await Customer.find({});
  console.log('\n=== CUSTOMER BALANCES ===');
  for (const c of finalCustomers) {
    console.log(`${c.name}: ₹${c.currentBalance}`);
  }

  const finalSuppliers = await Supplier.find({});
  console.log('\n=== SUPPLIER BALANCES ===');
  for (const s of finalSuppliers) {
    console.log(`${s.name}: ₹${s.currentBalance}`);
  }

  console.log('\nSeed complete!');
};

// Helper: Create purchase with all side effects
async function createPurchase({ date, supplier, items, paidAmount, paymentMode }) {
  const seq = await Counter.getNextSequence('purchase');
  const purchaseNumber = `PUR-${String(seq).padStart(4, '0')}`;

  let grandTotal = 0;
  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product._id);
    const totalAmount = Math.round(item.quantity * item.purchaseRate * 100) / 100;
    grandTotal += totalAmount;

    processedItems.push({
      product: product._id, productName: product.name,
      quantity: item.quantity, unit: 'Nag',
      weight: product.standardWeight * item.quantity,
      purchaseRate: item.purchaseRate, totalAmount
    });

    // Update weighted avg cost
    const oldTotal = product.currentStock * product.weightedAvgCost;
    const newTotal = item.quantity * item.purchaseRate;
    const newStock = product.currentStock + item.quantity;
    product.weightedAvgCost = newStock > 0 ? Math.round(((oldTotal + newTotal) / newStock) * 100) / 100 : item.purchaseRate;
    product.currentStock = newStock;
    await product.save();

    await StockTransaction.create({
      product: product._id, productName: product.name,
      date: new Date(date), type: 'purchase',
      quantity: item.quantity, unit: 'Nag', balanceAfter: product.currentStock
    });
  }

  const paid = Math.min(paidAmount || 0, grandTotal);
  const pending = Math.round((grandTotal - paid) * 100) / 100;

  const purchase = await Purchase.create({
    purchaseNumber, date: new Date(date),
    supplier: supplier._id, supplierName: supplier.name,
    items: processedItems, grandTotal, paidAmount: paid, pendingAmount: pending,
    paymentMode: paid > 0 ? paymentMode : 'None'
  });

  // Update supplier balance
  supplier.currentBalance += pending;
  await supplier.save();

  if (paid > 0) {
    await Payment.create({
      date: new Date(date), partyType: 'supplier',
      party: supplier._id, partyModel: 'Supplier', partyName: supplier.name,
      amount: paid, paymentMode, relatedPurchase: purchase._id,
      notes: `खरीदी ${purchaseNumber} का भुगतान`
    });
  }

  return purchase;
}

// Helper: Create sale with all side effects
async function createSale({ date, customer, items, paidAmount, paymentMode }) {
  const seq = await Counter.getNextSequence('invoice');
  const invoiceNumber = `SPBU-${String(seq).padStart(4, '0')}`;

  let grandTotal = 0;
  let totalCost = 0;
  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product._id);
    const totalAmount = Math.round(item.quantity * item.sellingRate * 100) / 100;
    const costRate = product.weightedAvgCost;
    const costAmount = Math.round(item.quantity * costRate * 100) / 100;
    const profit = Math.round((totalAmount - costAmount) * 100) / 100;

    grandTotal += totalAmount;
    totalCost += costAmount;

    processedItems.push({
      product: product._id, productName: product.name,
      quantity: item.quantity, unit: 'Nag',
      weight: product.standardWeight * item.quantity,
      sellingRate: item.sellingRate, costRate, totalAmount, costAmount, profit
    });

    product.currentStock -= item.quantity;
    await product.save();

    await StockTransaction.create({
      product: product._id, productName: product.name,
      date: new Date(date), type: 'sale',
      quantity: -item.quantity, unit: 'Nag', balanceAfter: product.currentStock
    });
  }

  const grossProfit = Math.round((grandTotal - totalCost) * 100) / 100;
  const paid = Math.min(paidAmount || 0, grandTotal);
  const pending = Math.round((grandTotal - paid) * 100) / 100;

  const sale = await Sale.create({
    invoiceNumber, date: new Date(date),
    customer: customer._id, customerName: customer.name, customerMobile: customer.mobile || '',
    items: processedItems, grandTotal, totalCost, grossProfit,
    paidAmount: paid, pendingAmount: pending,
    paymentMode: paid > 0 ? paymentMode : 'None'
  });

  customer.currentBalance += pending;
  await customer.save();

  if (paid > 0) {
    await Payment.create({
      date: new Date(date), partyType: 'customer',
      party: customer._id, partyModel: 'Customer', partyName: customer.name,
      amount: paid, paymentMode, relatedSale: sale._id,
      notes: `बिल ${invoiceNumber} का भुगतान`
    });
  }

  return sale;
}

// Helper: Create standalone payment
async function createPayment({ date, partyType, party, amount, paymentMode, notes }) {
  const payment = await Payment.create({
    date: new Date(date), partyType,
    party: party._id,
    partyModel: partyType === 'customer' ? 'Customer' : 'Supplier',
    partyName: party.name,
    amount, paymentMode, notes
  });

  party.currentBalance -= amount;
  await party.save();

  return payment;
}

module.exports = seed;
 
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
