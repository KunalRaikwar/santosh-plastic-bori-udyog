import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCustomer, getLedger } from '../api/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { generateReminderMessage, openWhatsApp } from '../utils/whatsapp';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCustomer(id), getLedger('customer', id)])
      .then(([cRes, lRes]) => { setCustomer(cRes.data); setLedger(lRes.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!customer) return <p className="text-center py-8 text-gray-500">ग्राहक नहीं मिला।</p>;

  const handleReminder = () => {
    const msg = generateReminderMessage(customer.name, customer.currentBalance);
    openWhatsApp(customer.mobile, msg);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{customer.name}</h2>
          {customer.mobile && <p className="text-sm text-gray-500">📞 {customer.mobile}</p>}
          {customer.address && <p className="text-sm text-gray-500">📍 {customer.address}</p>}
        </div>
        {customer.currentBalance > 0 && (
          <button onClick={handleReminder} className="btn btn-whatsapp">📲 Payment Reminder</button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-gray-500">कुल बिक्री</p><p className="text-lg font-bold text-blue-600">{customer.summary?.totalSales || 0}</p></div>
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">कुल राशि</p><p className="text-lg font-bold text-green-600">{formatCurrency(customer.summary?.totalAmount)}</p></div>
        <div className="bg-purple-50 rounded-xl p-4"><p className="text-xs text-gray-500">कुल भुगतान</p><p className="text-lg font-bold text-purple-600">{formatCurrency(customer.summary?.totalPaid)}</p></div>
        <div className="bg-orange-50 rounded-xl p-4"><p className="text-xs text-gray-500">बाकी भुगतान</p><p className="text-lg font-bold text-orange-600">{formatCurrency(customer.currentBalance)}</p></div>
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">📒 हिसाब / Ledger</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold text-gray-600">तारीख</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-600">विवरण</th>
              <th className="text-right px-4 py-2 font-semibold text-gray-600">डेबिट</th>
              <th className="text-right px-4 py-2 font-semibold text-gray-600">क्रेडिट</th>
              <th className="text-right px-4 py-2 font-semibold text-gray-600">बैलेंस</th>
            </tr>
          </thead>
          <tbody>
            {ledger?.ledger?.map((entry, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-600">{formatDate(entry.date)}</td>
                <td className="px-4 py-2 text-gray-800">{entry.description}</td>
                <td className="px-4 py-2 text-right text-red-600">{entry.debit > 0 ? formatCurrency(entry.debit) : ''}</td>
                <td className="px-4 py-2 text-right text-green-600">{entry.credit > 0 ? formatCurrency(entry.credit) : ''}</td>
                <td className="px-4 py-2 text-right font-medium">{formatCurrency(entry.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!ledger?.ledger || ledger.ledger.length === 0) && <p className="text-center py-6 text-gray-400">कोई लेन-देन नहीं</p>}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-between">
          <span className="font-semibold text-gray-700">Closing Balance:</span>
          <span className={`font-bold ${(ledger?.closingBalance || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {formatCurrency(ledger?.closingBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}
