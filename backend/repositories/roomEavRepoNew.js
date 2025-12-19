const eavUtil = require('../utils/eavNew');

const ENTITY_TYPE = 'room';

/**
 * Map EAV entity to room object
 */
function mapRoomEntity(entity) {
  console.log('Mapping room entity:', entity);
  if (!entity) return null;

  // Check if equipment/amenities/typeSpecific are stored as JSON (old format) or normalized (new format)
  let equipment = [];
  let amenities = [];
  let typeSpecific = {};

  // Handle OLD format: JSON arrays/objects stored directly
  if (entity.equipment && !entity.equipment_0_name) {
    // Old format: equipment is a JSON array
    equipment = Array.isArray(entity.equipment) ? entity.equipment : [];
  } else {
    // NEW format: reconstruct from equipment_* attributes
    const equipmentMap = new Map();
    Object.keys(entity).forEach(key => {
      if (key.startsWith('equipment_')) {
        const match = key.match(/equipment_(\d+)(?:_(.+))?/);
        if (match) {
          const index = parseInt(match[1]);
          const property = match[2];
          
          if (!equipmentMap.has(index)) {
            equipmentMap.set(index, {});
          }
          
          if (property) {
            equipmentMap.get(index)[property] = entity[key];
          } else {
            equipmentMap.set(index, entity[key]);
          }
        }
      }
    });
    equipmentMap.forEach(value => equipment.push(value));
  }

  // Handle OLD format for amenities
  if (entity.amenities && !entity.amenity_0) {
    amenities = Array.isArray(entity.amenities) ? entity.amenities : [];
  } else {
    // NEW format: reconstruct from amenity_* attributes
    Object.keys(entity).forEach(key => {
      if (key.startsWith('amenity_')) {
        amenities.push(entity[key]);
      }
    });
  }

  // Handle OLD format for typeSpecific
  if (entity.type_specific && !Object.keys(entity).some(k => k.startsWith('typespec_'))) {
    typeSpecific = typeof entity.type_specific === 'object' ? entity.type_specific : {};
  } else {
    // NEW format: reconstruct from typespec_* attributes
    Object.keys(entity).forEach(key => {
      if (key.startsWith('typespec_')) {
        const propName = key.replace('typespec_', '');
        typeSpecific[propName] = entity[key];
      }
    });
  }

  const mapped = {
    id: entity.entity_id,
    name: entity.room_name,
    type: entity.room_type,
    capacity: entity.capacity,
    location: {
      building: entity.building,
      floor: entity.floor,
      roomNumber: entity.room_number
    },
    equipment,
    amenities,
    typeSpecific,
    isActive: entity.is_active,
    description: entity.description,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at
  };

  console.log('Mapped room:', mapped);
  return mapped;
}

/**
 * Get all rooms
 */
