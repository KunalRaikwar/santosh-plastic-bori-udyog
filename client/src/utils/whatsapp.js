import { formatCurrency, formatDate } from './helpers';

// Sale bill WhatsApp message
export function generateSaleMessage(sale) {
  if (!sale) return '';
  const date = formatDate(sale.date);
  let msg = `नमस्ते ${sale.customerName} जी,\n\n*Santosh Plastic Bori Udyog*\nआज का आपका बिल विवरण:\n\n`;

  const nagItems = (sale.items || []).filter(
    item => item.rateType === 'nag' || (!item.rateType && (!item.weight || item.weight === 0 || item.unit === 'Nag'))
  );
  const weightItems = (sale.items || []).filter(
    item => item.rateType === 'weight' || (item.rateType !== 'nag' && item.weight > 0 && item.unit === 'KG')
  );

  const fallbackNag = nagItems.length === 0 && weightItems.length === 0 ? sale.items || [] : nagItems;

  if (fallbackNag.length > 0) {
    msg += `📦 *नग अनुसार माल:*\n`;
    fallbackNag.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.productName} — ${item.quantity} नग × ${formatCurrency(item.sellingRate)}/नग = ${formatCurrency(item.totalAmount)}\n`;
    });
    msg += `\n`;
  }

  if (weightItems.length > 0) {
    msg += `⚖️ *वज़न अनुसार माल:*\n`;
    weightItems.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.productName} — ${item.quantity} Pcs (${item.weight} KG) × ${formatCurrency(item.sellingRate)}/KG = ${formatCurrency(item.totalAmount)}\n`;
    });
    msg += `\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💵 *कुल बिल राशि:* ${formatCurrency(sale.grandTotal)}\n`;
  msg += `💳 *जमा भुगतान:* ${formatCurrency(sale.paidAmount)}\n`;
  if (sale.pendingAmount > 0) {
    msg += `⏳ *बाकी बकाया:* ${formatCurrency(sale.pendingAmount)}\n`;
  } else {
    msg += `✅ *पूर्ण चुकता*\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━\n`;
  msg += `बिल नंबर: ${sale.invoiceNumber}\nदिनांक: ${date}\n\nधन्यवाद 🙏 फिर पधारें!`;
  return msg;
}

// Payment received message
export function generatePaymentMessage(customerName, amount, newBalance) {
  let msg = `नमस्ते ${customerName} जी,\n\n`;
  msg += `${formatCurrency(amount)} का भुगतान प्राप्त हुआ है।\n\n`;
  if (newBalance > 0) {
    msg += `आपके खाते में अब ${formatCurrency(newBalance)} बाकी है।\n\n`;
  } else {
    msg += `आपका खाता अब पूरा क्लियर है।\n\n`;
  }
  msg += `धन्यवाद 🙏`;
  return msg;
}

// Payment reminder
export function generateReminderMessage(customerName, pendingAmount) {
  let msg = `नमस्ते ${customerName} जी,\n\n`;
  msg += `आपके खाते में ${formatCurrency(pendingAmount)} का भुगतान बाकी है।\n\n`;
  msg += `कृपया सुविधा अनुसार भुगतान कर दें।\n\n`;
  msg += `धन्यवाद 🙏`;
  return msg;
}

// Open WhatsApp with message
export function openWhatsApp(mobile, message) {
  const phone = mobile ? mobile.replace(/[^0-9]/g, '') : '';
  const encoded = encodeURIComponent(message);
  const url = phone
    ? `https://wa.me/91${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}
