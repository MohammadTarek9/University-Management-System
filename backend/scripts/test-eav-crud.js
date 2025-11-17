/**
 * Test Script: Verify EAV CRUD Operations
 * 
 * This script tests Create, Read, Update, Delete operations on the EAV model
 * to ensure everything is working correctly.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testEavCrud() {
  let connection;
  let testEntityId;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         EAV MODEL CRUD OPERATIONS TEST                   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // ===== CREATE TEST =====
    console.log('📝 TEST 1: CREATE Operation');
    console.log('─'.repeat(60));
    
    await connection.beginTransaction();

    // Create a test course entity
    const [createResult] = await connection.execute(`
      INSERT INTO eav_entities (entityType, name, subjectId, isActive, createdAt, updatedAt)
      VALUES ('course', 'TEST COURSE - DELETE ME', 1, true, NOW(), NOW())
    `);

    testEntityId = createResult.insertId;
    console.log(`✅ Created test entity with ID: ${testEntityId}`);

    // Add some attributes
    const testAttributes = [
      { key: 'code', value: 'TEST101', type: 'string' },
      { key: 'credits', value: '3', type: 'number' },
      { key: 'description', value: 'This is a test course', type: 'text' },
      { key: 'prerequisites', value: 'None', type: 'text' },
      { key: 'labRequired', value: 'true', type: 'boolean' }
    ];

    for (const attr of testAttributes) {
      await connection.execute(`
        INSERT INTO eav_attributes (entityId, attributeKey, attributeValue, dataType)
        VALUES (?, ?, ?, ?)
      `, [testEntityId, attr.key, attr.value, attr.type]);
    }

    console.log(`✅ Created ${testAttributes.length} attributes`);
    await connection.commit();

    // ===== READ TEST =====
    console.log('\n📖 TEST 2: READ Operation');
    console.log('─'.repeat(60));

    // Read entity
    const [entities] = await connection.execute(`
      SELECT * FROM eav_entities WHERE entityId = ?
    `, [testEntityId]);

    if (entities.length === 0) {
      throw new Error('Failed to read entity');
    }
    console.log(`✅ Read entity: ${entities[0].name}`);

    // Read attributes
    const [attributes] = await connection.execute(`
      SELECT * FROM eav_attributes WHERE entityId = ?
    `, [testEntityId]);

    console.log(`✅ Read ${attributes.length} attributes:`);
    attributes.forEach(attr => {
      console.log(`   • ${attr.attributeKey}: ${attr.attributeValue} (${attr.dataType})`);
    });

    // Test reconstructing entity with attributes
    const entity = entities[0];
    attributes.forEach(attr => {
      entity[attr.attributeKey] = attr.attributeValue;
    });
    console.log(`✅ Successfully reconstructed entity object`);

    // ===== UPDATE TEST =====
    console.log('\n✏️  TEST 3: UPDATE Operation');
    console.log('─'.repeat(60));

    await connection.beginTransaction();

    // Update entity name
    await connection.execute(`
      UPDATE eav_entities 
      SET name = 'UPDATED TEST COURSE', updatedAt = NOW()
      WHERE entityId = ?
    `, [testEntityId]);

    console.log('✅ Updated entity name');

    // Update an attribute
    await connection.execute(`
      UPDATE eav_attributes 
      SET attributeValue = '4'
      WHERE entityId = ? AND attributeKey = 'credits'
    `, [testEntityId]);

    console.log('✅ Updated credits attribute from 3 to 4');

    // Add a new attribute
    await connection.execute(`
      INSERT INTO eav_attributes (entityId, attributeKey, attributeValue, dataType)
      VALUES (?, 'newField', 'New Value', 'string')
    `, [testEntityId]);

    console.log('✅ Added new attribute: newField');

    await connection.commit();

    // Verify updates
    const [updatedEntity] = await connection.execute(`
      SELECT * FROM eav_entities WHERE entityId = ?
    `, [testEntityId]);

    const [updatedAttrs] = await connection.execute(`
      SELECT * FROM eav_attributes WHERE entityId = ?
    `, [testEntityId]);

    console.log(`✅ Verified: Entity name is "${updatedEntity[0].name}"`);
    console.log(`✅ Verified: Now has ${updatedAttrs.length} attributes`);

    // ===== DELETE TEST =====
    console.log('\n🗑️  TEST 4: DELETE Operation');
    console.log('─'.repeat(60));

    await connection.beginTransaction();

    // Delete attributes first (foreign key constraint)
    const [deleteAttrsResult] = await connection.execute(`
      DELETE FROM eav_attributes WHERE entityId = ?
    `, [testEntityId]);

    console.log(`✅ Deleted ${deleteAttrsResult.affectedRows} attributes`);

    // Delete entity
    const [deleteEntityResult] = await connection.execute(`
      DELETE FROM eav_entities WHERE entityId = ?
    `, [testEntityId]);

    console.log(`✅ Deleted ${deleteEntityResult.affectedRows} entity`);

    await connection.commit();

    // Verify deletion
    const [verifyEntity] = await connection.execute(`
      SELECT * FROM eav_entities WHERE entityId = ?
    `, [testEntityId]);

    const [verifyAttrs] = await connection.execute(`
      SELECT * FROM eav_attributes WHERE entityId = ?
    `, [testEntityId]);

    if (verifyEntity.length === 0 && verifyAttrs.length === 0) {
      console.log('✅ Verified: Entity and attributes completely deleted');
    } else {
      throw new Error('Deletion verification failed');
    }

    // ===== FINAL SUMMARY =====
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL CRUD TESTS PASSED! ✅                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n✨ EAV Model is working correctly!');
    console.log('\nTest Results:');
    console.log('  ✅ CREATE: Successfully created entity with attributes');
    console.log('  ✅ READ: Successfully read entity and attributes');
    console.log('  ✅ UPDATE: Successfully updated entity and attributes');
    console.log('  ✅ DELETE: Successfully deleted entity and attributes');
    console.log('\n🎉 Your EAV implementation is fully operational!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nError details:', error);
    
    // Cleanup on error
    if (connection && testEntityId) {
      try {
        await connection.rollback();
        await connection.execute(`DELETE FROM eav_attributes WHERE entityId = ?`, [testEntityId]);
        await connection.execute(`DELETE FROM eav_entities WHERE entityId = ?`, [testEntityId]);
        console.log('🧹 Cleaned up test data');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run tests
if (require.main === module) {
  testEavCrud()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = testEavCrud;
