import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSales, deleteSale } from '../api/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadSales = () => {
    getSales()
      .then(res => setSales(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleDelete = async (s) => {
    const ok = window.confirm(
      `क्या आप वाकई बिल ${s.invoiceNumber} (${s.customerName}) को हटाना चाहते हैं?\n\nध्यान दें: इससे स्टॉक वापस जुड़ जाएगा और ग्राहक का बकाया बैलेंस ठीक हो जाएगा।`
    );
    if (!ok) return;

    try {
      await deleteSale(s._id);
      setSales(sales.filter(item => item._id !== s._id));
      alert('बिक्री रिकॉर्ड सफलतापूर्वक हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'हटाने में समस्या हुई।');
    }
  };

  const filteredSales = sales.filter(s => {
    const inv = s.invoiceNumber || '';
    const cust = s.customerName || '';
    return inv.toLowerCase().includes(search.toLowerCase()) || cust.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🛒 माल बिक्री (Sales Records)</h2>
          <p className="text-xs text-gray-500">सभी बिक्री बिलों का विवरण</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="बिल नं या ग्राहक खोजें..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          />
          <Link to="/sales/new" className="btn btn-primary text-sm whitespace-nowrap">
            + नई बिक्री (New Bill)
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">तारीख</th>
              <th className="text-left px-4 py-3 font-semibold">बिल नंबर</th>
              <th className="text-left px-4 py-3 font-semibold">ग्राहक</th>
              <th className="text-left px-4 py-3 font-semibold">माल विवरण</th>
              <th className="text-right px-4 py-3 font-semibold">कुल राशि</th>
              <th className="text-right px-4 py-3 font-semibold">बाकी</th>
              <th className="text-right px-4 py-3 font-semibold">लाभ</th>
              <th className="text-center px-4 py-3 font-semibold">कार्रवाई (Action)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSales.map(s => (
              <tr key={s._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.date)}</td>
                <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{s.invoiceNumber}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{s.customerName}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {s.items.map(i => `${i.productName} (${i.quantity} नग${i.weight ? `, ${i.weight} KG` : ''})`).join('; ')}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(s.grandTotal)}</td>
                <td className="px-4 py-3 text-right font-medium text-orange-600">
                  {s.pendingAmount > 0 ? formatCurrency(s.pendingAmount) : <span className="text-green-600">✓ चुकता</span>}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${s.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(s.grossProfit)}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      to={`/sales/${s._id}/invoice`}
                      className="inline-flex items-center px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold"
                    >
                      🧾 देखें/प्रिंट
                    </Link>
                    <button
                      onClick={() => handleDelete(s)}
                      className="inline-flex items-center px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
                      title="डिलीट करें"
                    >
                      🗑️ हटाएं
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSales.length === 0 && (
          <p className="text-center py-8 text-gray-400">कोई बिक्री रिकॉर्ड नहीं मिला</p>
        )}
      </div>
    </div>
  );
}
