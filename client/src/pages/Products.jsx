import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/api';
import { formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'Plastic Bori',
    standardWeight: '',
    weightUnit: 'KG',
    defaultPurchaseRate: '',
    defaultSellingRate: '',
    defaultUnit: 'Nag',
    openingStock: ''
  });

  const loadProducts = () => {
    getProducts({ search })
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateProduct(editing._id, form);
      } else {
        await createProduct(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({
        name: '',
        category: 'Plastic Bori',
        standardWeight: '',
        weightUnit: 'KG',
        defaultPurchaseRate: '',
        defaultSellingRate: '',
        defaultUnit: 'Nag',
        openingStock: ''
      });
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'समस्या हुई');
    }
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      standardWeight: p.standardWeight || '',
      weightUnit: p.weightUnit || 'KG',
      defaultPurchaseRate: p.defaultPurchaseRate || '',
      defaultSellingRate: p.defaultSellingRate || '',
      defaultUnit: p.defaultUnit || 'Nag',
      openingStock: p.openingStock || ''
    });
    setShowModal(true);
  };

  const toggleActive = async (p) => {
    await updateProduct(p._id, { isActive: !p.isActive });
    loadProducts();
  };

  const handleDelete = async (p) => {
    const ok = window.confirm(`क्या आप वाकई माल "${p.name}" को हटाना चाहते हैं?`);
    if (!ok) return;

    try {
      await deleteProduct(p._id);
      setProducts(products.filter(item => item._id !== p._id));
      alert('माल रिकॉर्ड हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'हटाने में समस्या हुई।');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📋 माल / Products</h2>
          <p className="text-xs text-gray-500">सभी उत्पादों व स्टॉक की सूची</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({
              name: '',
              category: 'Plastic Bori',
              standardWeight: '',
              weightUnit: 'KG',
              defaultPurchaseRate: '',
              defaultSellingRate: '',
              defaultUnit: 'Nag',
              openingStock: ''
            });
            setShowModal(true);
          }}
          className="btn btn-primary text-sm whitespace-nowrap"
        >
          + नया माल जोड़ें (Add Product)
        </button>
      </div>

      <input
        type="text"
        placeholder="माल का नाम खोजें..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">माल</th>
              <th className="text-left px-4 py-3 font-semibold">मानक वजन</th>
              <th className="text-right px-4 py-3 font-semibold">खरीदी रेट</th>
              <th className="text-right px-4 py-3 font-semibold">बिक्री रेट</th>
              <th className="text-right px-4 py-3 font-semibold">वर्तमान स्टॉक</th>
              <th className="text-center px-4 py-3 font-semibold">स्थिति</th>
              <th className="text-center px-4 py-3 font-semibold">एक्शन</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {p.standardWeight ? `${p.standardWeight} ${p.weightUnit}` : <span className="text-gray-400">मैन्युअल टाइप</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {formatCurrency(p.defaultPurchaseRate)}/{p.defaultUnit === 'Nag' ? 'नग' : p.defaultUnit}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {formatCurrency(p.defaultSellingRate)}/{p.defaultUnit === 'Nag' ? 'नग' : p.defaultUnit}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {p.currentStock.toLocaleString('en-IN')} {p.defaultUnit === 'Nag' ? 'नग' : p.defaultUnit}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => toggleActive(p)}
                      className="px-2 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded text-xs font-medium"
                    >
                      {p.isActive ? 'बंद' : 'चालू'}
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium"
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
        {products.length === 0 && (
          <p className="text-center py-8 text-gray-400">कोई माल रिकॉर्ड नहीं मिला</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'माल अपडेट करें' : 'नया माल जोड़ें'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">माल का नाम *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="जैसे: सफेद बोरी, काला रोल, बैग आदि"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">डिफ़ॉल्ट यूनिट</label>
              <select
                value={form.defaultUnit}
                onChange={e => setForm({ ...form, defaultUnit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="Nag">नग (Nag)</option>
                <option value="KG">KG (किलो)</option>
                <option value="Bundle">Bundle (बंडल)</option>
                <option value="Other">अन्य (Other)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">वज़न (वैकल्पिक)</label>
              <input
                type="number"
                step="0.01"
                value={form.standardWeight}
                onChange={e => setForm({ ...form, standardWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="खाली छोड़ सकते हैं"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">खरीदी रेट (₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.defaultPurchaseRate}
                onChange={e => setForm({ ...form, defaultPurchaseRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">बिक्री रेट (₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.defaultSellingRate}
                onChange={e => setForm({ ...form, defaultSellingRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">शुरुआती स्टॉक (Opening Stock)</label>
              <input
                type="number"
                value={form.openingStock}
                onChange={e => setForm({ ...form, openingStock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
            {editing ? 'अपडेट करें' : 'माल जोड़ें'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
