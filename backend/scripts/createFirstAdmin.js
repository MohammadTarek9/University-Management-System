const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User schema (simplified version for script)
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor', 'admin', 'staff', 'parent', 'ta'], default: 'student' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

async function createFirstAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists:', existingAdmin.email);
      console.log('Cannot create duplicate admin user.');
      process.exit(1);
    }

    // Default admin credentials (CHANGE THESE!)
    const adminData = {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@university.edu',
      password: 'Admin123!', // CHANGE THIS PASSWORD!
      role: 'admin'
    };

    console.log('Creating first admin user...');
    const admin = await User.create(adminData);
    
    console.log('✅ First admin user created successfully!');
    console.log('Admin Details:');
    console.log('  Email:', admin.email);
    console.log('  Name:', admin.firstName, admin.lastName);
    console.log('  Role:', admin.role);
    console.log('');
    console.log('🔐 IMPORTANT SECURITY NOTES:');
    console.log('1. Login with these credentials and IMMEDIATELY change the password');
    console.log('2. Consider changing the admin email to your preferred email');
    console.log('3. This script should only be run ONCE for initial setup');
    console.log('4. Delete or secure this script after initial setup');
    console.log('');
    console.log('Default login credentials:');
    console.log('  Email: admin@university.edu');
    console.log('  Password: Admin123!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.log('Email already exists in database.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createFirstAdmin();