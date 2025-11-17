/**
 * Master Migration Script: Migrate All Data to EAV Model
 * 
 * This script runs all individual migration scripts in the correct order.
 * Run this to migrate all data from classical schema to EAV in one go.
 */

const migrateSubjects = require('./migrate-subjects-to-eav-v2');
const migrateCourses = require('./migrate-courses-to-eav-v2');
const migrateRooms = require('./migrate-rooms-to-eav-v2');
const migrateMaintenance = require('./migrate-maintenance-to-eav-v2');

async function migrateAll() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     MASTER MIGRATION: Classical Schema → EAV Model       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Migrate Subjects (must be first as courses depend on subjects)
    console.log('\n📦 Step 1/4: Migrating Subjects...');
    console.log('─'.repeat(60));
    await migrateSubjects();

    // Step 2: Migrate Courses
    console.log('\n📦 Step 2/4: Migrating Courses...');
    console.log('─'.repeat(60));
    await migrateCourses();

    // Step 3: Migrate Rooms
    console.log('\n📦 Step 3/4: Migrating Rooms...');
    console.log('─'.repeat(60));
    await migrateRooms();

    // Step 4: Migrate Maintenance Requests
    console.log('\n📦 Step 4/4: Migrating Maintenance Requests...');
    console.log('─'.repeat(60));
    await migrateMaintenance();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL MIGRATIONS COMPLETE! ✅               ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n📋 Summary:');
    console.log('  • Subjects migrated to EAV');
    console.log('  • Courses migrated to EAV');
    console.log('  • Rooms migrated to EAV');
    console.log('  • Maintenance requests migrated to EAV');
    console.log('  • Original tables remain intact');
    console.log('\n✨ Your application is now ready to use the EAV model!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nPlease check the error above and try again.');
    process.exit(1);
  }
}

// Run all migrations
if (require.main === module) {
  migrateAll()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migrateAll;
