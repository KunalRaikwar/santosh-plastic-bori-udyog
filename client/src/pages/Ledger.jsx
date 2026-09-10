import { useState, useEffect } from 'react';
import { getLedger, getCustomers, getSuppliers } from '../api/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Ledger() {
  const [partyType, setPartyType] = useState('customer');
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partyType === 'customer') getCustomers().then(res => setParties(res.data));
    else getSuppliers().then(res => setParties(res.data));
    setSelectedParty(''); setLedger(null);
  }, [partyType]);

  useEffect(() => {
    if (!selectedParty) return;
    setLoading(true);
    getLedger(partyType, selectedParty).then(res => setLedger(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [selectedParty]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">📒 हिसाब / Ledger</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setPartyType('customer')} className={`px-4 py-2 rounded-md text-sm font-medium ${partyType === 'customer' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>ग्राहक</button>
          <button onClick={() => setPartyType('supplier')} className={`px-4 py-2 rounded-md text-sm font-medium ${partyType === 'supplier' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>सप्लायर</button>
        </div>
        <select value={selectedParty} onChange={e => setSelectedParty(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 sm:max-w-xs">
          <option value="">— {partyType === 'customer' ? 'ग्राहक' : 'सप्लायर'} चुनें —</option>
          {parties.map(p => <option key={p._id} value={p._id}>{p.name} {p.currentBalance > 0 ? `(₹${p.currentBalance})` : ''}</option>)}
        </select>
      </div>

      {loading && <LoadingSpinner />}

      {ledger && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">{ledger.party.name}</h3>
            <span className={`text-sm font-bold ${ledger.closingBalance > 0 ? (partyType === 'customer' ? 'text-orange-600' : 'text-red-600') : 'text-green-600'}`}>
              Balance: {formatCurrency(ledger.closingBalance)}
            </span>
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
              {ledger.ledger.map((e, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-600">{formatDate(e.date)}</td>
                  <td className="px-4 py-2 text-gray-800">{e.description}</td>
                  <td className="px-4 py-2 text-right text-red-600">{e.debit > 0 ? formatCurrency(e.debit) : ''}</td>
                  <td className="px-4 py-2 text-right text-green-600">{e.credit > 0 ? formatCurrency(e.credit) : ''}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(e.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ledger.ledger.length === 0 && <p className="text-center py-6 text-gray-400">कोई लेन-देन नहीं</p>}
        </div>
      )}

      {!selectedParty && !loading && <p className="text-center py-12 text-gray-400">कृपया {partyType === 'customer' ? 'ग्राहक' : 'सप्लायर'} चुनें</p>}
    </div>
  );
}
