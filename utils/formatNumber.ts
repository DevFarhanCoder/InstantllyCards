/**
 * Format number in Indian numbering system
 * Examples: 1000 → 1,000 | 100000 → 1,00,000 | 10000000 → 1,00,00,000
 */
export const formatIndianNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '0';
  
  // Handle negative numbers
  const isNegative = numValue < 0;
  const absValue = Math.abs(numValue);
  
  const numStr = Math.floor(absValue).toString();
  let result = '';
  let count = 0;
  
  for (let i = numStr.length - 1; i >= 0; i--) {
    count++;
    result = numStr[i] + result;
    
    if (count === 3 && i !== 0) {
      result = ',' + result;
    } else if (count > 3 && (count - 3) % 2 === 0 && i !== 0) {
      result = ',' + result;
    }
  }
  
  return isNegative ? '-' + result : result;
};

/**
 * Format amount with abbreviations for display
 * Less than 1 Lakh: Show full number with commas (e.g., 50,000)
 * 1 Lakh to 1 Crore: Show in Lakhs (e.g., 5.5L)
 * 1 Crore and above: Show in Crores (e.g., 2.5Cr)
 */
export const formatAmount = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || numAmount === 0) return '0';
  
  // Less than 1 Lakh - show full number with Indian formatting
  if (numAmount < 100000) {
    return formatIndianNumber(numAmount);
  }
  
  // 1 Lakh to 1 Crore - show in Lakhs
  if (numAmount < 10000000) {
    const lakhs = numAmount / 100000;
    // Use 2 decimal places for precision, then remove trailing zeros
    const formatted = lakhs.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}L`;
  }
  
  // 1 Crore and above - show in Crores
  const crores = numAmount / 10000000;
  // Use 2 decimal places for precision, then remove trailing zeros
  const formatted = crores.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted}Cr`;
};

export default formatIndianNumber;
