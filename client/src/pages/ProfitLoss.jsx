import { useState, useEffect } from 'react';
import { getMonthlyReport, getProfitByProduct } from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProfitLoss() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [report, setReport] = useState(null);
  const [productProfits, setProductProfits] = useState([]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, prodRes] = await Promise.all([
        getMonthlyReport({ startDate, endDate }),
        getProfitByProduct({ startDate, endDate })
      ]);
      setReport(repRes.data);
      setProductProfits(prodRes.data);
    } catch (err) {
      console.error('Error fetching profit report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">नफा और नुकसान (Profit & Loss)</h1>
          <p className="text-slate-500 text-sm">कारोबार की कमाई और खर्चे की पूरी रिपोर्ट</p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
          />
          <span className="text-slate-400">से</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm dark:text-white"
          />
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">कुल बिक्री (Total Sales)</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">₹{report.totalSales?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1">{report.salesCount} बिल</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">कुल खरीदारी (Purchases)</p>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-1">₹{report.totalPurchases?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1">{report.purchasesCount} बिल</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">सकल मुनाफा (Gross Profit)</p>
              <p className="text-xl font-bold text-blue-600 mt-1">₹{report.grossProfit?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1">बिक्री - लागत</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">कुल खर्चे (Expenses)</p>
              <p className="text-xl font-bold text-rose-600 mt-1">₹{report.totalExpenses?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1">मजदूरी, भाड़ा आदि</p>
            </div>

            <div className={`p-4 rounded-xl border shadow-sm ${
              report.netProfit >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            }`}>
              <p className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">शुद्ध मुनाफा (Net Profit)</p>
              <p className={`text-2xl font-black mt-1 ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹{report.netProfit?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 mt-1">सकल मुनाफा - खर्चे</p>
            </div>
          </div>

          {/* Expense Breakdown & Profit per Product */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category-wise Expenses */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="font-bold text-slate-800 dark:text-white mb-4">खर्चों का विवरण (Expense Breakdown)</h2>
              {Object.keys(report.expenseByCategory || {}).length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">कोई खर्चा नहीं पाया गया</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(report.expenseByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700 text-sm">
                      <span className="capitalize text-slate-600 dark:text-slate-300 font-medium">{cat}</span>
                      <span className="font-bold text-slate-800 dark:text-white">₹{amt?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Profitability */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="font-bold text-slate-800 dark:text-white mb-4">आइटम अनुसार मुनाफा (Product Profitability)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 uppercase text-xs">
                    <tr>
                      <th className="p-3">सामान (Item)</th>
                      <th className="p-3">बिक्री मात्रा</th>
                      <th className="p-3">औसत दर (सैल)</th>
                      <th className="p-3">औसत दर (कॉस्ट)</th>
                      <th className="p-3">कुल मुनाफा</th>
                      <th className="p-3">मार्जिन %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {productProfits.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-400">कोई डेटा नहीं</td>
                      </tr>
                    ) : (
                      productProfits.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="p-3 font-semibold text-slate-800 dark:text-white">{prod.productName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{prod.totalQuantity} {prod.unit}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">₹{prod.avgSellingRate}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">₹{prod.avgCostRate}</td>
                          <td className="p-3 font-bold text-emerald-600">₹{prod.totalProfit?.toLocaleString('en-IN')}</td>
                          <td className="p-3 font-medium text-blue-600">{prod.profitPercent}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
