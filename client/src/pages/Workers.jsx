import { useState, useEffect } from 'react';
import { getWorkers, createWorker, updateWorker, getWorker, payWorker, deleteWorker, deleteWorkerPayment } from '../api/api';
import { formatCurrency, formatDate, todayStr } from '../utils/helpers';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selected, setSelected] = useState(null);
  const [workerDetail, setWorkerDetail] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', paymentType: 'daily', dailyRate: '', monthlyRate: '', notes: '' });
  const [payForm, setPayForm] = useState({ date: todayStr(), amount: '', notes: '' });
  const [error, setError] = useState('');

  const load = () => {
    getWorkers()
      .then(res => setWorkers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) await updateWorker(selected._id, form);
      else await createWorker(form);
      setShowModal(false);
      setSelected(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'समस्या हुई');
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    if (!payForm.amount || Number(payForm.amount) <= 0) return setError('कृपया सही राशि दर्ज करें।');
    try {
      await payWorker(selected._id, { ...payForm, amount: Number(payForm.amount) });
      setShowPayModal(false);
      setPayForm({ date: todayStr(), amount: '', notes: '' });
      load();
      alert('भुगतान सफलतापूर्वक दर्ज किया गया।');
    } catch (err) {
      setError(err.response?.data?.message || 'समस्या हुई');
    }
  };

  const viewHistory = async (w) => {
    const res = await getWorker(w._id);
    setWorkerDetail(res.data);
    setShowHistory(true);
  };

  const handleDeleteWorker = async (w) => {
    const ok = window.confirm(`क्या आप वाकई कर्मचारी "${w.name}" और उनके सभी पेमेंट रिकॉर्ड हटाना चाहते हैं?`);
    if (!ok) return;

    try {
      await deleteWorker(w._id);
      setWorkers(workers.filter(item => item._id !== w._id));
      alert('कर्मचारी रिकॉर्ड हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'हटाने में समस्या हुई।');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const ok = window.confirm('क्या आप वाकई यह भुगतान एंट्री हटाना चाहते हैं?');
    if (!ok) return;

    try {
      await deleteWorkerPayment(paymentId);
      const res = await getWorker(workerDetail._id);
      setWorkerDetail(res.data);
      load();
      alert('भुगतान हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'हटाने में समस्या हुई।');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">👷 कर्मचारी व लेबर (Workers & Wages)</h2>
          <p className="text-xs text-gray-500">कारीगर, मजदूर और दैनिक भुगतान का हिसाब</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setForm({ name: '', mobile: '', paymentType: 'daily', dailyRate: '', monthlyRate: '', notes: '' });
            setShowModal(true);
          }}
          className="btn btn-primary text-sm whitespace-nowrap"
        >
          + नया कर्मचारी जोड़ें
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map(w => (
          <div key={w._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">{w.name}</h3>
                  {w.mobile && <p className="text-xs text-gray-500">📞 {w.mobile}</p>}
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                  {w.paymentType === 'daily' ? 'दैनिक मजदूरी' : w.paymentType === 'monthly' ? 'मासिक वेतन' : 'साप्ताहिक'}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                रेट: {w.paymentType === 'daily' ? `${formatCurrency(w.dailyRate)} / दिन` : `${formatCurrency(w.monthlyRate)} / महीना`}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelected(w);
                    setPayForm({ date: todayStr(), amount: w.dailyRate || '', notes: '' });
                    setShowPayModal(true);
                  }}
                  className="btn btn-primary text-xs flex-1 justify-center py-2"
                >
                  💰 भुगतान दें
                </button>
                <button
                  onClick={() => viewHistory(w)}
                  className="btn btn-outline text-xs flex-1 justify-center py-2"
                >
                  📜 हिस्ट्री
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setSelected(w);
                    setForm({
                      name: w.name,
                      mobile: w.mobile || '',
                      paymentType: w.paymentType,
                      dailyRate: w.dailyRate || '',
                      monthlyRate: w.monthlyRate || '',
                      notes: w.notes || ''
                    });
                    setShowModal(true);
                  }}
                  className="text-xs text-gray-600 hover:text-primary font-medium"
                >
                  ✏️ Edit
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => handleDeleteWorker(w)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  🗑️ हटाएं
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workers.length === 0 && (
        <p className="text-center py-8 text-gray-400">कोई कर्मचारी रिकॉर्ड नहीं मिला</p>
      )}

      {/* Add/Edit Worker */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selected ? 'कर्मचारी अपडेट करें' : 'नया कर्मचारी जोड़ें'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">नाम *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="कर्मचारी का नाम"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">मोबाइल</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => setForm({ ...form, mobile: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="मोबाइल नंबर"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">भुगतान प्रकार</label>
            <select
              value={form.paymentType}
              onChange={e => setForm({ ...form, paymentType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="daily">दैनिक (Daily Wages)</option>
              <option value="weekly">साप्ताहिक (Weekly)</option>
              <option value="monthly">मासिक (Monthly Salary)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.paymentType === 'monthly' ? 'मासिक वेतन (₹)' : 'दैनिक मजदूरी (₹)'}
            </label>
            <input
              type="number"
              value={form.paymentType === 'monthly' ? form.monthlyRate : form.dailyRate}
              onChange={e => setForm({ ...form, [form.paymentType === 'monthly' ? 'monthlyRate' : 'dailyRate']: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
            {selected ? 'अपडेट करें' : 'कर्मचारी जोड़ें'}
          </button>
        </form>
      </Modal>

      {/* Pay Worker */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title={`${selected?.name} को भुगतान`}>
        <form onSubmit={handlePay} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">तारीख *</label>
            <input
              type="date"
              value={payForm.date}
              onChange={e => setPayForm({ ...payForm, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">भुगतान राशि (₹) *</label>
            <input
              type="number"
              value={payForm.amount}
              onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">नोट्स</label>
            <textarea
              value={payForm.notes}
              onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="जैसे: 5 दिन की मजदूरी"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
            💰 भुगतान सेव करें
          </button>
        </form>
      </Modal>

      {/* Worker Payment History */}
      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title={`${workerDetail?.name} — भुगतान हिस्ट्री`} size="lg">
        {workerDetail && (
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center text-sm">
              <span className="text-gray-600">कुल किया गया भुगतान:</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(workerDetail.totalPaid)}</span>
            </div>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">तारीख</th>
                    <th className="text-right px-3 py-2">राशि</th>
                    <th className="text-left px-3 py-2">नोट / विवरण</th>
                    <th className="text-center px-3 py-2">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workerDetail.payments?.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDate(p.date)}</td>
                      <td className="px-3 py-2 text-right font-bold text-green-600">{formatCurrency(p.amount)}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{p.notes || '-'}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeletePayment(p._id)}
                          className="px-2 py-0.5 bg-red-50 hover:bg-red-100 rounded text-red-600 text-xs font-semibold"
                          title="पेमेंट हटाएं"
                        >
                          🗑️ हटाएं
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!workerDetail.payments || workerDetail.payments.length === 0) && (
                <p className="text-center py-6 text-gray-400">कोई भुगतान हिस्ट्री नहीं है</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
