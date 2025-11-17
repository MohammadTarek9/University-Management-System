const mongoose = require('mongoose');
const Application = require('../models/Application');
require('dotenv').config({ path: '../.env' });

// Migration script to update applications from old schema to new schema
// This moves the 'program' field from academicInfo to personalInfo.department

async function migrateApplications() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database successfully');

    console.log('Starting application migration...');
    
    // Find all applications that have academicInfo.program but no personalInfo.department
    const applicationsToMigrate = await Application.find({
      'academicInfo.program': { $exists: true },
      'personalInfo.department': { $exists: false }
    });

    console.log(`Found ${applicationsToMigrate.length} applications to migrate`);

    if (applicationsToMigrate.length === 0) {
      console.log('No applications need migration');
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const app of applicationsToMigrate) {
      try {
        // Move program from academicInfo to personalInfo.department
        app.personalInfo.department = app.academicInfo.program;
        
        // Remove the old program field
        app.academicInfo.program = undefined;
        
        // Save the application
        await app.save();
        migratedCount++;
        
        console.log(`✓ Migrated application ${app.applicationId}: ${app.academicInfo.program} → ${app.personalInfo.department}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to migrate application ${app.applicationId}:`, error.message);
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Total applications found: ${applicationsToMigrate.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Failed migrations: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\nSome applications failed to migrate. Please review the errors above.');
    } else {
      console.log('\n✅ All applications migrated successfully!');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateApplications()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateApplications };