import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    address: '',
    mobile: '',
    gstNumber: '',
    upiId: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: ''
    },
    defaultLaborCost: 0,
    invoiceTerms: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      if (res.data) {
        setForm({
          businessName: res.data.businessName || 'Santosh Plastic Bori Udyog',
          ownerName: res.data.ownerName || '',
          address: res.data.address || '',
          mobile: res.data.mobile || '',
          gstNumber: res.data.gstNumber || '',
          upiId: res.data.upiId || '',
          bankDetails: res.data.bankDetails || { accountName: '', accountNumber: '', ifscCode: '', bankName: '' },
          defaultLaborCost: res.data.defaultLaborCost || 0,
          invoiceTerms: res.data.invoiceTerms || 'Goods once sold will not be taken back.'
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateSettings(form);
      setMessage({ type: 'success', text: 'सेटिंग्स सफलतापूर्वक सेव हो गई हैं!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'सेटिंग्स सेव करने में समस्या हुई।' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">व्यापार सेटिंग्स (Business Settings)</h1>
        <p className="text-slate-500 text-sm">फर्म का नाम, पता, जीएसटी और बैंक विवरण बदलें</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
          फर्म की सामान्य जानकारी (General Profile)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">फर्म का नाम (Business Name)</label>
            <input
              type="text"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">मालिक का नाम (Owner Name)</label>
            <input
              type="text"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">मोबाइल नंबर (Mobile)</label>
            <input
              type="text"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">जीएसटी नंबर (GSTIN)</label>
            <input
              type="text"
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">पूरा पता (Address)</label>
            <textarea
              rows="2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700 pt-4">
          बैंक विवरण & पेमेंट जानकारी (Bank & Payment Info)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">खाता धारक का नाम (Account Name)</label>
            <input
              type="text"
              value={form.bankDetails?.accountName || ''}
              onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, accountName: e.target.value } })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">बैंक का नाम (Bank Name)</label>
            <input
              type="text"
              value={form.bankDetails?.bankName || ''}
              onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">खाता संख्या (Account Number)</label>
            <input
              type="text"
              value={form.bankDetails?.accountNumber || ''}
              onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">आईएफएससी कोड (IFSC Code)</label>
            <input
              type="text"
              value={form.bankDetails?.ifscCode || ''}
              onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, ifscCode: e.target.value } })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">UPI ID (GooglePay / PhonePe / Paytm)</label>
            <input
              type="text"
              value={form.upiId}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">डिफॉल्ट मजदूरी दर (Default Labor Rate per bag)</label>
            <input
              type="number"
              value={form.defaultLaborCost}
              onChange={(e) => setForm({ ...form, defaultLaborCost: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">बिल के नियम व शर्तें (Invoice Terms & Conditions)</label>
          <textarea
            rows="2"
            value={form.invoiceTerms}
            onChange={(e) => setForm({ ...form, invoiceTerms: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md disabled:opacity-50 transition-colors"
          >
            {saving ? 'सेव हो रहा है...' : 'सेटिंग्स सेव करें'}
          </button>
        </div>
      </form>
    </div>
  );
}
