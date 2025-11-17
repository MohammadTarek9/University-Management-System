const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Room name cannot be more than 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Room type is required'],
    enum: {
      values: ['classroom', 'laboratory', 'lecture_hall', 'computer_lab', 'office', 'conference_room'],
      message: 'Room type must be one of: classroom, laboratory, lecture_hall, computer_lab, office, conference_room'
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [1000, 'Capacity cannot exceed 1000']
  },
  location: {
    building: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
      maxlength: [50, 'Building name cannot be more than 50 characters']
    },
    floor: {
      type: String,
      required: [true, 'Floor is required'],
      trim: true,
      maxlength: [10, 'Floor cannot be more than 10 characters']
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      maxlength: [20, 'Room number cannot be more than 20 characters']
    }
  },
  equipment: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'needs_repair'],
      default: 'good'
    }
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maintenanceNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Maintenance notes cannot exceed 500 characters']
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for location uniqueness (building + floor + roomNumber)
roomSchema.index({ 'location.building': 1, 'location.floor': 1, 'location.roomNumber': 1 }, { unique: true });

// Virtual for full location display
roomSchema.virtual('fullLocation').get(function() {
  return `${this.location.building}, Floor ${this.location.floor}, Room ${this.location.roomNumber}`;
});

// Virtual for equipment count
roomSchema.virtual('equipmentCount').get(function() {
  return this.equipment.reduce((total, item) => total + item.quantity, 0);
});

// Ensure virtual fields are serialised
roomSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Room', roomSchema);