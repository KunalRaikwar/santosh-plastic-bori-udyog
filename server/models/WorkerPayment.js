const mongoose = require('mongoose');

const workerPaymentSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  workerName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: [true, 'तारीख आवश्यक है'],
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'राशि आवश्यक है'],
    min: [0.01, 'राशि 0 से अधिक होनी चाहिए']
  },
  notes: {
    type: String,
    default: ''
  },
  expenseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  }
}, { timestamps: true });

workerPaymentSchema.index({ worker: 1 });
workerPaymentSchema.index({ date: -1 });

module.exports = mongoose.model('WorkerPayment', workerPaymentSchema);
