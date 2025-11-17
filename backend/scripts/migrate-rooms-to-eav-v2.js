const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateRoomsToEAV() {
  let connection;

  try {
    console.log('Starting rooms migration to 3-table EAV...');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database');

    // Get all rooms from classical table
    const [rooms] = await connection.execute('SELECT * FROM rooms ORDER BY id');
    
    console.log(`Found ${rooms.length} rooms to migrate`);

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

    for (const room of rooms) {
      try {
        // Create entity name
        const entityName = `${room.building_name} ${room.room_number}`;

        // Check if entity already exists
        const [existing] = await connection.execute(
          'SELECT entity_id FROM eav_entities WHERE entity_type = ? AND name = ?',
          ['room', entityName]
        );

        let entityId;
        if (existing.length > 0) {
          console.log(`Room already exists: ${entityName}`);
          entityId = existing[0].entity_id;
        } else {
          // Insert into eav_entities
          const [result] = await connection.execute(
            `INSERT INTO eav_entities (entity_type, name, is_active, created_at, updated_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            ['room', entityName, room.is_available || true, room.created_at || new Date()]
          );
          entityId = result.insertId;
        }

        // Insert all attributes into eav_values
        await insertValue(entityId, 'building_name', room.building_name, 'string');
        await insertValue(entityId, 'room_number', room.room_number, 'string');
        await insertValue(entityId, 'capacity', room.capacity, 'number');
        await insertValue(entityId, 'room_type', room.room_type, 'string');
        await insertValue(entityId, 'features', room.features, 'text');
        await insertValue(entityId, 'is_available', room.is_available !== false, 'boolean');
        await insertValue(entityId, 'maintenance_schedule', room.maintenance_schedule, 'text');
        await insertValue(entityId, 'last_inspection_date', room.last_inspection_date, 'date');
        await insertValue(entityId, 'notes', room.notes, 'text');
        await insertValue(entityId, 'accessibility', room.accessibility, 'text');
        await insertValue(entityId, 'equipment_list', room.equipment_list, 'text');
        await insertValue(entityId, 'booking_rules', room.booking_rules, 'text');

        console.log(`✅ Migrated: ${entityName}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error migrating room ${room.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Successfully migrated: ${successCount} rooms`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} rooms`);
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
  migrateRoomsToEAV()
    .then(result => {
      console.log('\n🎉 Migration completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateRoomsToEAV;
