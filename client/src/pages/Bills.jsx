import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSales, getPurchases, deleteSale, deletePurchase } from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Bills() {
  const [type, setType] = useState('sale'); // 'sale' or 'purchase'
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchBills();
  }, [type]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      if (type === 'sale') {
        const res = await getSales({ search });
        setItems(res.data.sales || res.data || []);
      } else {
        const res = await getPurchases({ search });
        setItems(res.data.purchases || res.data || []);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const isSale = type === 'sale';
    const num = item.invoiceNumber || item.purchaseNumber;
    const name = item.customerName || item.supplierName;
    const ok = window.confirm(
      `क्या आप वाकई ${isSale ? 'बिक्री' : 'खरीदी'} बिल ${num} (${name}) को हटाना चाहते हैं?\n\nध्यान दें: इससे स्टॉक और खाता बैलेंस स्वतः सही हो जाएगा।`
    );
    if (!ok) return;

    try {
      if (isSale) {
        await deleteSale(item._id);
      } else {
        await deletePurchase(item._id);
      }
      setItems(items.filter(i => i._id !== item._id));
      alert('बिल सफलतापूर्वक हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'बिल हटाने में समस्या हुई।');
    }
  };

  const filteredItems = items.filter(item => {
    const billNo = item.invoiceNumber || item.purchaseNumber || '';
    const partyName = item.customerName || item.supplierName || '';
    return billNo.toLowerCase().includes(search.toLowerCase()) || partyName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">बिल और इनवॉयस (Bills & Invoices)</h1>
          <p className="text-slate-500 text-sm">सभी बिक्री और खरीदारी के बिलों का रिकॉर्ड</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/sales/new"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            + नया बिक्री बिल
          </Link>
          <Link
            to="/purchases/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            + नया खरीदारी बिल
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setType('sale')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              type === 'sale'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            बिक्री बिल (Sales Bills)
          </button>
          <button
            onClick={() => setType('purchase')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              type === 'purchase'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            खरीदारी बिल (Purchase Bills)
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="बिल नंबर या नाम से खोजें..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 uppercase text-xs">
                <tr>
                  <th className="p-3">दिनांक</th>
                  <th className="p-3">बिल नंबर</th>
                  <th className="p-3">{type === 'sale' ? 'ग्राहक' : 'सप्लायर'}</th>
                  <th className="p-3">कुल रकम</th>
                  <th className="p-3">जमा राशि</th>
                  <th className="p-3">बकाया</th>
                  <th className="p-3 text-right">कार्रवाई (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400">कोई बिल नहीं मिला</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                        {item.invoiceNumber || item.purchaseNumber}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-200 font-medium">
                        {item.customerName || item.supplierName}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        ₹{item.grandTotal?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-emerald-600 font-medium">
                        ₹{item.paidAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-rose-600 font-medium">
                        ₹{item.pendingAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {type === 'sale' && (
                            <Link
                              to={`/sales/${item._id}/invoice`}
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              🧾 देखें / प्रिंट
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg transition-colors"
                            title="बिल हटाएं"
                          >
                            🗑️ हटाएं
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
