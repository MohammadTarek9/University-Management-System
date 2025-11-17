const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'Room',
    required: [true, 'Room is required']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  title: {
    type: String,
    required: [true, 'Booking title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  status: {
    type: String,
    enum: ['approved', 'cancelled'],
    default: 'approved'
  },
  attendees: {
    type: Number,
    min: 1,
    required: [true, 'Number of attendees is required']
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    endDate: Date,
    occurrences: Number
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ room: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

// Virtual for checking if booking is active
bookingSchema.virtual('isActive').get(function() {
  return this.status === 'approved' && new Date() < this.endTime;
});

// Check for time conflicts
bookingSchema.statics.checkAvailability = async function(roomId, startTime, endTime, excludeBookingId = null) {
  const conflictConditions = {
    room: roomId,
    status: 'approved',
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };

  if (excludeBookingId) {
    conflictConditions._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await this.findOne(conflictConditions);
  return !conflictingBooking;
};

module.exports = mongoose.model('Booking', bookingSchema);