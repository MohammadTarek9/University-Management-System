// ID Generator utility for University Management System
// Generates sequential student and employee IDs based on year and role

const pool = require('../db/mysql');

/**
 * Generates a sequential ID for a user based on their role and current year
 * Format: YYR### where YY = year, R = role letter, ### = sequential number
 * 
 * Students: 22S001, 22S002, etc.
 * Employees (professors, staff, admin, ta): 22E001, 22E002, etc.
 * 
 * @param {string} role - The user's role (student, professor, admin, staff, ta, parent)
 * @param {number} year - The year (optional, defaults to current year)
 * @returns {Promise<string>} - The generated ID
 */
async function generateSequentialId(role, year = null) {
  const currentYear = year || new Date().getFullYear();
  const yearPrefix = currentYear.toString().slice(-2); // Get last 2 digits of year
  
  // Determine role letter
  let roleLetter;
  if (role === 'student') {
    roleLetter = 'S';
  } else if (['professor', 'admin', 'staff', 'ta'].includes(role)) {
    roleLetter = 'E'; // E for Employee
  } else {
    // For parent or other roles, use P
    roleLetter = 'P';
  }
  
  // Pattern for this year and role combination
  const pattern = `${yearPrefix}${roleLetter}%`;
  
  // Query database to find the highest number for this year and role
  const [rows] = await pool.query(
    `
    SELECT 
      student_id,
      employee_id
    FROM users
    WHERE 
      (student_id LIKE ? OR employee_id LIKE ?)
    ORDER BY 
      CASE 
        WHEN student_id LIKE ? THEN student_id
        WHEN employee_id LIKE ? THEN employee_id
      END DESC
    LIMIT 1
    `,
    [pattern, pattern, pattern, pattern]
  );
  
  let nextNumber = 1;
  
  if (rows.length > 0) {
    // Extract the number from the ID
    const existingId = rows[0].student_id?.startsWith(yearPrefix + roleLetter) 
      ? rows[0].student_id 
      : rows[0].employee_id;
    
    if (existingId) {
      // Extract the numeric part (last 3 digits)
      const numericPart = existingId.slice(-3);
      nextNumber = parseInt(numericPart, 10) + 1;
    }
  }
  
  // Format the number with leading zeros (3 digits)
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  
  // Generate the final ID
  const generatedId = `${yearPrefix}${roleLetter}${formattedNumber}`;
  
  return generatedId;
}

/**
 * Generates a university email based on the user ID
 * @param {string} userId - The generated student or employee ID
 * @returns {string} - The university email address
 */
function generateUniversityEmail(userId) {
  return `${userId.toLowerCase()}@university.edu`;
}

module.exports = {
  generateSequentialId,
  generateUniversityEmail
};
