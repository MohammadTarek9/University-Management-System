const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Electrical', 'Plumbing', 'HVAC', 'Furniture', 'Equipment', 'Structural', 'Cleaning', 'Other'],
      message: 'Please select a valid category'
    }
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  location: {
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true
    },
    floor: {
      type: String,
      trim: true
    }
  },
  submittedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Submitted'
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  images: [{
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedCompletion: Date,
  actualCompletion: Date,
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Feedback cannot exceed 500 characters']
    },
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ submittedBy: 1 });
maintenanceRequestSchema.index({ category: 1 });
maintenanceRequestSchema.index({ priority: 1 });
maintenanceRequestSchema.index({ createdAt: -1 });

// Virtual for request age (days since submission)
maintenanceRequestSchema.virtual('daysSinceSubmission').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);