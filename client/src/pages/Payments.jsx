import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPayments, receivePayment, paySupplier, deletePayment, getCustomers, getSuppliers } from '../api/api';
import { formatCurrency, formatDate, paymentModes, todayStr } from '../utils/helpers';
import { generatePaymentMessage, openWhatsApp } from '../utils/whatsapp';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function Payments() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'pay' ? 'pay' : 'receive');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ date: todayStr(), party: '', amount: '', paymentMode: 'Cash', referenceNumber: '', notes: '' });
  const [error, setError] = useState('');
  const [lastPayment, setLastPayment] = useState(null);

  const load = () => {
    getPayments({ partyType: tab === 'receive' ? 'customer' : 'supplier' })
      .then(res => setPayments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    getCustomers({ active: true }).then(res => setCustomers(res.data));
    getSuppliers({ active: true }).then(res => setSuppliers(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.party) return setError('कृपया पार्टी चुनें।');
    if (!form.amount || Number(form.amount) <= 0) return setError('कृपया सही राशि दर्ज करें।');

    try {
      let res;
      if (tab === 'receive') {
        res = await receivePayment(form);
        setLastPayment({
          type: 'receive',
          customerName: res.data.customerName,
          amount: Number(form.amount),
          newBalance: res.data.newBalance,
          mobile: customers.find(c => c._id === form.party)?.mobile
        });
      } else {
        res = await paySupplier(form);
        setLastPayment(null);
      }
      setShowModal(false);
      setForm({ date: todayStr(), party: '', amount: '', paymentMode: 'Cash', referenceNumber: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'भुगतान सेव करने में समस्या हुई।');
    }
  };

  const handleDelete = async (p) => {
    const ok = window.confirm(
      `क्या आप वाकई ₹${p.amount} का यह भुगतान (${p.partyName}) हटाना चाहते हैं?\n\nध्यान दें: इससे पार्टी का बकाया खाता बैलेंस स्वतः पहले जैसा हो जाएगा।`
    );
    if (!ok) return;

    try {
      await deletePayment(p._id);
      setPayments(payments.filter(item => item._id !== p._id));
      alert('भुगतान रिकॉर्ड हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'हटाने में समस्या हुई।');
    }
  };

  const handleWhatsApp = () => {
    if (!lastPayment) return;
    const msg = generatePaymentMessage(lastPayment.customerName, lastPayment.amount, lastPayment.newBalance);
    openWhatsApp(lastPayment.mobile, msg);
    setLastPayment(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">💰 भुगतान (Payments)</h2>
          <p className="text-xs text-gray-500">रुपये की आवक व जावक की प्रविष्टि</p>
        </div>
        <button
          onClick={() => {
            setForm({ date: todayStr(), party: '', amount: '', paymentMode: 'Cash', referenceNumber: '', notes: '' });
            setShowModal(true);
          }}
          className="btn btn-primary text-sm whitespace-nowrap"
        >
          + {tab === 'receive' ? 'भुगतान प्राप्त (Receive)' : 'सप्लायर भुगतान (Pay)'}
        </button>
      </div>

      {/* WhatsApp notification */}
      {lastPayment && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-green-700 font-medium">
            ✓ {lastPayment.customerName} से {formatCurrency(lastPayment.amount)} भुगतान प्राप्त हुआ। नया बकाया: {formatCurrency(lastPayment.newBalance)}
          </p>
          <button onClick={handleWhatsApp} className="btn btn-whatsapp text-xs">
            📲 WhatsApp रसीद भेजें
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('receive')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'receive' ? 'bg-white text-primary shadow-xs font-bold' : 'text-gray-500'
          }`}
        >
          📥 ग्राहक से प्राप्त (Customer Received)
        </button>
        <button
          onClick={() => setTab('pay')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'pay' ? 'bg-white text-primary shadow-xs font-bold' : 'text-gray-500'
          }`}
        >
          📤 सप्लायर को भुगतान (Supplier Paid)
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">तारीख</th>
              <th className="text-left px-4 py-3 font-semibold">{tab === 'receive' ? 'ग्राहक' : 'सप्लायर'}</th>
              <th className="text-right px-4 py-3 font-semibold">भुगतान राशि</th>
              <th className="text-left px-4 py-3 font-semibold">Mode</th>
              <th className="text-left px-4 py-3 font-semibold">नोट / विवरण</th>
              <th className="text-center px-4 py-3 font-semibold">कार्रवाई</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map(p => (
              <tr key={p._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(p.date)}</td>
                <td className="px-4 py-3 text-gray-800 font-bold">{p.partyName}</td>
                <td className="px-4 py-3 text-right font-bold text-green-600 whitespace-nowrap">
                  {formatCurrency(p.amount)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{p.paymentMode}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.notes || '-'}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(p)}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
                    title="भुगतान हटाएं"
                  >
                    🗑️ हटाएं
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <p className="text-center py-8 text-gray-400">कोई भुगतान रिकॉर्ड नहीं मिला</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={tab === 'receive' ? 'भुगतान प्राप्त करें' : 'सप्लायर को भुगतान करें'}>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tab === 'receive' ? 'ग्राहक चुनें *' : 'सप्लायर चुनें *'}
            </label>
            <select
              value={form.party}
              onChange={e => setForm({ ...form, party: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">— चुनें —</option>
              {(tab === 'receive' ? customers : suppliers).map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.currentBalance > 0 ? `(बाकी: ${formatCurrency(p.currentBalance)})` : ''}
                </option>
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
              placeholder="5000"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference / UTR No.</label>
            <input
              type="text"
              value={form.referenceNumber}
              onChange={e => setForm({ ...form, referenceNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="UPI / Cheque No."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">नोट्स</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="विवरण..."
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
            💰 भुगतान सेव करें
          </button>
        </form>
      </Modal>
    </div>
  );
}
