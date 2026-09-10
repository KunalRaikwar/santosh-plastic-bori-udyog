import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const quickActions = [
  { label: '+ माल खरीदी', path: '/purchases/new', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: '+ माल बिक्री', path: '/sales/new', color: 'bg-green-50 text-green-700 border-green-200' },
  { label: '+ भुगतान प्राप्त', path: '/payments?tab=receive', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: '+ सप्लायर भुगतान', path: '/payments?tab=pay', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: '+ खर्चा जोड़ें', path: '/expenses', color: 'bg-red-50 text-red-700 border-red-200' },
  { label: '+ नया ग्राहक', path: '/customers', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: '+ नया सप्लायर', path: '/suppliers', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: '+ नया माल', path: '/products', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-gray-500 text-center py-8">डेटा लोड नहीं हो सका।</p>;

  const cards = [
    { label: 'आज की बिक्री', value: formatCurrency(data.today.sales), color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'आज की खरीदी', value: formatCurrency(data.today.purchases), color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'आज का खर्च', value: formatCurrency(data.today.expenses), color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'आज का लाभ', value: formatCurrency(data.today.netProfit), color: data.today.netProfit >= 0 ? 'text-green-600' : 'text-red-600', bg: data.today.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
    { label: 'इस महीने की बिक्री', value: formatCurrency(data.month.sales), color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'इस महीने का लाभ', value: formatCurrency(data.month.netProfit), color: data.month.netProfit >= 0 ? 'text-green-600' : 'text-red-600', bg: data.month.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
    { label: 'ग्राहक से लेना', value: formatCurrency(data.totalReceivable), color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'सप्लायर को देना', value: formatCurrency(data.totalPayable), color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'कुल स्टॉक', value: `${data.totalStock.toLocaleString('en-IN')} नग`, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">डैशबोर्ड</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card, i) => (
          <div key={i} className={`${card.bg} rounded-xl p-4 border border-gray-100`}>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.path} className={`px-3 py-2 rounded-lg text-sm font-medium border ${a.color} hover:opacity-80 transition`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly बिक्री & खरीदी</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="sales" fill="#16a34a" name="बिक्री" radius={[4,4,0,0]} />
              <Bar dataKey="purchases" fill="#2563eb" name="खरीदी" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly लाभ</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} name="लाभ" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expenses" stroke="#ea580c" strokeWidth={2} name="खर्चा" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent & Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">हाल के लेन-देन</h3>
          <div className="space-y-2">
            {data.recentTransactions.length === 0 && <p className="text-sm text-gray-400">कोई लेन-देन नहीं</p>}
            {data.recentTransactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {t.type === 'sale' ? `🛒 ${t.customerName}` : `📦 ${t.supplierName}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.type === 'sale' ? t.invoiceNumber : t.purchaseNumber} • {formatDate(t.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${t.type === 'sale' ? 'text-green-600' : 'text-blue-600'}`}>
                    {formatCurrency(t.grandTotal)}
                  </p>
                  {t.pendingAmount > 0 && (
                    <p className="text-xs text-orange-500">बाकी: {formatCurrency(t.pendingAmount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">ग्राहक से लेना बाकी</h3>
          <div className="space-y-2">
            {data.pendingCustomers.length === 0 && <p className="text-sm text-gray-400">कोई बाकी भुगतान नहीं</p>}
            {data.pendingCustomers.map((c, i) => (
              <Link key={i} to={`/customers/${c._id}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded px-1 -mx-1">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  {c.mobile && <p className="text-xs text-gray-400">{c.mobile}</p>}
                </div>
                <p className="text-sm font-semibold text-orange-600">{formatCurrency(c.pending)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock */}
      {data.lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <h3 className="text-sm font-semibold text-orange-600 mb-3">⚠️ कम स्टॉक</h3>
          <div className="flex flex-wrap gap-3">
            {data.lowStockItems.map((item, i) => (
              <div key={i} className="bg-orange-50 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-orange-600 ml-2">{item.currentStock} {item.unit === 'Nag' ? 'नग' : item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
