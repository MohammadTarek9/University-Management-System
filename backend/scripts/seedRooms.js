const mongoose = require('mongoose');
const Room = require('../models/Room');
require('dotenv').config();

// Sample room data
const sampleRooms = [
  {
    name: 'Main Lecture Hall A',
    type: 'lecture_hall',
    capacity: 200,
    location: {
      building: 'Academic Building 1',
      floor: '1',
      roomNumber: 'A101'
    },
    equipment: [
      { name: 'Projector', quantity: 2, condition: 'excellent' },
      { name: 'Microphone System', quantity: 1, condition: 'good' },
      { name: 'Whiteboard', quantity: 1, condition: 'good' }
    ],
    amenities: ['Air Conditioning', 'Sound System', 'Recording Equipment'],
    isActive: true,
    maintenanceNotes: 'Recently updated with new projectors'
  },
  {
    name: 'Computer Science Lab 1',
    type: 'computer_lab',
    capacity: 30,
    location: {
      building: 'Science Building',
      floor: '2',
      roomNumber: 'CS201'
    },
    equipment: [
      { name: 'Desktop Computer', quantity: 30, condition: 'good' },
      { name: 'Projector', quantity: 1, condition: 'excellent' },
      { name: 'Server Rack', quantity: 1, condition: 'good' }
    ],
    amenities: ['High-Speed Internet', 'Air Conditioning', 'Power Outlets'],
    isActive: true,
    maintenanceNotes: 'Computers updated last semester'
  },
  {
    name: 'Chemistry Laboratory A',
    type: 'laboratory',
    capacity: 20,
    location: {
      building: 'Science Building',
      floor: '1',
      roomNumber: 'CHEM101'
    },
    equipment: [
      { name: 'Lab Bench', quantity: 10, condition: 'good' },
      { name: 'Fume Hood', quantity: 4, condition: 'excellent' },
      { name: 'Safety Shower', quantity: 2, condition: 'good' }
    ],
    amenities: ['Ventilation System', 'Emergency Equipment', 'Chemical Storage'],
    isActive: true,
    maintenanceNotes: 'Safety equipment inspected monthly'
  },
  {
    name: 'Small Classroom B12',
    type: 'classroom',
    capacity: 25,
    location: {
      building: 'Academic Building 1',
      floor: '2',
      roomNumber: 'B12'
    },
    equipment: [
      { name: 'Whiteboard', quantity: 1, condition: 'good' },
      { name: 'Projector', quantity: 1, condition: 'fair' },
      { name: 'Student Desks', quantity: 25, condition: 'good' }
    ],
    amenities: ['Air Conditioning', 'Natural Light'],
    isActive: true
  },
  {
    name: 'Conference Room Executive',
    type: 'conference_room',
    capacity: 12,
    location: {
      building: 'Administration Building',
      floor: '3',
      roomNumber: 'EXEC301'
    },
    equipment: [
      { name: 'Conference Table', quantity: 1, condition: 'excellent' },
      { name: 'Video Conference System', quantity: 1, condition: 'excellent' },
      { name: 'Smart Board', quantity: 1, condition: 'good' }
    ],
    amenities: ['Video Conferencing', 'Catering Setup', 'Premium Furniture'],
    isActive: true
  }
];

// Connect to MongoDB and seed data
const seedRooms = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/university-management');
    console.log('Connected to MongoDB');

    // Clear existing rooms (optional - comment out if you want to keep existing data)
    // await Room.deleteMany({});
    // console.log('Cleared existing room data');

    // Find an admin user to set as creator
    const User = require('../models/User');
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first using the createFirstAdmin script.');
      process.exit(1);
    }

    // Add createdBy field to each room
    const roomsWithCreator = sampleRooms.map(room => ({
      ...room,
      createdBy: adminUser._id
    }));

    // Insert sample rooms
    const insertedRooms = await Room.insertMany(roomsWithCreator);
    console.log(`Successfully seeded ${insertedRooms.length} rooms:`);
    
    insertedRooms.forEach(room => {
      console.log(`- ${room.name} (${room.type}) - ${room.fullLocation}`);
    });

    console.log('Room seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding rooms:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedRooms();