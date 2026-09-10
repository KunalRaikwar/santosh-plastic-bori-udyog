// Indian number formatting: 1,25,000
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return `${isNeg ? '-' : ''}₹${formatted}`;
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateInput(dateStr) {
  if (!dateStr) {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  return new Date(dateStr).toISOString().split('T')[0];
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Expense category labels in Hindi
export const expenseCategories = {
  'Gaadi Bhada': 'गाड़ी भाड़ा',
  'Loading': 'लोडिंग',
  'Unloading': 'अनलोडिंग',
  'Transport': 'ट्रांसपोर्ट',
  'Worker': 'कर्मचारी',
  'Diesel': 'डीजल',
  'Electricity': 'बिजली',
  'Rent': 'किराया',
  'Maintenance': 'मरम्मत',
  'Miscellaneous': 'विविध',
  'Other': 'अन्य'
};

export const paymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Other'];
export const paymentModeLabels = {
  'Cash': 'कैश',
  'UPI': 'UPI',
  'Bank Transfer': 'बैंक ट्रांसफर',
  'Other': 'अन्य'
};

export const units = ['Nag', 'KG', 'Bundle', 'Other'];
export const unitLabels = {
  'Nag': 'नग',
  'KG': 'KG',
  'Bundle': 'बंडल',
  'Other': 'अन्य'
};