async function getAllRooms(options = {}) {
  try {
    const { page = 1, limit = 10, building, roomType, isActive, minCapacity, search } = options;
    
    // Get all entities of type room
    let entities = await eavUtil.getEntitiesByType(ENTITY_TYPE);
    
    // Map to room objects
    let rooms = entities.map(mapRoomEntity);

    // Apply filters
    if (building) {
      rooms = rooms.filter(room => room.location?.building === building);
    }

    if (roomType) {
      rooms = rooms.filter(room => room.type === roomType);
    }

    if (isActive !== undefined) {
      // Handle both boolean and number (1/0) values
      const activeValue = isActive ? 1 : 0;
      rooms = rooms.filter(room => {
        const roomActiveValue = room.isActive === true || room.isActive === 1 ? 1 : 0;
        return roomActiveValue === activeValue;
      });
    }

    if (minCapacity) {
      rooms = rooms.filter(room => {
        const capacity = parseFloat(room.capacity);
        return !isNaN(capacity) && capacity >= minCapacity;
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      rooms = rooms.filter(room => 
        room.name?.toLowerCase().includes(searchLower) ||
        room.location?.building?.toLowerCase().includes(searchLower) ||
        room.location?.roomNumber?.toLowerCase().includes(searchLower) ||
        room.type?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = rooms.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Apply pagination
    const paginatedRooms = rooms.slice(startIndex, endIndex);

    return {
      rooms: paginatedRooms,
      total,
      totalPages
    };
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
    console.log('Creating room with data:', JSON.stringify(roomData, null, 2));
    
    // Create the entity first with proper name
    const roomName = roomData.roomName || roomData.name || `${roomData.building} ${roomData.roomNumber}`;
    const entityId = await eavUtil.createEntity(
      ENTITY_TYPE,
      roomName,
      { isActive: roomData.isActive !== false }
    );

    console.log('Created entity with ID:', entityId);

    // Build attributes object, only including defined values
    const attributes = {};
    
    if (roomName) attributes.room_name = { value: roomName, type: 'string' };
    if (roomData.building) attributes.building = { value: roomData.building, type: 'string' };
    if (roomData.floor) attributes.floor = { value: roomData.floor, type: 'string' };
    if (roomData.roomNumber) attributes.room_number = { value: roomData.roomNumber, type: 'string' };
    if (roomData.capacity !== undefined) attributes.capacity = { value: roomData.capacity, type: 'number' };
    if (roomData.roomType || roomData.type) attributes.room_type = { value: roomData.roomType || roomData.type, type: 'string' };
    if (roomData.description) attributes.description = { value: roomData.description, type: 'text' };

    // Handle equipment array - store each as separate attribute
    if (Array.isArray(roomData.equipment)) {
      roomData.equipment.forEach((item, index) => {
        if (item && typeof item === 'object') {
          // If equipment items are objects with name/quantity/condition
          attributes[`equipment_${index}_name`] = { value: item.name, type: 'string' };
          if (item.quantity) attributes[`equipment_${index}_quantity`] = { value: item.quantity, type: 'number' };
          if (item.condition) attributes[`equipment_${index}_condition`] = { value: item.condition, type: 'string' };
        } else {
          // If equipment items are just strings
          attributes[`equipment_${index}`] = { value: item, type: 'string' };
        }
      });
    }

    // Handle amenities array - store each as separate attribute
    if (Array.isArray(roomData.amenities)) {
      roomData.amenities.forEach((amenity, index) => {
        attributes[`amenity_${index}`] = { value: amenity, type: 'string' };
      });
    }

    // Handle typeSpecific object - store each property as separate attribute
    if (roomData.typeSpecific && typeof roomData.typeSpecific === 'object') {
      Object.entries(roomData.typeSpecific).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Determine type based on value
          let attrType = 'string';
          if (typeof value === 'number') attrType = 'number';
          else if (typeof value === 'boolean') attrType = 'boolean';
          else if (typeof value === 'string' && value.length > 255) attrType = 'text';
          
          attributes[`typespec_${key}`] = { value: value, type: attrType };
        }
      });
    }

    console.log('Setting attributes:', Object.keys(attributes));
    await eavUtil.setEntityAttributes(entityId, attributes);

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
    const roomName = roomData.roomName || roomData.name;
    await eavUtil.updateEntity(id, {
      name: roomName,
      isActive: roomData.isActive
    });

    // Update attributes
    const attributes = {};
    if (roomName) attributes.room_name = { value: roomName, type: 'string' };
    if (roomData.building) attributes.building = { value: roomData.building, type: 'string' };
    if (roomData.floor) attributes.floor = { value: roomData.floor, type: 'string' };
    if (roomData.roomNumber) attributes.room_number = { value: roomData.roomNumber, type: 'string' };
    if (roomData.capacity !== undefined) attributes.capacity = { value: roomData.capacity, type: 'number' };
    if (roomData.roomType || roomData.type) attributes.room_type = { value: roomData.roomType || roomData.type, type: 'string' };
    if (roomData.description) attributes.description = { value: roomData.description, type: 'text' };
    if (roomData.equipment) attributes.equipment = { value: roomData.equipment, type: 'text' };
    if (roomData.amenities) attributes.amenities = { value: roomData.amenities, type: 'text' };
    if (roomData.typeSpecific) attributes.type_specific = { value: roomData.typeSpecific, type: 'text' };

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

/**
 * Get room by building and room number (for duplicate checking)
 */
async function getRoomByNumber(building, roomNumber) {
  try {
    const allRooms = await getAllRooms();
    return allRooms.find(room => 
      room.location?.building === building && room.location?.roomNumber === roomNumber
    );
  } catch (error) {
    console.error(`Error checking for room ${building} ${roomNumber}:`, error);
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
  getRoomsByBuilding,
  getRoomByNumber
};
