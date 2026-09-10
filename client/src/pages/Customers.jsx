import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/api';
import { formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', mobile: '', address: '', openingBalance: '', notes: '' });

  const load = () => {
    getCustomers({ search })
      .then(res => setCustomers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCustomer(editing._id, form);
      } else {
        const res = await createCustomer(form);
        if (res.data) {
          setCustomers(prev => [res.data, ...prev.filter(c => c._id !== res.data._id)]);
        }
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', mobile: '', address: '', openingBalance: '', notes: '' });
      setSearch('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'समस्या हुई');
    }
  };

  const openEdit = (e, c) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(c);
    setForm({
      name: c.name,
      mobile: c.mobile || '',
      address: c.address || '',
      openingBalance: c.openingBalance || '',
      notes: c.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (e, c) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = window.confirm(`क्या आप वाकई ग्राहक "${c.name}" को हटाना चाहते हैं?`);
    if (!ok) return;

    try {
      await deleteCustomer(c._id);
      setCustomers(customers.filter(item => item._id !== c._id));
      alert('ग्राहक हटा दिया गया।');
    } catch (err) {
      alert(err.response?.data?.message || 'हटाने में समस्या हुई।');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">👥 ग्राहक (Customers)</h2>
          <p className="text-xs text-gray-500">ग्राहकों की सूची व खाता विवरण</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', mobile: '', address: '', openingBalance: '', notes: '' });
            setShowModal(true);
          }}
          className="btn btn-primary text-sm whitespace-nowrap"
        >
          + नया ग्राहक जोड़ें
        </button>
      </div>

      <input
        type="text"
        placeholder="ग्राहक का नाम या मोबाइल खोजें..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(c => (
          <div
            key={c._id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/60 transition shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <Link to={`/customers/${c._id}`} className="font-bold text-gray-800 hover:text-primary text-base">
                  {c.name}
                </Link>
                {c.currentBalance > 0 ? (
                  <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                    बाकी
                  </span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                    क्लियर
                  </span>
                )}
              </div>

              {c.mobile && <p className="text-xs text-gray-600 mb-1">📞 {c.mobile}</p>}
              {c.address && <p className="text-xs text-gray-400 mb-2">📍 {c.address}</p>}

              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg my-2 border border-gray-100">
                <span className="text-xs text-gray-500">वर्तमान बकाया:</span>
                <span className={`text-sm font-bold ${c.currentBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {c.currentBalance > 0 ? formatCurrency(c.currentBalance) : '✓ कोई बकाया नहीं'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2 text-xs">
              <Link
                to={`/customers/${c._id}`}
                className="text-primary font-semibold hover:underline"
              >
                📒 खाता देखें
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => openEdit(e, c)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => handleDelete(e, c)}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 rounded text-red-600 font-medium"
                  title="ग्राहक हटाएं"
                >
                  🗑️ हटाएं
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <p className="text-center py-8 text-gray-400">कोई ग्राहक नहीं मिला</p>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'ग्राहक अपडेट करें' : 'नया ग्राहक जोड़ें'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">नाम *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="फर्म या व्यापारी का नाम"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">मोबाइल</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => setForm({ ...form, mobile: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="10 अंकों का नंबर"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">पता</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="दुकान / गोदाम का पता"
            />
          </div>
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">पिछला बाकी बैलेंस (Opening Balance ₹)</label>
              <input
                type="number"
                value={form.openingBalance}
                onChange={e => setForm({ ...form, openingBalance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
            {editing ? 'अपडेट करें' : 'ग्राहक जोड़ें'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
