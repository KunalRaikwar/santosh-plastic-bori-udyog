import { useState, useEffect } from 'react';
import { getProducts, getStockHistory } from '../api/api';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getProducts({ active: true }).then(res => setProducts(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const viewHistory = async (product) => {
    setSelectedProduct(product);
    const res = await getStockHistory(product._id);
    setHistory(res.data);
    setShowHistory(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">📋 स्टॉक</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {products.map(p => (
          <div key={p._id} className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">{p.name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Opening:</span><span>{p.openingStock} {p.defaultUnit === 'Nag' ? 'नग' : p.defaultUnit}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Current:</span><span className={`font-bold ${p.currentStock < 100 ? 'text-orange-600' : 'text-green-600'}`}>{p.currentStock.toLocaleString('en-IN')} {p.defaultUnit === 'Nag' ? 'नग' : p.defaultUnit}</span></div>
              {p.standardWeight > 0 && <div className="flex justify-between"><span className="text-gray-500">Total Weight:</span><span>{(p.currentStock * p.standardWeight).toLocaleString('en-IN')} KG</span></div>}
            </div>
            <button onClick={() => viewHistory(p)} className="btn btn-outline w-full justify-center mt-3 text-xs">📜 हिस्ट्री देखें</button>
          </div>
        ))}
      </div>

      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title={`${selectedProduct?.name} — स्टॉक हिस्ट्री`} size="lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">तारीख</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">प्रकार</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600">मात्रा</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600">बैलेंस</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-600">{formatDate(h.date)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.type === 'purchase' ? 'bg-blue-100 text-blue-700' : h.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {h.type === 'purchase' ? 'खरीदी' : h.type === 'sale' ? 'बिक्री' : h.type === 'opening' ? 'Opening' : h.type}
                    </span>
                  </td>
                  <td className={`px-3 py-2 text-right font-medium ${h.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {h.quantity > 0 ? '+' : ''}{h.quantity} {h.unit === 'Nag' ? 'नग' : h.unit}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{h.balanceAfter} {h.unit === 'Nag' ? 'नग' : h.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p className="text-center py-6 text-gray-400">कोई हिस्ट्री नहीं</p>}
        </div>
      </Modal>
    </div>
  );
}
