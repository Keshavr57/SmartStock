/**
 * Utility functions for consistent currency formatting across the application
 */

export const formatCurrency = (amount: number): string => {
    // Handle NaN, null, undefined values
    if (isNaN(amount) || amount === null || amount === undefined) {
        return '₹0';
    }
    
    // Format with Indian locale and explicitly add ₹ symbol
    const formatted = Math.abs(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return `₹${formatted}`;
};

export const formatCurrencyWithSign = (amount: number): string => {
    // Handle NaN, null, undefined values
    if (isNaN(amount) || amount === null || amount === undefined) {
        return '₹0';
    }
    
    // Format with Indian locale and explicitly add ₹ symbol with sign
    const formatted = Math.abs(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}₹${formatted}`;
};

export const formatPercentage = (percent: number): string => {
    // Handle NaN, null, undefined values
    if (isNaN(percent) || percent === null || percent === undefined) {
        return '0.00%';
    }
    
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
};

export const formatNumber = (num: number): string => {
    // Handle NaN, null, undefined values
    if (isNaN(num) || num === null || num === undefined) {
        return '0';
    }
    
    return num.toLocaleString('en-IN');
};