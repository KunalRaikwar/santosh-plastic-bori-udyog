import { useState, useEffect } from 'react';
import { getMonthlyReport, getCustomerPending, getSupplierPending } from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [monthlyData, setMonthlyData] = useState(null);
  const [customerPendingData, setCustomerPendingData] = useState(null);
  const [supplierPendingData, setSupplierPendingData] = useState(null);

  useEffect(() => {
    loadTabContent();
  }, [activeTab, startDate, endDate]);

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'monthly') {
        const res = await getMonthlyReport({ startDate, endDate });
        setMonthlyData(res.data);
      } else if (activeTab === 'customerPending') {
        const res = await getCustomerPending();
        setCustomerPendingData(res.data);
      } else if (activeTab === 'supplierPending') {
        const res = await getSupplierPending();
        setSupplierPendingData(res.data);
      }
    } catch (err) {
      console.error('Error loading report tab:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">व्यापार रिपोर्ट (Business Reports)</h1>
          <p className="text-slate-500 text-sm">मासिक बिक्री, लेन-देन और बकाया राशि की पूरी सूची</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'monthly'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          मासिक समरी (Monthly Overview)
        </button>
        <button
          onClick={() => setActiveTab('customerPending')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'customerPending'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          ग्राहक बकाया (Customer Pending)
        </button>
        <button
          onClick={() => setActiveTab('supplierPending')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'supplierPending'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          सप्लायर देना (Supplier Pending)
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {activeTab === 'monthly' && monthlyData && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
                <span className="text-sm text-slate-500">अवधि चुनें:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 rounded border text-sm dark:text-white dark:bg-slate-700"
                />
                <span className="text-slate-400">से</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 rounded border text-sm dark:text-white dark:bg-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">कुल बिक्री</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">₹{monthlyData.totalSales?.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">कुल खरीदारी</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">₹{monthlyData.totalPurchases?.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">कुल खर्चे</p>
                  <p className="text-xl font-bold text-rose-600">₹{monthlyData.totalExpenses?.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">शुद्ध मुनाफा</p>
                  <p className={`text-xl font-bold ${monthlyData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{monthlyData.netProfit?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customerPending' && customerPendingData && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-800 dark:text-white">ग्राहक बकाया रिपोर्ट</h2>
                <div className="text-right">
                  <p className="text-xs text-slate-500">कुल बकाया लेना</p>
                  <p className="text-xl font-bold text-rose-600">₹{customerPendingData.totalReceivable?.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 uppercase text-xs">
                    <tr>
                      <th className="p-3">ग्राहक नाम</th>
                      <th className="p-3">मोबाइल नंबर</th>
                      <th className="p-3">बकाया राशि</th>
                      <th className="p-3">आखिरी बिक्री</th>
                      <th className="p-3">कितने दिन से लंबित</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {customerPendingData.customers?.length === 0 ? (
                      <tr><td colSpan="5" className="p-4 text-center text-slate-400">कोई बकाया ग्राहक नहीं है</td></tr>
                    ) : (
                      customerPendingData.customers?.map(c => (
                        <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="p-3 font-semibold text-slate-800 dark:text-white">{c.name}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{c.mobile || '-'}</td>
                          <td className="p-3 font-bold text-rose-600">₹{c.pending?.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-slate-500">{c.lastSale ? new Date(c.lastSale).toLocaleDateString('en-IN') : '-'}</td>
                          <td className="p-3 text-slate-500">{c.daysPending} दिन</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'supplierPending' && supplierPendingData && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-800 dark:text-white">सप्लायर बकाया रिपोर्ट</h2>
                <div className="text-right">
                  <p className="text-xs text-slate-500">कुल बकाया देना</p>
                  <p className="text-xl font-bold text-amber-600">₹{supplierPendingData.totalPayable?.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 uppercase text-xs">
                    <tr>
                      <th className="p-3">सप्लायर नाम</th>
                      <th className="p-3">मोबाइल नंबर</th>
                      <th className="p-3">देना बाकी</th>
                      <th className="p-3">आखिरी खरीदारी</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {supplierPendingData.suppliers?.length === 0 ? (
                      <tr><td colSpan="4" className="p-4 text-center text-slate-400">कोई बकाया सप्लायर नहीं है</td></tr>
                    ) : (
                      supplierPendingData.suppliers?.map(s => (
                        <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="p-3 font-semibold text-slate-800 dark:text-white">{s.name}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{s.mobile || '-'}</td>
                          <td className="p-3 font-bold text-amber-600">₹{s.pending?.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-slate-500">{s.lastPurchase ? new Date(s.lastPurchase).toLocaleDateString('en-IN') : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
