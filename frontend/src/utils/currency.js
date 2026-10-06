/**
 * Formats a number as Indian Rupees (INR)
 * @param {number|string} amount 
 * @returns {string} Formatted string like ₹1,00,000
 */
export const formatINR = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
};
