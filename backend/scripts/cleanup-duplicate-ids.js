const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupDuplicateEmployeeIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/university-management');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Find all users with empty employeeId
    const usersWithEmptyEmployeeId = await db.collection('users').find({ 
      employeeId: { $in: ['', null] } 
    }).toArray();
    
    console.log(`Found ${usersWithEmptyEmployeeId.length} users with empty employeeId`);
    
    if (usersWithEmptyEmployeeId.length > 0) {
      // Update all empty employeeId to undefined/null (remove the field)
      const result = await db.collection('users').updateMany(
        { employeeId: { $in: ['', null] } },
        { $unset: { employeeId: '' } }
      );
      
      console.log(`Updated ${result.modifiedCount} users - removed empty employeeId fields`);
    }
    
    // Do the same for studentId
    const usersWithEmptyStudentId = await db.collection('users').find({ 
      studentId: { $in: ['', null] } 
    }).toArray();
    
    console.log(`Found ${usersWithEmptyStudentId.length} users with empty studentId`);
    
    if (usersWithEmptyStudentId.length > 0) {
      const result = await db.collection('users').updateMany(
        { studentId: { $in: ['', null] } },
        { $unset: { studentId: '' } }
      );
      
      console.log(`Updated ${result.modifiedCount} users - removed empty studentId fields`);
    }
    
    console.log('Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the cleanup
cleanupDuplicateEmployeeIds();