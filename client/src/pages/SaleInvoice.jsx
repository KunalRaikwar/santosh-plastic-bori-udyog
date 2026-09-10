import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSale, getSettings } from '../api/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { generateSaleMessage, openWhatsApp } from '../utils/whatsapp';
import LoadingSpinner from '../components/LoadingSpinner';
import { useReactToPrint } from 'react-to-print';

export default function SaleInvoice() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    Promise.all([getSale(id), getSettings()])
      .then(([sRes, settRes]) => { setSale(sRes.data); setSettings(settRes.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  const handleWhatsApp = () => {
    if (!sale) return;
    const msg = generateSaleMessage(sale);
    openWhatsApp(sale.customerMobile, msg);
  };

  if (loading) return <LoadingSpinner />;
  if (!sale) return <p className="text-center py-8 text-gray-500">बिल नहीं मिला।</p>;

  // Separate items into Nag-based and Weight-based
  const nagItems = sale.items.filter(
    item => item.rateType === 'nag' || (!item.rateType && (!item.weight || item.weight === 0 || item.unit === 'Nag'))
  );
  const weightItems = sale.items.filter(
    item => item.rateType === 'weight' || (item.rateType !== 'nag' && item.weight > 0 && item.unit === 'KG')
  );

  // If some item didn't match either specifically, fallback to include in appropriate list
  const fallbackNag = nagItems.length === 0 && weightItems.length === 0 ? sale.items : nagItems;

  const hasNagItems = fallbackNag.length > 0;
  const hasWeightItems = weightItems.length > 0;

  const totalNagCount = fallbackNag.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalWeightKg = weightItems.reduce((sum, i) => sum + (Number(i.weight) || 0), 0);

  const nagSubtotal = fallbackNag.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const weightSubtotal = weightItems.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 no-print bg-white p-3 rounded-xl border border-gray-200">
        <Link to="/sales" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium">
          ← बिक्री सूची पर वापस
        </Link>
        <div className="flex flex-wrap gap-2">
          <button onClick={handlePrint} className="btn btn-primary text-sm shadow-sm">
            🖨️ Print Bill (प्रिंट करें)
          </button>
          <button onClick={handleWhatsApp} className="btn btn-whatsapp text-sm shadow-sm">
            📲 WhatsApp पर भेजें
          </button>
        </div>
      </div>

      {/* Invoice Document for Print and Screen */}
      <div
        ref={printRef}
        className="bg-white rounded-xl border border-gray-300 p-6 sm:p-8 shadow-sm text-gray-900"
        style={{ minHeight: '600px' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
            {settings?.businessName || 'Santosh Plastic Bori Udyog'}
          </h1>
          <p className="text-xs font-medium text-gray-600">
            {settings?.address || 'प्लास्टिक बोरी, रोल व कट्टा निर्माता एवं विक्रेता'}
          </p>
          <div className="flex justify-center items-center gap-4 text-xs text-gray-700 mt-1">
            {settings?.mobile && <span>📞 मोबाइल: <strong>{settings.mobile}</strong></span>}
            {settings?.gstNumber && <span>GSTIN: <strong>{settings.gstNumber}</strong></span>}
          </div>
          <div className="mt-2 inline-block px-3 py-0.5 bg-gray-900 text-white text-xs font-bold rounded-sm uppercase tracking-wider">
            बिक्री बिल / Cash/Credit Memo
          </div>
        </div>

        {/* Invoice Metadata */}
        <div className="grid grid-cols-2 gap-4 pb-3 mb-4 border-b border-gray-300 text-sm">
          <div>
            <p className="text-gray-600 text-xs">बिल विवरण:</p>
            <p className="font-bold text-gray-900 text-base">
              बिल नं: <span className="text-primary">{sale.invoiceNumber}</span>
            </p>
            <p className="text-xs text-gray-700">दिनांक: <strong>{formatDate(sale.date)}</strong></p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-xs">ग्राहक (M/s):</p>
            <p className="font-bold text-gray-900 text-base">{sale.customerName}</p>
            {sale.customerMobile && <p className="text-xs text-gray-700">📞 {sale.customerMobile}</p>}
          </div>
        </div>

        {/* 1. Nag Items Table (if any) */}
        {hasNagItems && (
          <div className="mb-5">
            <div className="bg-gray-100 px-3 py-1.5 border border-gray-300 font-bold text-xs uppercase text-gray-800 flex justify-between items-center">
              <span>📦 {hasWeightItems ? '1. नग अनुसार माल' : 'नग अनुसार माल'} (Sold by Pieces / Nag)</span>
              <span className="text-gray-600 font-normal">दर प्रति नग</span>
            </div>
            <table className="w-full text-xs sm:text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="p-2 border-r border-gray-300 text-center w-10">क्र.</th>
                  <th className="p-2 border-r border-gray-300 text-left">माल का विवरण</th>
                  <th className="p-2 border-r border-gray-300 text-right w-24">मात्रा (नग)</th>
                  <th className="p-2 border-r border-gray-300 text-right w-24">दर / नग (₹)</th>
                  <th className="p-2 text-right w-28">कुल राशि (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fallbackNag.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-2 border-r border-gray-300 text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-gray-300 font-medium">{item.productName}</td>
                    <td className="p-2 border-r border-gray-300 text-right font-semibold">
                      {item.quantity} नग
                    </td>
                    <td className="p-2 border-r border-gray-300 text-right">
                      {formatCurrency(item.sellingRate)}
                    </td>
                    <td className="p-2 text-right font-bold">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
                {/* Nag Subtotal */}
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td colSpan="2" className="p-2 border-r border-gray-300 text-right">
                    नग माल उप-योग (Subtotal):
                  </td>
                  <td className="p-2 border-r border-gray-300 text-right text-blue-700">
                    {fallbackNag.reduce((s, i) => s + (Number(i.quantity) || 0), 0)} नग
                  </td>
                  <td className="p-2 border-r border-gray-300"></td>
                  <td className="p-2 text-right text-gray-900">
                    {formatCurrency(nagSubtotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Weight Items Table (if any) */}
        {hasWeightItems && (
          <div className="mb-5">
            <div className="bg-gray-100 px-3 py-1.5 border border-gray-300 font-bold text-xs uppercase text-gray-800 flex justify-between items-center">
              <span>⚖️ {hasNagItems ? '2. वज़न अनुसार माल' : 'वज़न अनुसार माल'} (Sold by Weight / KG)</span>
              <span className="text-gray-600 font-normal">दर प्रति KG</span>
            </div>
            <table className="w-full text-xs sm:text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="p-2 border-r border-gray-300 text-center w-10">क्र.</th>
                  <th className="p-2 border-r border-gray-300 text-left">माल का विवरण</th>
                  <th className="p-2 border-r border-gray-300 text-right w-20">नग (Pcs)</th>
                  <th className="p-2 border-r border-gray-300 text-right w-24">कुल वज़न (KG)</th>
                  <th className="p-2 border-r border-gray-300 text-right w-24">दर / KG (₹)</th>
                  <th className="p-2 text-right w-28">कुल राशि (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {weightItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-2 border-r border-gray-300 text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-gray-300 font-medium">{item.productName}</td>
                    <td className="p-2 border-r border-gray-300 text-right">{item.quantity && Number(item.quantity) > 0 ? `${item.quantity} नग` : '-'}</td>
                    <td className="p-2 border-r border-gray-300 text-right font-bold text-emerald-700">
                      {item.weight} KG
                    </td>
                    <td className="p-2 border-r border-gray-300 text-right">
                      {formatCurrency(item.sellingRate)}
                    </td>
                    <td className="p-2 text-right font-bold">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
                {/* Weight Subtotal */}
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td colSpan="2" className="p-2 border-r border-gray-300 text-right">
                    वज़न माल उप-योग (Subtotal):
                  </td>
                  <td className="p-2 border-r border-gray-300 text-right">
                    {weightItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0) > 0 ? `${weightItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)} नग` : '-'}
                  </td>
                  <td className="p-2 border-r border-gray-300 text-right text-emerald-700">
                    {totalWeightKg} KG
                  </td>
                  <td className="p-2 border-r border-gray-300"></td>
                  <td className="p-2 text-right text-gray-900">
                    {formatCurrency(weightSubtotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Grand Total & Summary Box */}
        <div className="border border-gray-800 rounded-lg p-3 bg-gray-50 space-y-2 mt-4 text-sm">
          <div className="flex flex-wrap items-center justify-around gap-2 pb-2 border-b border-gray-300 text-center text-xs">
            <div className="px-3 py-1">
              <span className="text-gray-500">कुल माल प्रकार:</span>
              <p className="font-bold text-gray-900 text-sm">{sale.items.length} आइटम</p>
            </div>
            {hasNagItems && totalNagCount > 0 && (
              <div className="px-3 py-1">
                <span className="text-gray-500">कुल नग (Pieces):</span>
                <p className="font-bold text-blue-700 text-sm">{totalNagCount.toLocaleString('en-IN')} नग</p>
              </div>
            )}
            {hasWeightItems && totalWeightKg > 0 && (
              <div className="px-3 py-1">
                <span className="text-gray-500">कुल वज़न (Weight):</span>
                <p className="font-bold text-emerald-700 text-sm">{totalWeightKg.toLocaleString('en-IN')} KG</p>
              </div>
            )}
            <div className="px-3 py-1">
              <span className="text-gray-500">भुगतान माध्यम:</span>
              <p className="font-bold text-gray-900 text-sm">{sale.paymentMode || 'Cash'}</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-base font-black text-gray-900">
              <span>कुल बिल राशि (Grand Total):</span>
              <span className="text-xl text-primary">{formatCurrency(sale.grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-green-700">
              <span>जमा राशि (Paid Amount):</span>
              <span>{formatCurrency(sale.paidAmount)}</span>
            </div>
            {sale.pendingAmount > 0 ? (
              <div className="flex justify-between items-center text-sm font-bold text-red-600 bg-red-50 p-1.5 rounded border border-red-200">
                <span>बाकी बकाया (Balance Due):</span>
                <span>{formatCurrency(sale.pendingAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-xs font-bold text-green-700 bg-green-50 p-1 rounded">
                <span>स्थिति:</span>
                <span>✓ पूर्ण भुगतान (Fully Paid)</span>
              </div>
            )}
          </div>
        </div>

        {sale.notes && (
          <div className="mt-3 p-2 bg-yellow-50/60 border border-yellow-200 rounded text-xs text-gray-700">
            <strong>टिप्पणी / Notes:</strong> {sale.notes}
          </div>
        )}

        {/* Footer & Signature */}
        <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-end text-xs text-gray-500">
          <div>
            <p>1. माल प्राप्तकर्ता द्वारा गिना व जांचा गया।</p>
            <p>2. भूल-चूक लेनी-देनी।</p>
            <p className="mt-2 font-medium text-gray-700">धन्यवाद! फिर पधारें 🙏</p>
          </div>
          <div className="text-right">
            <p className="mb-8 font-semibold text-gray-800">
              कृते: {settings?.businessName || 'Santosh Plastic Bori Udyog'}
            </p>
            <p className="border-t border-gray-400 pt-1 text-gray-600 font-medium">
              अधिकृत हस्ताक्षर (Authorized Signatory)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
