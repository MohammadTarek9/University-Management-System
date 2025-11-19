const mongoose = require('mongoose');
const { generateSecurePassword, validatePassword } = require('../utils/passwordValidator');

const applicationSchema = new mongoose.Schema({
  // Applicant Personal Information
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    nationality: {
      type: String,
      required: [true, 'Nationality is required'],
      trim: true,
      maxlength: [50, 'Nationality cannot exceed 50 characters']
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
        maxlength: [100, 'Street address cannot exceed 100 characters']
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters']
      },
      state: {
        type: String,
        required: [true, 'State/Province is required'],
        trim: true,
        maxlength: [50, 'State/Province cannot exceed 50 characters']
      },
      zipCode: {
        type: String,
        required: [true, 'ZIP/Postal code is required'],
        trim: true,
        maxlength: [20, 'ZIP/Postal code cannot exceed 20 characters']
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        maxlength: [50, 'Country cannot exceed 50 characters']
      }
    }
  },

  // Academic Information
  academicInfo: {
    program: {
      type: String,
      required: [true, 'Program is required'],
      enum: {
        values: [
          'Computer Science',
          'Engineering',
          'Business Administration',
          'Medicine',
          'Law',
          'Arts',
          'Sciences',
          'Education',
          'Nursing',
          'Economics'
        ],
        message: 'Please select a valid program'
      }
    },
    degreeLevel: {
      type: String,
      required: [true, 'Degree level is required'],
      enum: {
        values: ['Bachelor', 'Master', 'Doctorate', 'Certificate'],
        message: 'Please select a valid degree level'
      }
    },
    intendedStartDate: {
      type: Date,
      required: [true, 'Intended start date is required']
    },
    previousEducation: {
      institution: {
        type: String,
        required: [true, 'Previous institution is required'],
        trim: true,
        maxlength: [100, 'Institution name cannot exceed 100 characters']
      },
      degree: {
        type: String,
        required: [true, 'Previous degree is required'],
        trim: true,
        maxlength: [100, 'Degree name cannot exceed 100 characters']
      },
      graduationDate: {
        type: Date,
        required: [true, 'Graduation date is required']
      },
      gpa: {
        type: Number,
        min: [0, 'GPA cannot be negative'],
        max: [4.0, 'GPA cannot exceed 4.0']
      }
    }
  },

  // Application Status and Processing
  status: {
    type: String,
    enum: {
      values: ['Pending Review', 'Under Review', 'Approved', 'Rejected', 'Waitlisted'],
      message: 'Please select a valid status'
    },
    default: 'Pending Review'
  },

  // Documents and Files
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['transcript', 'recommendation_letter', 'personal_statement', 'cv_resume', 'portfolio', 'other'],
      required: true
    },
    filePath: {
      type: String,
      required: false // Made optional for placeholder implementation
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Processing Information
  processingInfo: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  },

  // Student Credentials (generated upon approval)
  studentCredentials: {
    studentId: {
      type: String,
      unique: true,
      sparse: true // Only enforce uniqueness if value exists
    },
    universityEmail: {
      type: String,
      unique: true,
      sparse: true
    },
    temporaryPassword: {
      type: String,
      select: false // Don't include in normal queries for security
    },
    credentialsGeneratedAt: {
      type: Date
    },
    credentialsGeneratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Application Metadata
  applicationId: {
    type: String,
    required: false // Will be auto-generated by pre-save middleware
  },

  submittedAt: {
    type: Date,
    default: Date.now
  },

  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
applicationSchema.virtual('personalInfo.fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for formatted address
applicationSchema.virtual('personalInfo.fullAddress').get(function() {
  const addr = this.personalInfo.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for application age (days since submission)
applicationSchema.virtual('daysSinceSubmission').get(function() {
  return Math.floor((Date.now() - this.submittedAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate application ID
applicationSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate unique application ID (format: APP-YYYY-XXXXXX)
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.applicationId = `APP-${year}-${random}`;
  }
  this.lastModified = Date.now();
  next();
});

// Index for efficient querying
applicationSchema.index({ status: 1 });
applicationSchema.index({ 'personalInfo.email': 1, unique: true });
applicationSchema.index({ 'academicInfo.program': 1 });
applicationSchema.index({ submittedAt: -1 });
applicationSchema.index({ applicationId: 1, unique: true });
applicationSchema.index({ 'studentCredentials.studentId': 1, unique: true, sparse: true });
applicationSchema.index({ 'studentCredentials.universityEmail': 1, unique: true, sparse: true });

// Static method to generate unique student ID, university email, and temporary password
applicationSchema.statics.generateStudentCredentials = async function(intendedStartDate) {
  const startYear = new Date(intendedStartDate).getFullYear();
  const yearSuffix = startYear.toString().slice(-2); // Last 2 digits of year
  
  let studentId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  // Keep generating until we find a unique ID
  while (!isUnique && attempts < maxAttempts) {
    // Generate 4 random digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits
    studentId = `${yearSuffix}R${randomDigits}`;
    
    // Check if this ID already exists
    const existingApplication = await this.findOne({
      'studentCredentials.studentId': studentId
    });
    
    if (!existingApplication) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique student ID after multiple attempts');
  }

  const universityEmail = `${studentId}@uni.edu.eg`;
  
  // Generate secure temporary password using utility function
  // This ensures consistency with validation requirements across the system
  let temporaryPassword;
  let passwordAttempts = 0;
  const maxPasswordAttempts = 10;
  
  // Generate password and validate it meets requirements
  do {
    temporaryPassword = generateSecurePassword(12); // 12 character password for better security
    const validation = validatePassword(temporaryPassword);
    
    if (validation.isValid) {
      break;
    }
    
    passwordAttempts++;
    if (passwordAttempts >= maxPasswordAttempts) {
      throw new Error('Failed to generate valid password after multiple attempts');
    }
  } while (passwordAttempts < maxPasswordAttempts);
  
  return {
    studentId,
    universityEmail,
    temporaryPassword
  };
};

// Static method to get application statistics
applicationSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalApplications = await this.countDocuments();
  
  return {
    total: totalApplications,
    byStatus: stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };
};

module.exports = mongoose.model('Application', applicationSchema);