const eav = require('../utils/eav');

/**
 * Room Repository using EAV Model
 * Handles CRUD operations for rooms with type-specific attributes
 */

const ENTITY_TYPE_CODE = 'room';

/**
 * Map EAV entity to Room object format
 */
function mapRoomEntity(entity) {
  if (!entity) return null;

  const baseData = {
    id: entity.id,
    roomNumber: entity['room_number'] || entity.roomNumber,
    roomName: entity['room_name'] || entity.roomName,
    building: entity.building,
    floor: entity.floor,
    capacity: entity.capacity,
    roomType: entity['room_type'] || entity.roomType,
    isActive: entity['is_active'] !== undefined ? entity['is_active'] : entity.isActive,
    description: entity.description,
    
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };

  // Type-specific attributes
  const typeAttributes = {};
  
  // Lab-specific fields
  if (entity['fume_hoods_count']) typeAttributes.fumeHoodsCount = entity['fume_hoods_count'];
  if (entity['safety_equipment']) typeAttributes.safetyEquipment = entity['safety_equipment'];
  if (entity['lab_type']) typeAttributes.labType = entity['lab_type'];
  if (entity['chemical_storage']) typeAttributes.chemicalStorage = entity['chemical_storage'];
  if (entity['emergency_shower']) typeAttributes.emergencyShower = entity['emergency_shower'];
  if (entity['eye_wash_station']) typeAttributes.eyeWashStation = entity['eye_wash_station'];
  if (entity['hazmat_certified']) typeAttributes.hazmatCertified = entity['hazmat_certified'];
  
  // Computer Lab fields
  if (entity['computers_count']) typeAttributes.computersCount = entity['computers_count'];
  if (entity['software_installed']) typeAttributes.softwareInstalled = entity['software_installed'];
  if (entity['hardware_specs']) typeAttributes.hardwareSpecs = entity['hardware_specs'];
  if (entity['network_type']) typeAttributes.networkType = entity['network_type'];
  if (entity['printer_available']) typeAttributes.printerAvailable = entity['printer_available'];
  if (entity['scanner_available']) typeAttributes.scannerAvailable = entity['scanner_available'];
  
  // Lecture Hall fields
  if (entity['seating_arrangement']) typeAttributes.seatingArrangement = entity['seating_arrangement'];
  if (entity['av_equipment']) typeAttributes.avEquipment = entity['av_equipment'];
  if (entity['projector_type']) typeAttributes.projectorType = entity['projector_type'];
  if (entity['sound_system']) typeAttributes.soundSystem = entity['sound_system'];
  if (entity['recording_capable']) typeAttributes.recordingCapable = entity['recording_capable'];
  if (entity['whiteboard_count']) typeAttributes.whiteboardCount = entity['whiteboard_count'];
  if (entity['document_camera']) typeAttributes.documentCamera = entity['document_camera'];
  
  // Office fields
  if (entity['access_control_type']) typeAttributes.accessControlType = entity['access_control_type'];
  if (entity['furniture_list']) typeAttributes.furnitureList = entity['furniture_list'];
  if (entity['phone_extension']) typeAttributes.phoneExtension = entity['phone_extension'];
  if (entity['network_ports']) typeAttributes.networkPorts = entity['network_ports'];
  if (entity['window_count']) typeAttributes.windowCount = entity['window_count'];
  if (entity['occupant_name']) typeAttributes.occupantName = entity['occupant_name'];
  
  // Studio/Workshop fields
  if (entity['studio_type']) typeAttributes.studioType = entity['studio_type'];
  if (entity['equipment_list']) typeAttributes.equipmentList = entity['equipment_list'];
  if (entity['power_outlets_count']) typeAttributes.powerOutletsCount = entity['power_outlets_count'];
  if (entity['specialized_lighting']) typeAttributes.specializedLighting = entity['specialized_lighting'];
  if (entity['storage_space']) typeAttributes.storageSpace = entity['storage_space'];
  
  // Common additional fields
  if (entity['accessibility_features']) typeAttributes.accessibilityFeatures = entity['accessibility_features'];
  if (entity['climate_control']) typeAttributes.climateControl = entity['climate_control'];
  if (entity['natural_light']) typeAttributes.naturalLight = entity['natural_light'];
  if (entity['last_maintenance_date']) typeAttributes.lastMaintenanceDate = entity['last_maintenance_date'];
  if (entity['next_maintenance_date']) typeAttributes.nextMaintenanceDate = entity['next_maintenance_date'];
  if (entity['usage_notes']) typeAttributes.usageNotes = entity['usage_notes'];
  if (entity['booking_restrictions']) typeAttributes.bookingRestrictions = entity['booking_restrictions'];

  return {
    ...baseData,
    typeSpecific: typeAttributes
  };
}

