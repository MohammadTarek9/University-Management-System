const eavUtil = require('../utils/eavNew');

const ENTITY_TYPE = 'room';

/**
 * Map EAV entity to room object
 */
function mapRoomEntity(entity) {
  if (!entity) return null;

  return {
    id: entity.entity_id,
    buildingName: entity.building_name,
    roomNumber: entity.room_number,
    capacity: entity.capacity,
    roomType: entity.room_type,
    features: entity.features,
    isAvailable: entity.is_available,
    maintenanceSchedule: entity.maintenance_schedule,
    lastInspectionDate: entity.last_inspection_date,
    notes: entity.notes,
    accessibility: entity.accessibility,
    equipmentList: entity.equipment_list,
    bookingRules: entity.booking_rules,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at
  };
}

/**
 * Get all rooms
 */
async function getAllRooms() {
  try {
    const entities = await eavUtil.getEntitiesByType(ENTITY_TYPE);
    return entities.map(mapRoomEntity);
  } catch (error) {
    console.error('Error getting all rooms:', error);
    throw error;
  }
}

/**
 * Get room by ID
 */
async function getRoomById(id) {
  try {
    const entity = await eavUtil.getEntityById(id);
    if (!entity || entity.entity_type !== ENTITY_TYPE) {
      return null;
    }
    return mapRoomEntity(entity);
  } catch (error) {
    console.error(`Error getting room ${id}:`, error);
    throw error;
  }
}

/**
 * Create new room
 */
async function createRoom(roomData) {
  try {
    // Create the entity first
    const entityId = await eavUtil.createEntity(
      ENTITY_TYPE,
      `${roomData.buildingName} ${roomData.roomNumber}`,
      { isActive: roomData.isAvailable !== false }
    );

    // Set all attributes
    await eavUtil.setEntityAttributes(entityId, {
      building_name: { value: roomData.buildingName, type: 'string' },
      room_number: { value: roomData.roomNumber, type: 'string' },
      capacity: { value: roomData.capacity, type: 'number' },
      room_type: { value: roomData.roomType, type: 'string' },
      features: { value: roomData.features, type: 'text' },
      is_available: { value: roomData.isAvailable !== false, type: 'boolean' },
      maintenance_schedule: { value: roomData.maintenanceSchedule, type: 'text' },
      last_inspection_date: { value: roomData.lastInspectionDate, type: 'date' },
      notes: { value: roomData.notes, type: 'text' },
      accessibility: { value: roomData.accessibility, type: 'text' },
      equipment_list: { value: roomData.equipmentList, type: 'text' },
      booking_rules: { value: roomData.bookingRules, type: 'text' }
    });

    return await getRoomById(entityId);
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

/**
 * Update room
 */
async function updateRoom(id, roomData) {
  try {
    // Update base entity
    await eavUtil.updateEntity(id, {
      name: roomData.buildingName && roomData.roomNumber ? 
        `${roomData.buildingName} ${roomData.roomNumber}` : undefined,
      isActive: roomData.isAvailable
    });

    // Update attributes
    const attributes = {};
    if (roomData.buildingName !== undefined) {
      attributes.building_name = { value: roomData.buildingName, type: 'string' };
    }
    if (roomData.roomNumber !== undefined) {
      attributes.room_number = { value: roomData.roomNumber, type: 'string' };
    }
    if (roomData.capacity !== undefined) {
      attributes.capacity = { value: roomData.capacity, type: 'number' };
    }
    if (roomData.roomType !== undefined) {
      attributes.room_type = { value: roomData.roomType, type: 'string' };
    }
    if (roomData.features !== undefined) {
      attributes.features = { value: roomData.features, type: 'text' };
    }
    if (roomData.isAvailable !== undefined) {
      attributes.is_available = { value: roomData.isAvailable, type: 'boolean' };
    }
    if (roomData.maintenanceSchedule !== undefined) {
      attributes.maintenance_schedule = { value: roomData.maintenanceSchedule, type: 'text' };
    }
    if (roomData.lastInspectionDate !== undefined) {
      attributes.last_inspection_date = { value: roomData.lastInspectionDate, type: 'date' };
    }
    if (roomData.notes !== undefined) {
      attributes.notes = { value: roomData.notes, type: 'text' };
    }
    if (roomData.accessibility !== undefined) {
      attributes.accessibility = { value: roomData.accessibility, type: 'text' };
    }
    if (roomData.equipmentList !== undefined) {
      attributes.equipment_list = { value: roomData.equipmentList, type: 'text' };
    }
    if (roomData.bookingRules !== undefined) {
      attributes.booking_rules = { value: roomData.bookingRules, type: 'text' };
    }

    if (Object.keys(attributes).length > 0) {
      await eavUtil.setEntityAttributes(id, attributes);
    }

    return await getRoomById(id);
  } catch (error) {
    console.error(`Error updating room ${id}:`, error);
    throw error;
  }
}

/**
 * Delete room
 */
async function deleteRoom(id) {
  try {
    await eavUtil.deleteEntity(id);
    return true;
  } catch (error) {
    console.error(`Error deleting room ${id}:`, error);
    throw error;
  }
}

/**
 * Search rooms by building or room number
 */
async function searchRooms(searchTerm) {
  try {
    // Search by building name
    const buildingResults = await eavUtil.searchEntitiesByAttribute(
      ENTITY_TYPE, 
      'building_name', 
      searchTerm
    );

    // Search by room number
    const roomResults = await eavUtil.searchEntitiesByAttribute(
      ENTITY_TYPE,
      'room_number',
      searchTerm
    );

    // Combine and deduplicate
    const combinedMap = new Map();
    [...buildingResults, ...roomResults].forEach(entity => {
      combinedMap.set(entity.entity_id, entity);
    });

    return Array.from(combinedMap.values()).map(mapRoomEntity);
  } catch (error) {
    console.error('Error searching rooms:', error);
    throw error;
  }
}

/**
 * Get available rooms
 */
async function getAvailableRooms() {
  try {
    const allRooms = await getAllRooms();
    return allRooms.filter(room => room.isAvailable);
  } catch (error) {
    console.error('Error getting available rooms:', error);
    throw error;
  }
}

/**
 * Get rooms by building
 */
async function getRoomsByBuilding(buildingName) {
  try {
    const results = await eavUtil.searchEntitiesByAttribute(
      ENTITY_TYPE,
      'building_name',
      buildingName
    );
    return results.map(mapRoomEntity);
  } catch (error) {
    console.error(`Error getting rooms for building ${buildingName}:`, error);
    throw error;
  }
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  searchRooms,
  getAvailableRooms,
  getRoomsByBuilding
};
