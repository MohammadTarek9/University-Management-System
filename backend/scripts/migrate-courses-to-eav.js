/**
 * Migration Script: Migrate Courses from Classical Schema to EAV Model
 * 
 * This script migrates course data from the classical courses table to the new EAV structure.
 * It preserves the original data (no deletion) and creates corresponding EAV records.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateCourses() {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL database');
    console.log('Starting course migration...\n');

    // First, describe the courses table structure
    console.log('Checking courses table structure...');
    const [columns] = await connection.execute(`
      DESCRIBE courses
    `);
    console.log('Courses table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    console.log('');

    // Step 1: Fetch all courses from classical table
    const [classicalCourses] = await connection.execute(`
      SELECT * FROM courses ORDER BY id
    `);

    console.log(`Found ${classicalCourses.length} courses in classical table`);

    if (classicalCourses.length === 0) {
      console.log('No courses to migrate');
      return;
    }

    // Step 2: Check if EAV tables exist
    const [eavTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('eav_entities', 'eav_attributes')
    `, [process.env.DB_NAME]);

    if (eavTables.length < 2) {
      console.error('❌ EAV tables not found. Please run the EAV schema first.');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Step 3: Migrate each course
    for (const course of classicalCourses) {
      try {
        // Check if entity already exists
        const [existingEntity] = await connection.execute(`
          SELECT entityId FROM eav_entities 
          WHERE entityType = 'course' AND name = ?
        `, [course.name]);

        if (existingEntity.length > 0) {
          console.log(`⏭️  Skipped: ${course.code} (already exists in EAV)`);
          skippedCount++;
          continue;
        }

        // Begin transaction for this course
        await connection.beginTransaction();

        // Insert into eav_entities
        const courseName = course.name || course.code || course.title || course.courseName || `Course ${course.id}`;
        const [entityResult] = await connection.execute(`
          INSERT INTO eav_entities (entityType, name, subjectId, isActive, createdAt, updatedAt)
          VALUES ('course', ?, ?, ?, NOW(), NOW())
        `, [
          courseName,
          course.subjectId || null,
          course.isActive !== undefined && course.isActive !== null ? course.isActive : 1
        ]);

        const entityId = entityResult.insertId;

        // Map classical fields to EAV attributes - handle all possible undefined values
        const attributes = [];
        
        // Only add attributes if they have actual values
        if (course.code || course.courseCode) {
          attributes.push({ key: 'code', value: course.code || course.courseCode, type: 'string' });
        }
        if (course.credits !== undefined || course.credit !== undefined) {
          attributes.push({ key: 'credits', value: String(course.credits || course.credit || 0), type: 'number' });
        }
        if (course.description) {
          attributes.push({ key: 'description', value: course.description, type: 'text' });
        }
        if (course.level) {
          attributes.push({ key: 'level', value: course.level, type: 'string' });
        }
        if (course.department) {
          attributes.push({ key: 'department', value: course.department, type: 'string' });
        }
        if (course.semester) {
          attributes.push({ key: 'semester', value: course.semester, type: 'string' });
        }
        if (course.year) {
          attributes.push({ key: 'year', value: String(course.year), type: 'number' });
        }

        // Add flexible attributes if they exist
        if (course.prerequisites) attributes.push({ key: 'prerequisites', value: course.prerequisites, type: 'text' });
        if (course.corequisites) attributes.push({ key: 'corequisites', value: course.corequisites, type: 'text' });
        if (course.labRequired !== undefined && course.labRequired !== null) {
          attributes.push({ key: 'labRequired', value: String(course.labRequired), type: 'boolean' });
        }
        if (course.labHours) attributes.push({ key: 'labHours', value: String(course.labHours), type: 'number' });
        if (course.gradingRubric) attributes.push({ key: 'gradingRubric', value: course.gradingRubric, type: 'text' });
        if (course.assessmentTypes) attributes.push({ key: 'assessmentTypes', value: course.assessmentTypes, type: 'text' });
        if (course.attendancePolicy) attributes.push({ key: 'attendancePolicy', value: course.attendancePolicy, type: 'text' });
        if (course.onlineMeetingLink) attributes.push({ key: 'onlineMeetingLink', value: course.onlineMeetingLink, type: 'string' });
        if (course.syllabusUrl) attributes.push({ key: 'syllabusUrl', value: course.syllabusUrl, type: 'string' });
        if (course.officeHours) attributes.push({ key: 'officeHours', value: course.officeHours, type: 'string' });
        if (course.textbookTitle) attributes.push({ key: 'textbookTitle', value: course.textbookTitle, type: 'string' });
        if (course.textbookAuthor) attributes.push({ key: 'textbookAuthor', value: course.textbookAuthor, type: 'string' });
        if (course.textbookIsbn) attributes.push({ key: 'textbookIsbn', value: course.textbookIsbn, type: 'string' });
        if (course.textbookRequired !== undefined && course.textbookRequired !== null) {
          attributes.push({ key: 'textbookRequired', value: String(course.textbookRequired), type: 'boolean' });
        }

        // Insert attributes (only if we have any)
        for (const attr of attributes) {
          // Double-check no undefined values slip through
          if (attr.key && attr.value !== undefined && attr.value !== null) {
            await connection.execute(`
              INSERT INTO eav_attributes (entityId, attributeKey, attributeValue, dataType)
              VALUES (?, ?, ?, ?)
            `, [entityId, attr.key, String(attr.value), attr.type]);
          }
        }

        await connection.commit();
        console.log(`✅ Migrated: ${course.code || course.courseCode || course.id} - ${courseName}`);
        migratedCount++;

      } catch (error) {
        await connection.rollback();
        const courseId = course.code || course.id || 'unknown';
        console.error(`❌ Error migrating course ${courseId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total courses found: ${classicalCourses.length}`);
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n✅ Course migration complete!');
    console.log('Note: Original courses table remains intact.');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run migration
if (require.main === module) {
  migrateCourses()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migrateCourses;
