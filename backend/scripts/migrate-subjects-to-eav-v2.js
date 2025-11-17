/**
 * Migration Script: Migrate Subjects to 3-Table EAV Model
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateSubjects() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL database');
    console.log('Starting subject migration...\n');

    // Fetch all subjects
    const [classicalSubjects] = await connection.execute(`SELECT * FROM subjects ORDER BY id`);
    console.log(`Found ${classicalSubjects.length} subjects in classical table\n`);

    if (classicalSubjects.length === 0) {
      console.log('No subjects to migrate');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const subject of classicalSubjects) {
      try {
        // Check if entity already exists
        const [existingEntity] = await connection.execute(`
          SELECT entity_id FROM eav_entities 
          WHERE entity_type = 'subject' AND name = ?
        `, [subject.name]);

        if (existingEntity.length > 0) {
          console.log(`⏭️  Skipped: ${subject.code} (already exists)`);
          skippedCount++;
          continue;
        }

        await connection.beginTransaction();

        // Insert into eav_entities (truly generic - no department_id column)
        const [entityResult] = await connection.execute(`
          INSERT INTO eav_entities (entity_type, name, is_active, created_at, updated_at)
          VALUES ('subject', ?, ?, ?, NOW())
        `, [
          subject.name,
          subject.is_active !== null && subject.is_active !== undefined ? subject.is_active : 1,
          subject.created_at || null
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

        // Insert all subject attributes
        await insertValue('code', subject.code, 'string');
        await insertValue('description', subject.description, 'text');
        await insertValue('credits', subject.credits, 'number');
        await insertValue('department_id', subject.department_id, 'number');

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

if (require.main === module) {
  migrateSubjects()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migrateSubjects;
