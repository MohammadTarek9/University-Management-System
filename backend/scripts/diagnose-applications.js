const mongoose = require('mongoose');
const Application = require('../models/Application');
require('dotenv').config({ path: '../.env' });

async function diagnoseApplications() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database successfully');

    // Get total count
    const totalCount = await Application.countDocuments();
    console.log(`\nTotal applications in database: ${totalCount}`);

    if (totalCount === 0) {
      console.log('No applications found in database!');
      return;
    }

    // Get sample application
    const sampleApp = await Application.findOne().lean();
    console.log('\nSample application structure:');
    console.log('personalInfo.department:', sampleApp?.personalInfo?.department);
    console.log('academicInfo.program:', sampleApp?.academicInfo?.program);
    console.log('Full personalInfo:', JSON.stringify(sampleApp?.personalInfo, null, 2));

    // Check department distribution
    console.log('\n--- Department Analysis ---');
    
    // Count by personalInfo.department
    const departmentStats = await Application.aggregate([
      {
        $group: {
          _id: '$personalInfo.department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('Applications by personalInfo.department:');
    departmentStats.forEach(stat => {
      console.log(`  ${stat._id || 'null/undefined'}: ${stat.count}`);
    });

    // Check if any have old academicInfo.program
    const oldProgramStats = await Application.aggregate([
      {
        $group: {
          _id: '$academicInfo.program',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nApplications by academicInfo.program (old structure):');
    oldProgramStats.forEach(stat => {
      console.log(`  ${stat._id || 'null/undefined'}: ${stat.count}`);
    });

    // Test department filter
    console.log('\n--- Testing Department Filter ---');
    const testDepartment = 'Computer Science';
    const filterQuery = { 'personalInfo.department': testDepartment };
    
    console.log('Filter query:', JSON.stringify(filterQuery));
    const filteredCount = await Application.countDocuments(filterQuery);
    console.log(`Applications with department "${testDepartment}": ${filteredCount}`);

    // Get all unique departments
    const allDepartments = await Application.distinct('personalInfo.department');
    console.log('\nAll unique departments in database:', allDepartments);

  } catch (error) {
    console.error('Diagnosis failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

diagnoseApplications();