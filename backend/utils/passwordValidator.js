// Password validation utility for University Management System
// This ensures consistency between frontend and backend validation

/**
 * Validates if a password meets the university system requirements
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with details
 */
const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password)
  };
  
  const isValid = Object.values(requirements).every(Boolean);
  
  return {
    isValid,
    requirements,
    password: password,
    length: password.length,
    errors: []
  };
};

/**
 * Gets validation error messages for failed requirements
 * @param {Object} validation - Result from validatePassword
 * @returns {Array} - Array of error messages
 */
const getPasswordErrors = (validation) => {
  const errors = [];
  
  if (!validation.requirements.minLength) {
    errors.push('Password must be at least 6 characters long');
  }
  if (!validation.requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!validation.requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!validation.requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

/**
 * Generates a secure password that meets all requirements
 * @param {number} length - Desired password length (minimum 6)
 * @returns {string} - Generated password
 */
const generateSecurePassword = (length = 9) => {
  const minLength = Math.max(6, length);
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  let password = '';
  
  // Ensure required characters
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Fill remaining with mix of all characters
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = 3; i < minLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle to randomize positions
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Test the functions
if (require.main === module) {
  console.log('Testing Password Validation Utility...\n');
  
  // Test weak passwords
  const weakPasswords = ['123', 'password', 'PASSWORD', '123456', 'Aa1'];
  
  console.log('Testing weak passwords:');
  weakPasswords.forEach(pwd => {
    const validation = validatePassword(pwd);
    const errors = getPasswordErrors(validation);
    console.log(`"${pwd}" - Valid: ${validation.isValid}`);
    if (!validation.isValid) {
      errors.forEach(error => console.log(`  ❌ ${error}`));
    }
    console.log();
  });
  
  // Test generated passwords
  console.log('Testing generated passwords:');
  for (let i = 0; i < 5; i++) {
    const password = generateSecurePassword();
    const validation = validatePassword(password);
    console.log(`Generated: "${password}" - Valid: ${validation.isValid} (${validation.length} chars)`);
  }
}

module.exports = {
  validatePassword,
  getPasswordErrors,
  generateSecurePassword
};