/**
 * Prepare room data for EAV storage
 */
function prepareRoomAttributes(data) {
  const attributes = {
    // Core fields
    'room_number': data.roomNumber,
    'room_name': data.roomName || null,
    'building': data.building,
    'floor': data.floor,
    'capacity': data.capacity,
    'room_type': data.roomType,
    'is_active': data.isActive !== undefined ? data.isActive : true,
    'description': data.description || null
  };

  // Add type-specific attributes if provided
  if (data.typeSpecific) {
    const ts = data.typeSpecific;
    
    // Lab fields
    if (ts.fumeHoodsCount) attributes['fume_hoods_count'] = ts.fumeHoodsCount;
    if (ts.safetyEquipment) attributes['safety_equipment'] = ts.safetyEquipment;
    if (ts.labType) attributes['lab_type'] = ts.labType;
    if (ts.chemicalStorage !== undefined) attributes['chemical_storage'] = ts.chemicalStorage;
    if (ts.emergencyShower !== undefined) attributes['emergency_shower'] = ts.emergencyShower;
    if (ts.eyeWashStation !== undefined) attributes['eye_wash_station'] = ts.eyeWashStation;
    if (ts.hazmatCertified !== undefined) attributes['hazmat_certified'] = ts.hazmatCertified;
    
    // Computer Lab fields
    if (ts.computersCount) attributes['computers_count'] = ts.computersCount;
    if (ts.softwareInstalled) attributes['software_installed'] = ts.softwareInstalled;
    if (ts.hardwareSpecs) attributes['hardware_specs'] = ts.hardwareSpecs;
    if (ts.networkType) attributes['network_type'] = ts.networkType;
    if (ts.printerAvailable !== undefined) attributes['printer_available'] = ts.printerAvailable;
    if (ts.scannerAvailable !== undefined) attributes['scanner_available'] = ts.scannerAvailable;
    
    // Lecture Hall fields
    if (ts.seatingArrangement) attributes['seating_arrangement'] = ts.seatingArrangement;
    if (ts.avEquipment) attributes['av_equipment'] = ts.avEquipment;
    if (ts.projectorType) attributes['projector_type'] = ts.projectorType;
    if (ts.soundSystem) attributes['sound_system'] = ts.soundSystem;
    if (ts.recordingCapable !== undefined) attributes['recording_capable'] = ts.recordingCapable;
    if (ts.whiteboardCount) attributes['whiteboard_count'] = ts.whiteboardCount;
    if (ts.documentCamera !== undefined) attributes['document_camera'] = ts.documentCamera;
    
    // Office fields
    if (ts.accessControlType) attributes['access_control_type'] = ts.accessControlType;
    if (ts.furnitureList) attributes['furniture_list'] = ts.furnitureList;
    if (ts.phoneExtension) attributes['phone_extension'] = ts.phoneExtension;
    if (ts.networkPorts) attributes['network_ports'] = ts.networkPorts;
    if (ts.windowCount) attributes['window_count'] = ts.windowCount;
    if (ts.occupantName) attributes['occupant_name'] = ts.occupantName;
    
    // Studio/Workshop fields
    if (ts.studioType) attributes['studio_type'] = ts.studioType;
    if (ts.equipmentList) attributes['equipment_list'] = ts.equipmentList;
    if (ts.powerOutletsCount) attributes['power_outlets_count'] = ts.powerOutletsCount;
    if (ts.specializedLighting) attributes['specialized_lighting'] = ts.specializedLighting;
    if (ts.storageSpace) attributes['storage_space'] = ts.storageSpace;
    
    // Common fields
    if (ts.accessibilityFeatures) attributes['accessibility_features'] = ts.accessibilityFeatures;
    if (ts.climateControl) attributes['climate_control'] = ts.climateControl;
    if (ts.naturalLight !== undefined) attributes['natural_light'] = ts.naturalLight;
    if (ts.lastMaintenanceDate) attributes['last_maintenance_date'] = ts.lastMaintenanceDate;
    if (ts.nextMaintenanceDate) attributes['next_maintenance_date'] = ts.nextMaintenanceDate;
    if (ts.usageNotes) attributes['usage_notes'] = ts.usageNotes;
    if (ts.bookingRestrictions) attributes['booking_restrictions'] = ts.bookingRestrictions;
  }

  // Remove undefined values
  Object.keys(attributes).forEach(key => {
    if (attributes[key] === undefined) {
      delete attributes[key];
    }
  });

  return attributes;
}

