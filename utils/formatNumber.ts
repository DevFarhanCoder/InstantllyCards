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

export default formatIndianNumber;
