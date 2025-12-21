/**
 * Leave Request Utility Functions
 * Helper functions for leave calculations and validations
 */

/**
 * Calculate number of days between two dates (inclusive)
 * Equivalent to MySQL DATEDIFF(end_date, start_date) + 1
 * 
 * @param {string | Date} startDate - Start date (YYYY-MM-DD or Date object)
 * @param {string | Date} endDate - End date (YYYY-MM-DD or Date object)
 * @returns {number} - Number of days including both start and end dates
 */
function calculateLeaveDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to avoid timezone issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Calculate difference in milliseconds and convert to days
  const diffTime = Math.abs(end - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Add 1 to include both start and end dates
  return diffDays + 1;
}

/**
 * Validate leave dates
 * 
 * @param {string | Date} startDate - Start date
 * @param {string | Date} endDate - End date
 * @returns {object} - { valid: boolean, error: string | null }
 */
function validateLeaveDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  // Reset times
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  if (start > end) {
    return {
      valid: false,
      error: 'Start date must be before or equal to end date'
    };
  }
  
  if (start < today) {
    return {
      valid: false,
      error: 'Cannot submit leave request for past dates'
    };
  }
  
  const days = calculateLeaveDays(start, end);
  if (days <= 0) {
    return {
      valid: false,
      error: 'Leave period must be at least 1 day'
    };
  }
  
  return { valid: true, error: null };
}

/**
 * Format date for display
 * 
 * @param {string | Date} date - Date to format
 * @param {string} format - 'short' | 'long' | 'iso'
 * @returns {string} - Formatted date string
 */
function formatLeaveDate(date, format = 'short') {
  const d = new Date(date);
  
  if (format === 'iso') {
    return d.toISOString().split('T')[0];
  }
  
  const options = format === 'long' 
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  
  return d.toLocaleDateString('en-US', options);
}

/**
 * Calculate remaining leave balance
 * 
 * @param {number} totalDays - Total allocated days
 * @param {number} usedDays - Days already used
 * @returns {number} - Remaining days
 */
function calculateRemainingDays(totalDays, usedDays) {
  const remaining = totalDays - usedDays;
  return Math.max(0, remaining);
}

/**
 * Check if leave balance is sufficient
 * 
 * @param {number} totalDays - Total allocated days
 * @param {number} usedDays - Days already used
 * @param {number} requestedDays - Days being requested
 * @returns {object} - { sufficient: boolean, remaining: number, message: string }
 */
function checkLeaveBalance(totalDays, usedDays, requestedDays) {
  const remaining = calculateRemainingDays(totalDays, usedDays);
  
  if (remaining < requestedDays) {
    return {
      sufficient: false,
      remaining,
      message: `Insufficient leave balance. You have ${remaining} days remaining but requested ${requestedDays} days.`
    };
  }
  
  return {
    sufficient: true,
    remaining: remaining - requestedDays,
    message: `Leave balance approved. You will have ${remaining - requestedDays} days remaining.`
  };
}

/**
 * Get fiscal year (customizable for different regions)
 * Default: January 1 - December 31
 * 
 * @param {Date} date - Reference date
 * @returns {number} - Fiscal year
 */
function getFiscalYear(date = new Date()) {
  return date.getFullYear();
}

/**
 * Calculate total working days (excluding weekends)
 * 
 * @param {string | Date} startDate - Start date
 * @param {string | Date} endDate - End date
 * @returns {number} - Number of working days (Mon-Fri)
 */
function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Get leave status display properties
 * 
 * @param {string} status - Leave request status
 * @returns {object} - { label: string, color: string, icon: string }
 */
function getStatusDisplay(status) {
  const statusMap = {
    pending: { label: 'Pending', color: 'warning', icon: 'clock' },
    approved: { label: 'Approved', color: 'success', icon: 'check-circle' },
    rejected: { label: 'Rejected', color: 'error', icon: 'block' },
    cancelled: { label: 'Cancelled', color: 'default', icon: 'cancel' }
  };
  
  return statusMap[status] || { label: 'Unknown', color: 'default', icon: 'help' };
}

module.exports = {
  calculateLeaveDays,
  validateLeaveDates,
  formatLeaveDate,
  calculateRemainingDays,
  checkLeaveBalance,
  getFiscalYear,
  calculateWorkingDays,
  getStatusDisplay
};