/**
 * Create a new room
 */
async function createRoom(roomData) {
  try {
    const attributes = prepareRoomAttributes(roomData);
    const naturalKey = `${roomData.building}-${roomData.roomNumber}`;
    
    const entityId = await eav.createEntityWithAttributes(
      ENTITY_TYPE_CODE,
      attributes,
      naturalKey
    );

    return await getRoomById(entityId);
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

/**
 * Get room by ID
 */
async function getRoomById(id) {
  try {
    const entity = await eav.getEntity(id, ENTITY_TYPE_CODE);
    return mapRoomEntity(entity);
  } catch (error) {
    console.error('Error getting room:', error);
    throw error;
  }
}

/**
 * Update room
 */
async function updateRoom(id, roomData) {
  try {
    const attributes = prepareRoomAttributes(roomData);
    await eav.updateEntityAttributes(id, attributes, ENTITY_TYPE_CODE);
    
    return await getRoomById(id);
  } catch (error) {
    console.error('Error updating room:', error);
    throw error;
  }
}

/**
 * Delete room
 */
async function deleteRoom(id) {
  try {
    await eav.deleteEntity(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}

/**
 * Get all rooms with filters and pagination
 */
async function getAllRooms(options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      building,
      roomType,
      isActive,
      minCapacity,
      maxCapacity
    } = options;

    const filters = {};
    
    if (building) filters['building'] = building;
    if (roomType) filters['room_type'] = roomType;
    if (isActive !== undefined) filters['is_active'] = isActive;

    const result = await eav.queryEntities(ENTITY_TYPE_CODE, filters, { page, limit });

    // Filter by capacity if needed (post-query filtering since capacity is numeric comparison)
    let rooms = result.entities.map(mapRoomEntity);
    
    if (minCapacity !== undefined) {
      rooms = rooms.filter(room => room.capacity >= minCapacity);
    }
    if (maxCapacity !== undefined) {
      rooms = rooms.filter(room => room.capacity <= maxCapacity);
    }

    return {
      rooms,
      total: rooms.length, // Adjusted for post-filtering
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(rooms.length / limit)
    };
  } catch (error) {
    console.error('Error getting all rooms:', error);
    throw error;
  }
}

/**
 * Get room by natural key (building + room number)
 */
async function getRoomByNumber(building, roomNumber) {
  try {
    const naturalKey = `${building}-${roomNumber}`;
    const entity = await eav.getEntityByNaturalKey(ENTITY_TYPE_CODE, naturalKey);
    return mapRoomEntity(entity);
  } catch (error) {
    console.error('Error getting room by number:', error);
    throw error;
  }
}

module.exports = {
  createRoom,
  getRoomById,
  updateRoom,
  deleteRoom,
  getAllRooms,
  getRoomByNumber
};
