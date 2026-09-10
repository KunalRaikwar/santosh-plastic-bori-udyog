import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPurchases, deletePurchase } from '../api/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPurchases = () => {
    getPurchases()
      .then(res => setPurchases(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const handleDelete = async (p) => {
    const ok = window.confirm(
      `क्या आप वाकई खरीदी बिल ${p.purchaseNumber} (${p.supplierName}) को हटाना चाहते हैं?\n\nध्यान दें: इससे स्टॉक घट जाएगा और सप्लायर का बैलेंस ठीक हो जाएगा।`
    );
    if (!ok) return;

    try {
      await deletePurchase(p._id);
      setPurchases(purchases.filter(item => item._id !== p._id));
      alert('खरीदी रिकॉर्ड सफलतापूर्वक हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'हटाने में समस्या हुई।');
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const num = p.purchaseNumber || '';
    const supp = p.supplierName || '';
    return num.toLowerCase().includes(search.toLowerCase()) || supp.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📦 माल खरीदी (Purchase Records)</h2>
          <p className="text-xs text-gray-500">सभी माल खरीद प्रविष्टियों का रिकॉर्ड</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="खरीदी नं या सप्लायर खोजें..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          />
          <Link to="/purchases/new" className="btn btn-primary text-sm whitespace-nowrap">
            + नई खरीदी
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">तारीख</th>
              <th className="text-left px-4 py-3 font-semibold">खरीदी नंबर</th>
              <th className="text-left px-4 py-3 font-semibold">सप्लायर</th>
              <th className="text-left px-4 py-3 font-semibold">माल विवरण</th>
              <th className="text-right px-4 py-3 font-semibold">कुल राशि</th>
              <th className="text-right px-4 py-3 font-semibold">भुगतान</th>
              <th className="text-right px-4 py-3 font-semibold">बाकी</th>
              <th className="text-center px-4 py-3 font-semibold">कार्रवाई</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPurchases.map(p => (
              <tr key={p._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(p.date)}</td>
                <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{p.purchaseNumber}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{p.supplierName}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.items.map(i => `${i.productName} (${i.quantity} नग${i.weight ? `, ${i.weight} KG` : ''})`).join('; ')}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(p.grandTotal)}</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(p.paidAmount)}</td>
                <td className="px-4 py-3 text-right font-medium text-orange-600">
                  {p.pendingAmount > 0 ? formatCurrency(p.pendingAmount) : '-'}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(p)}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
                    title="डिलीट करें"
                  >
                    🗑️ हटाएं
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPurchases.length === 0 && (
          <p className="text-center py-8 text-gray-400">कोई खरीदी रिकॉर्ड नहीं मिला</p>
        )}
      </div>
    </div>
  );
}
