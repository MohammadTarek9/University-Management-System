const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['student', 'professor', 'admin', 'staff', 'parent', 'ta'],
      message: 'Role must be one of: student, professor, admin, staff, parent, ta'
    },
    default: 'student'
  },
  studentId: {
    type: String,
    sparse: true,
    unique: true,
    default: undefined
  },
  employeeId: {
    type: String,
    sparse: true,
    unique: true,
    default: undefined
  },
  department: {
    type: String,
    trim: true
  },
  major: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please add a valid phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date
  },
  firstLogin: {
    type: Boolean,
    default: false
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  securityQuestion: {
    type: String,
    trim: true
  },
  securityAnswer: {
    type: String,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true
});

// Convert empty strings to undefined for unique fields to avoid duplicate key errors
userSchema.pre('save', function(next) {
  // Handle studentId
  if (this.studentId === '') {
    this.studentId = undefined;
  }
  
  // Handle employeeId
  if (this.employeeId === '') {
    this.employeeId = undefined;
  }
  
  next();
});

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

// Check if user has a specific role
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

// Check if user has any of the specified roles
userSchema.methods.hasAnyRole = function(...roles) {
  // Flatten the roles array in case it's passed as a single array argument
  const allowedRoles = roles.length === 1 && Array.isArray(roles[0]) ? roles[0] : roles;
  return allowedRoles.includes(this.role);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialised
userSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('User', userSchema);