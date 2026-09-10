import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, getProducts, createSale } from '../api/api';
import { formatCurrency, todayStr, paymentModes } from '../utils/helpers';

export default function SaleForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ date: todayStr(), customer: '', paymentMode: 'Cash', paidAmount: '', notes: '' });
  const [items, setItems] = useState([
    { productName: '', product: '', unitType: 'Nag', quantity: '', weight: '', sellingRate: '' }
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCustomers({ active: true }).then(res => setCustomers(res.data));
    getProducts({ active: true }).then(res => setProducts(res.data));
  }, []);

  const addItem = () => setItems([
    ...items,
    { productName: '', product: '', unitType: 'Nag', quantity: '', weight: '', sellingRate: '' }
  ]);

  const removeItem = (i) => {
    if (items.length > 1) setItems(items.filter((_, idx) => idx !== i));
  };

  const handleProductNameChange = (i, val) => {
    const updated = [...items];
    updated[i].productName = val;
    // Check if typed name matches any existing product
    const matched = products.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      updated[i].product = matched._id;
      if (matched.defaultSellingRate && !updated[i].sellingRate) {
        updated[i].sellingRate = matched.defaultSellingRate;
      }
      if (matched.defaultUnit === 'KG') {
        updated[i].unitType = 'KG';
      }
    } else {
      updated[i].product = '';
    }
    setItems(updated);
  };

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const calculateRowTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const w = Number(item.weight) || 0;
    const rate = Number(item.sellingRate) || 0;
    if (item.unitType === 'KG') {
      return Math.round(w * rate * 100) / 100;
    }
    return Math.round(qty * rate * 100) / 100;
  };

  const grandTotal = items.reduce((sum, item) => sum + calculateRowTotal(item), 0);
  const totalNag = items.filter(i => i.unitType === 'Nag' || (Number(i.quantity) > 0 && i.unitType !== 'KG')).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalWeight = items.filter(i => i.unitType === 'KG' || (Number(i.weight) > 0 && i.unitType !== 'Nag')).reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const hasNag = items.some(i => i.unitType === 'Nag' || (Number(i.quantity) > 0 && i.unitType !== 'KG'));
  const hasWeight = items.some(i => i.unitType === 'KG' || (Number(i.weight) > 0 && i.unitType !== 'Nag'));
  const pending = grandTotal - (Number(form.paidAmount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customer) return setError('कृपया ग्राहक चुनें।');
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (!item.productName || !item.productName.trim()) {
        return setError(`पंक्ति #${idx + 1}: कृपया माल का नाम दर्ज करें।`);
      }
      
      if (item.unitType === 'KG') {
        if (!item.weight || Number(item.weight) <= 0) {
          return setError(`पंक्ति #${idx + 1}: किलो (KG) में बिलिंग के लिए वज़न दर्ज करें।`);
        }
      } else {
        if (!item.quantity || Number(item.quantity) <= 0) {
          return setError(`पंक्ति #${idx + 1}: नग में बिलिंग के लिए मात्रा (नग) दर्ज करें।`);
        }
      }

      if (!item.sellingRate && item.sellingRate !== 0) {
        return setError(`पंक्ति #${idx + 1}: कृपया दर (रेट) दर्ज करें।`);
      }
    }
    if (Number(form.paidAmount) > grandTotal) return setError('भुगतान राशि कुल बिल से अधिक नहीं हो सकती।');

    setSaving(true);
    try {
      const res = await createSale({
        date: form.date,
        customer: form.customer,
        items: items.map(i => ({
          productName: i.productName.trim(),
          product: i.product || undefined,
          rateType: i.unitType === 'KG' ? 'weight' : 'nag',
          unit: i.unitType === 'KG' ? 'KG' : 'Nag',
          quantity: Number(i.quantity) || (i.unitType === 'KG' ? 1 : 0),
          weight: Number(i.weight) || 0,
          sellingRate: Number(i.sellingRate)
        })),
        paidAmount: Number(form.paidAmount) || 0,
        paymentMode: form.paymentMode,
        notes: form.notes
      });
      navigate(`/sales/${res.data._id}/invoice`);
    } catch (err) {
      setError(err.response?.data?.message || 'बिक्री सेव करने में समस्या हुई।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🛒 नई माल बिक्री (New Sale & Bill)</h2>
          <p className="text-xs text-gray-500">माल का नाम व वज़न मैन्युअल टाइप करें</p>
        </div>
      </div>

      {/* Datalist for fast item suggestions */}
      <datalist id="productSuggestions">
        {products.map(p => (
          <option key={p._id} value={p.name}>
            {p.name} (स्टॉक: {p.currentStock} {p.defaultUnit})
          </option>
        ))}
      </datalist>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-xs">
        {/* Customer & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">तारीख (Date) *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ग्राहक का नाम (Customer) *</label>
            <select
              value={form.customer}
              onChange={e => setForm({ ...form, customer: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">— ग्राहक चुनें —</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.mobile ? `(${c.mobile})` : ''} — पिछला बाकी: ₹{c.currentBalance || 0}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-gray-200">
            <label className="block text-sm font-bold text-gray-800">माल सूची (Items List)</label>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
              माल का नाम सीधे टाइप करें
            </span>
          </div>

          {items.map((item, i) => {
            const rowTotal = calculateRowTotal(item);
            const isKg = item.unitType === 'KG';

            return (
              <div
                key={i}
                className={`border rounded-xl p-4 transition space-y-3 ${
                  isKg ? 'bg-emerald-50/40 border-emerald-200' : 'bg-blue-50/40 border-blue-200'
                }`}
              >
                {/* Header row with Item # and Unit Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                        isKg ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-700">आइटम #{i + 1}</span>
                  </div>

                  {/* Unit Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-700">इकाई (Unit):</label>
                    <select
                      value={item.unitType}
                      onChange={e => updateItem(i, 'unitType', e.target.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border shadow-xs cursor-pointer focus:outline-none ${
                        isKg
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-blue-600 text-white border-blue-700'
                      }`}
                    >
                      <option value="Nag" className="bg-white text-gray-800">📦 नग में (By Nag)</option>
                      <option value="KG" className="bg-white text-gray-800">⚖️ किलो में (By KG)</option>
                    </select>
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Manual Product Name Input */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      माल का नाम (टाइप करें) *
                    </label>
                    <input
                      type="text"
                      list="productSuggestions"
                      value={item.productName}
                      onChange={e => handleProductNameChange(i, e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                      placeholder="उदा: सफेद बोरी, रोल, कट्टा..."
                    />
                  </div>

                  {/* Quantity (नग) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      मात्रा (नग) {!isKg && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                      placeholder="100"
                    />
                  </div>

                  {/* Weight in KG */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      वज़न (KG) {isKg && <span className="text-red-500">* (अनिवार्य)</span>}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.weight}
                      onChange={e => updateItem(i, 'weight', e.target.value)}
                      className={`w-full px-2.5 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-medium ${
                        isKg ? 'border-emerald-400 bg-emerald-50/20' : 'border-gray-300'
                      }`}
                      placeholder={isKg ? 'उदा: 250.50' : 'वैकल्पिक KG'}
                    />
                  </div>

                  {/* Rate */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {isKg ? 'दर / रेट (₹ प्रति KG) *' : 'दर / रेट (₹ प्रति नग) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.sellingRate}
                      onChange={e => updateItem(i, 'sellingRate', e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-bold text-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Calculation row */}
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm shadow-2xs">
                  <div className="text-xs text-gray-700 flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isKg ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isKg ? '⚖️ KG बिलिंग' : '📦 नग बिलिंग'}
                    </span>
                    <span>
                      {item.productName && <strong>{item.productName}: </strong>}
                      {isKg ? (
                        <span><strong>{item.weight || 0} KG</strong> × ₹{item.sellingRate || 0}/KG</span>
                      ) : (
                        <span><strong>{item.quantity || 0} नग</strong> × ₹{item.sellingRate || 0}/नग</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-gray-900 text-base">
                      = {formatCurrency(rowTotal)}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-xs text-red-600 hover:text-red-800 font-bold hover:underline"
                      >
                        🗑️ हटाएं
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addItem}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 hover:border-primary text-gray-700 hover:text-primary rounded-xl text-sm font-bold transition bg-gray-50/50 hover:bg-blue-50/30"
          >
            + और माल जोड़ें (Add Another Item)
          </button>
        </div>

        {/* Totals Summary */}
        <div className="border-t border-gray-200 pt-4 bg-gray-50 p-4 rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-around gap-2 text-center">
            {hasNag && totalNag > 0 && (
              <div className="bg-white p-2.5 px-4 rounded-lg border border-gray-200 shadow-2xs flex-1 min-w-[120px]">
                <p className="text-xs text-gray-500 font-medium">कुल नग (Total Nag)</p>
                <p className="text-lg font-bold text-blue-700">{totalNag.toLocaleString('en-IN')}</p>
              </div>
            )}
            {hasWeight && totalWeight > 0 && (
              <div className="bg-white p-2.5 px-4 rounded-lg border border-gray-200 shadow-2xs flex-1 min-w-[120px]">
                <p className="text-xs text-gray-500 font-medium">कुल वज़न (Total KG)</p>
                <p className="text-lg font-bold text-emerald-700">{totalWeight.toLocaleString('en-IN')} KG</p>
              </div>
            )}
            <div className="bg-blue-50 p-2.5 px-4 rounded-lg border border-blue-200 shadow-2xs flex-1 min-w-[140px]">
              <p className="text-xs text-blue-700 font-bold">कुल बिल राशि (Total)</p>
              <p className="text-lg font-black text-primary">{formatCurrency(grandTotal)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">जमा राशि (भुगतान ₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.paidAmount}
                onChange={e => setForm({ ...form, paidAmount: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white font-semibold"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {paymentModes.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">बकाया (Pending)</label>
              <div className="bg-orange-50 rounded-lg px-4 py-2.5 border border-orange-200 text-center">
                <p className="text-lg font-black text-orange-600">{formatCurrency(Math.max(0, pending))}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">नोट्स (वैकल्पिक)</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="गाड़ी नंबर, डिलीवरी विवरण आदि..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg font-medium">
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary w-full justify-center py-3.5 text-base font-bold shadow-md"
        >
          {saving ? 'सेव हो रहा है...' : '💾 बिक्री बिल सेव करें व इनवॉइस प्रिंट करें'}
        </button>
      </form>
    </div>
  );
}
