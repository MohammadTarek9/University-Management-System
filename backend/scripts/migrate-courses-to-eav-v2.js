/**
 * Migration Script: Migrate Courses to 3-Table EAV Model
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateCourses() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL database');
    console.log('Starting course migration...\n');

    // Check courses table structure
    console.log('Checking courses table structure...');
    const [columns] = await connection.execute(`DESCRIBE courses`);
    console.log('Courses table columns:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    console.log('');

    // Fetch all courses
    const [classicalCourses] = await connection.execute(`SELECT * FROM courses ORDER BY id`);
    console.log(`Found ${classicalCourses.length} courses in classical table\n`);

    if (classicalCourses.length === 0) {
      console.log('No courses to migrate');
      return;
    }

    // Check if EAV tables exist
    const [eavTables] = await connection.execute(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('eav_entities', 'eav_attributes', 'eav_values')
    `, [process.env.DB_NAME]);

    if (eavTables.length < 3) {
      console.error('❌ EAV tables not found. Please run create-eav-tables.sql first.');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Get subject mapping for course names
    const [subjects] = await connection.execute(`SELECT id, name, code FROM subjects`);
    const subjectMap = {};
    subjects.forEach(s => {
      subjectMap[s.id] = { name: s.name, code: s.code };
    });

    for (const course of classicalCourses) {
      try {
        // Generate a course name from available data
        const subject = subjectMap[course.subjectId] || { code: 'UNKNOWN', name: 'Unknown Subject' };
        const courseName = `${subject.code} - ${subject.name} (${course.semester} ${course.year})`;

        // Check if entity already exists by name
        const [existingEntity] = await connection.execute(`
          SELECT entity_id FROM eav_entities 
          WHERE entity_type = 'course' AND name = ?
        `, [courseName]);

        if (existingEntity.length > 0) {
          console.log(`⏭️  Skipped: ${courseName} (already exists)`);
          skippedCount++;
          continue;
        }

        await connection.beginTransaction();

        // Insert into eav_entities (truly generic - no subject_id column)
        const [entityResult] = await connection.execute(`
          INSERT INTO eav_entities (entity_type, name, is_active, created_at, updated_at)
          VALUES ('course', ?, ?, ?, NOW())
        `, [
          courseName,
          course.is_active !== null && course.is_active !== undefined ? course.is_active : 1,
          course.created_at || null
        ]);

        const entityId = entityResult.insertId;

        // Helper function to insert attribute value
        async function insertValue(attrName, value, dataType) {
          if (value === null || value === undefined) return;

          // Get or create attribute
          let [attr] = await connection.execute(
            `SELECT attribute_id FROM eav_attributes WHERE attribute_name = ?`,
            [attrName]
          );

          let attributeId;
          if (attr.length === 0) {
            const [result] = await connection.execute(
              `INSERT INTO eav_attributes (attribute_name, data_type) VALUES (?, ?)`,
              [attrName, dataType]
            );
            attributeId = result.insertId;
          } else {
            attributeId = attr[0].attribute_id;
          }

          // Insert value based on data type
          const valueColumns = {
            string: 'value_string',
            number: 'value_number',
            text: 'value_text',
            boolean: 'value_boolean',
            date: 'value_date'
          };

          const valueColumn = valueColumns[dataType];
          await connection.execute(`
            INSERT INTO eav_values (entity_id, attribute_id, ${valueColumn})
            VALUES (?, ?, ?)
          `, [entityId, attributeId, value]);
        }

        // Insert all course attributes
        await insertValue('subject_id', course.subject_id, 'number');
        await insertValue('semester', course.semester, 'string');
        await insertValue('year', course.year, 'number');
        await insertValue('instructor_id', course.instructor_id, 'number');
        await insertValue('max_enrollment', course.max_enrollment, 'number');
        await insertValue('current_enrollment', course.current_enrollment, 'number');
        await insertValue('schedule', course.schedule, 'string');

        await connection.commit();
        console.log(`✅ Migrated: ${courseName}`);
        migratedCount++;

      } catch (error) {
        await connection.rollback();
        console.error(`❌ Error migrating course ${course.id}:`, error.message);
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

if (require.main === module) {
  migrateCourses()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migrateCourses;
