import { useState, useEffect } from 'react';
import { getExpenses, createExpense, deleteExpense } from '../api/api';
import { formatCurrency, formatDate, expenseCategories, paymentModes, todayStr } from '../utils/helpers';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), category: '', amount: '', description: '', paymentMode: 'Cash', notes: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    getExpenses()
      .then(res => setExpenses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('कृपया श्रेणी चुनें।');
    if (!form.amount || Number(form.amount) <= 0) return setError('कृपया सही राशि दर्ज करें।');
    try {
      await createExpense({ ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm({ date: todayStr(), category: '', amount: '', description: '', paymentMode: 'Cash', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'समस्या हुई');
    }
  };

  const handleDelete = async (e) => {
    const ok = window.confirm(`क्या आप वाकई ₹${e.amount} का यह खर्चा (${e.description || e.category}) हटाना चाहते हैं?`);
    if (!ok) return;

    try {
      await deleteExpense(e._id);
      setExpenses(expenses.filter(item => item._id !== e._id));
      alert('खर्चा हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'हटाने में समस्या हुई।');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const desc = e.description || '';
    const cat = e.category || '';
    return desc.toLowerCase().includes(search.toLowerCase()) || cat.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🚚 अन्य खर्चे (Expenses)</h2>
          <p className="text-sm text-gray-500">
            कुल खर्चा: <span className="font-bold text-red-600">{formatCurrency(total)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="खर्चा खोजें..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          />
          <button onClick={() => setShowModal(true)} className="btn btn-primary text-sm whitespace-nowrap">
            + नया खर्चा जोड़ें
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">तारीख</th>
              <th className="text-left px-4 py-3 font-semibold">श्रेणी</th>
              <th className="text-left px-4 py-3 font-semibold">विवरण</th>
              <th className="text-right px-4 py-3 font-semibold">राशि</th>
              <th className="text-left px-4 py-3 font-semibold">Mode</th>
              <th className="text-center px-4 py-3 font-semibold">कार्रवाई</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredExpenses.map(e => (
              <tr key={e._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(e.date)}</td>
                <td className="px-4 py-3">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold text-gray-700">
                    {expenseCategories[e.category] || e.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-800">{e.description}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(e.amount)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{e.paymentMode}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(e)}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
                    title="खर्चा हटाएं"
                  >
                    🗑️ हटाएं
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredExpenses.length === 0 && (
          <p className="text-center py-8 text-gray-400">कोई खर्चा रिकॉर्ड नहीं मिला</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="नया खर्चा जोड़ें">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">तारीख *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">श्रेणी *</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">— श्रेणी चुनें —</option>
              {Object.entries(expenseCategories).map(([key, label]) => (
                <option key={key} value={key}>{label} ({key})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">राशि (₹) *</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">विवरण</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="जैसे: फैक्ट्री बिजली बिल, गाड़ी भाड़ा"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={form.paymentMode}
              onChange={e => setForm({ ...form, paymentMode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {paymentModes.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
            खर्चा सेव करें
          </button>
        </form>
      </Modal>
    </div>
  );
}
