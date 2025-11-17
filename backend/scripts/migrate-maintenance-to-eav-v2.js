const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateMaintenanceToEAV() {
  let connection;

  try {
    console.log('Starting maintenance migration to 3-table EAV...');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database');

    // Get all maintenance requests from classical table
    const [requests] = await connection.execute('SELECT * FROM maintenance_requests ORDER BY id');
    
    console.log(`Found ${requests.length} maintenance requests to migrate`);

    let successCount = 0;
    let errorCount = 0;

    // Helper function to insert attribute value
    async function insertValue(entityId, attributeName, value, dataType) {
      if (value === undefined || value === null) return;

      // Get or create attribute
      let [attrs] = await connection.execute(
        'SELECT attribute_id FROM eav_attributes WHERE attribute_name = ?',
        [attributeName]
      );

      let attributeId;
      if (attrs.length === 0) {
        const [result] = await connection.execute(
          'INSERT INTO eav_attributes (attribute_name, data_type) VALUES (?, ?)',
          [attributeName, dataType]
        );
        attributeId = result.insertId;
      } else {
        attributeId = attrs[0].attribute_id;
      }

      // Insert value into eav_values
      const valueColumns = {
        string: 'value_string',
        number: 'value_number',
        text: 'value_text',
        boolean: 'value_boolean',
        date: 'value_date'
      };

      const valueColumn = valueColumns[dataType] || 'value_string';

      await connection.execute(
        `INSERT INTO eav_values (entity_id, attribute_id, ${valueColumn}) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE ${valueColumn} = VALUES(${valueColumn})`,
        [entityId, attributeId, value]
      );
    }

    for (const request of requests) {
      try {
        // Create entity name
        const entityName = `${request.issue_type} - ${request.description?.substring(0, 50) || 'Maintenance Request'}`;

        // Check if entity already exists
        const [existing] = await connection.execute(
          'SELECT entity_id FROM eav_entities WHERE entity_type = ? AND name = ?',
          ['maintenance', entityName]
        );

        let entityId;
        if (existing.length > 0) {
          console.log(`Maintenance request already exists: ${entityName}`);
          entityId = existing[0].entity_id;
        } else {
          // Insert into eav_entities
          const [result] = await connection.execute(
            `INSERT INTO eav_entities (entity_type, name, is_active, created_at, updated_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            ['maintenance', entityName, request.status !== 'completed', request.created_at || new Date()]
          );
          entityId = result.insertId;
        }

        // Insert all attributes into eav_values
        await insertValue(entityId, 'room_id', request.room_id, 'number');
        await insertValue(entityId, 'issue_type', request.issue_type, 'string');
        await insertValue(entityId, 'description', request.description, 'text');
        await insertValue(entityId, 'severity', request.severity || 'medium', 'string');
        await insertValue(entityId, 'status', request.status || 'pending', 'string');
        await insertValue(entityId, 'reported_by', request.reported_by, 'number');
        await insertValue(entityId, 'reported_date', request.reported_date || new Date(), 'date');
        await insertValue(entityId, 'assigned_to', request.assigned_to, 'number');
        await insertValue(entityId, 'scheduled_date', request.scheduled_date, 'date');
        await insertValue(entityId, 'completed_date', request.completed_date, 'date');
        await insertValue(entityId, 'estimated_cost', request.estimated_cost, 'number');
        await insertValue(entityId, 'actual_cost', request.actual_cost, 'number');
        await insertValue(entityId, 'notes', request.notes, 'text');
        await insertValue(entityId, 'attachments', request.attachments, 'text');
        await insertValue(entityId, 'preventive_maintenance', request.preventive_maintenance || false, 'boolean');
        await insertValue(entityId, 'recurrence_pattern', request.recurrence_pattern, 'text');

        console.log(`✅ Migrated: ${entityName}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error migrating maintenance request ${request.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Successfully migrated: ${successCount} maintenance requests`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} maintenance requests`);
    }

    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  migrateMaintenanceToEAV()
    .then(result => {
      console.log('\n🎉 Migration completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateMaintenanceToEAV;
