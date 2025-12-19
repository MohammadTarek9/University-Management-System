/**
 * Migration Script: Migrate Subjects from Classical Schema to EAV Model
 * 
 * This script migrates subject data from the classical subjects table to the new EAV structure.
 * It preserves the original data (no deletion) and creates corresponding EAV records.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateSubjects() {
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
    console.log('Starting subject migration...\n');

    // Step 1: Fetch all subjects from classical table
    const [classicalSubjects] = await connection.execute(`
      SELECT * FROM subjects ORDER BY id
    `);

    console.log(`Found ${classicalSubjects.length} subjects in classical table`);

    if (classicalSubjects.length === 0) {
      console.log('No subjects to migrate');
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

    // Step 3: Migrate each subject
    for (const subject of classicalSubjects) {
      try {
        // Check if entity already exists
        const [existingEntity] = await connection.execute(`
          SELECT entityId FROM eav_entities 
          WHERE entityType = 'subject' AND name = ?
        `, [subject.name]);

        if (existingEntity.length > 0) {
          console.log(`⏭️  Skipped: ${subject.code} (already exists in EAV)`);
          skippedCount++;
          continue;
        }

        // Begin transaction for this subject
        await connection.beginTransaction();

        // Insert into eav_entities
        const [entityResult] = await connection.execute(`
          INSERT INTO eav_entities (entityType, name, departmentId, isActive, createdAt, updatedAt)
          VALUES ('subject', ?, ?, ?, NOW(), NOW())
        `, [
          subject.name,
          subject.departmentId || null,
          subject.isActive !== undefined ? subject.isActive : true
        ]);

        const entityId = entityResult.insertId;

        // Map classical fields to EAV attributes
        const attributes = [
          { key: 'code', value: subject.code || '', type: 'string' },
          { key: 'description', value: subject.description || '', type: 'text' },
          { key: 'credits', value: String(subject.credits || ''), type: 'number' }
        ];

        // Add flexible attributes if they exist
        if (subject.prerequisites) attributes.push({ key: 'prerequisites', value: subject.prerequisites, type: 'text' });
        if (subject.corequisites) attributes.push({ key: 'corequisites', value: subject.corequisites, type: 'text' });
        if (subject.learningOutcomes) attributes.push({ key: 'learningOutcomes', value: subject.learningOutcomes, type: 'text' });
        if (subject.textbooks) attributes.push({ key: 'textbooks', value: subject.textbooks, type: 'text' });
        if (subject.labRequired !== undefined) attributes.push({ key: 'labRequired', value: String(subject.labRequired), type: 'boolean' });
        if (subject.labHours) attributes.push({ key: 'labHours', value: String(subject.labHours), type: 'number' });
        if (subject.studioRequired !== undefined) attributes.push({ key: 'studioRequired', value: String(subject.studioRequired), type: 'boolean' });
        if (subject.studioHours) attributes.push({ key: 'studioHours', value: String(subject.studioHours), type: 'number' });
        if (subject.certifications) attributes.push({ key: 'certifications', value: subject.certifications, type: 'text' });
        if (subject.repeatability) attributes.push({ key: 'repeatability', value: subject.repeatability, type: 'string' });
        if (subject.syllabusTemplate) attributes.push({ key: 'syllabusTemplate', value: subject.syllabusTemplate, type: 'text' });
        if (subject.typicalOffering) attributes.push({ key: 'typicalOffering', value: subject.typicalOffering, type: 'string' });

        // Insert attributes
        for (const attr of attributes) {
          await connection.execute(`
            INSERT INTO eav_attributes (entityId, attributeKey, attributeValue, dataType)
            VALUES (?, ?, ?, ?)
          `, [entityId, attr.key, attr.value, attr.type]);
        }

        await connection.commit();
        console.log(`✅ Migrated: ${subject.code} - ${subject.name}`);
        migratedCount++;

      } catch (error) {
        await connection.rollback();
        console.error(`❌ Error migrating subject ${subject.code}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total subjects found: ${classicalSubjects.length}`);
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n✅ Subject migration complete!');
    console.log('Note: Original subjects table remains intact.');

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
  migrateSubjects()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migrateSubjects;
