const eav = require('../utils/eav');

/**
 * Maintenance Request Repository using EAV Model
 * Handles CRUD operations for maintenance requests with category-specific attributes
 */

const ENTITY_TYPE_CODE = 'maintenance_request';

/**
 * Map EAV entity to Maintenance Request object format
 */
function mapMaintenanceRequestEntity(entity) {
  if (!entity) return null;

  const baseData = {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    category: entity.category,
    priority: entity.priority,
    status: entity.status,
    submittedBy: entity['submitted_by'] || entity.submittedBy,
    assignedTo: entity['assigned_to'] || entity.assignedTo,
    estimatedCompletion: entity['estimated_completion'] || entity.estimatedCompletion,
    actualCompletion: entity['actual_completion'] || entity.actualCompletion,
    adminNotes: entity['admin_notes'] || entity.adminNotes,
    
    // Location
    location: {
      building: entity['location.building'] || entity['location_building'],
      roomNumber: entity['location.roomNumber'] || entity['location_room_number'],
      floor: entity['location.floor'] || entity['location_floor']
    },
    
    // User Feedback
    userFeedback: {
      rating: entity['userFeedback.rating'] || entity['feedback_rating'],
      comment: entity['userFeedback.comment'] || entity['feedback_comment'],
      submittedAt: entity['userFeedback.submittedAt'] || entity['feedback_submitted_at']
    },
    
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };

  // Category-specific attributes
  const categoryAttributes = {};
  
  // Electrical category fields
  if (entity.voltage) categoryAttributes.voltage = entity.voltage;
  if (entity['circuit_breaker_location']) categoryAttributes.circuitBreakerLocation = entity['circuit_breaker_location'];
  if (entity['wire_type']) categoryAttributes.wireType = entity['wire_type'];
  if (entity['electrical_panel_id']) categoryAttributes.electricalPanelId = entity['electrical_panel_id'];
  
  // Plumbing category fields
  if (entity['pipe_size']) categoryAttributes.pipeSize = entity['pipe_size'];
  if (entity['water_type']) categoryAttributes.waterType = entity['water_type'];
  if (entity['leak_severity']) categoryAttributes.leakSeverity = entity['leak_severity'];
  if (entity['shutoff_valve_location']) categoryAttributes.shutoffValveLocation = entity['shutoff_valve_location'];
  
  // HVAC category fields
  if (entity['temperature_reading']) categoryAttributes.temperatureReading = entity['temperature_reading'];
  if (entity['system_type']) categoryAttributes.systemType = entity['system_type'];
  if (entity['filter_size']) categoryAttributes.filterSize = entity['filter_size'];
  if (entity['unit_number']) categoryAttributes.unitNumber = entity['unit_number'];
  
  // Equipment category fields
  if (entity['model_number']) categoryAttributes.modelNumber = entity['model_number'];
  if (entity['serial_number']) categoryAttributes.serialNumber = entity['serial_number'];
  if (entity['warranty_info']) categoryAttributes.warrantyInfo = entity['warranty_info'];
  if (entity['vendor_name']) categoryAttributes.vendorName = entity['vendor_name'];
  if (entity['purchase_date']) categoryAttributes.purchaseDate = entity['purchase_date'];
  
  // Structural category fields
  if (entity['material_type']) categoryAttributes.materialType = entity['material_type'];
  if (entity['affected_area_size']) categoryAttributes.affectedAreaSize = entity['affected_area_size'];
  if (entity['safety_risk_level']) categoryAttributes.safetyRiskLevel = entity['safety_risk_level'];
  if (entity['structural_engineer_required']) categoryAttributes.structuralEngineerRequired = entity['structural_engineer_required'];
  
  // Common additional fields
  if (entity['estimated_cost']) categoryAttributes.estimatedCost = entity['estimated_cost'];
  if (entity['actual_cost']) categoryAttributes.actualCost = entity['actual_cost'];
  if (entity['parts_needed']) categoryAttributes.partsNeeded = entity['parts_needed'];
  if (entity['contractor_required']) categoryAttributes.contractorRequired = entity['contractor_required'];
  if (entity['work_order_number']) categoryAttributes.workOrderNumber = entity['work_order_number'];

  return {
    ...baseData,
    categorySpecific: categoryAttributes
  };
}

/**
 * Prepare maintenance request data for EAV storage
 */
function prepareMaintenanceRequestAttributes(data) {
  const attributes = {
    // Core fields
    'title': data.title,
    'description': data.description,
    'category': data.category,
    'priority': data.priority || 'Medium',
    'status': data.status || 'Submitted',
    'submitted_by': data.submittedBy,
    'assigned_to': data.assignedTo || null,
    'estimated_completion': data.estimatedCompletion || null,
    'actual_completion': data.actualCompletion || null,
    'admin_notes': data.adminNotes || null,
    
    // Location
    'location_building': data.location?.building,
    'location_room_number': data.location?.roomNumber,
    'location_floor': data.location?.floor || null,
    
    // User Feedback
    'feedback_rating': data.userFeedback?.rating || null,
    'feedback_comment': data.userFeedback?.comment || null,
    'feedback_submitted_at': data.userFeedback?.submittedAt || null
  };

  // Add category-specific attributes if provided
  if (data.categorySpecific) {
    const cs = data.categorySpecific;
    
    // Electrical
    if (cs.voltage) attributes['voltage'] = cs.voltage;
    if (cs.circuitBreakerLocation) attributes['circuit_breaker_location'] = cs.circuitBreakerLocation;
    if (cs.wireType) attributes['wire_type'] = cs.wireType;
    if (cs.electricalPanelId) attributes['electrical_panel_id'] = cs.electricalPanelId;
    
    // Plumbing
    if (cs.pipeSize) attributes['pipe_size'] = cs.pipeSize;
    if (cs.waterType) attributes['water_type'] = cs.waterType;
    if (cs.leakSeverity) attributes['leak_severity'] = cs.leakSeverity;
    if (cs.shutoffValveLocation) attributes['shutoff_valve_location'] = cs.shutoffValveLocation;
    
    // HVAC
    if (cs.temperatureReading) attributes['temperature_reading'] = cs.temperatureReading;
    if (cs.systemType) attributes['system_type'] = cs.systemType;
    if (cs.filterSize) attributes['filter_size'] = cs.filterSize;
    if (cs.unitNumber) attributes['unit_number'] = cs.unitNumber;
    
    // Equipment
    if (cs.modelNumber) attributes['model_number'] = cs.modelNumber;
    if (cs.serialNumber) attributes['serial_number'] = cs.serialNumber;
    if (cs.warrantyInfo) attributes['warranty_info'] = cs.warrantyInfo;
    if (cs.vendorName) attributes['vendor_name'] = cs.vendorName;
    if (cs.purchaseDate) attributes['purchase_date'] = cs.purchaseDate;
    
    // Structural
    if (cs.materialType) attributes['material_type'] = cs.materialType;
    if (cs.affectedAreaSize) attributes['affected_area_size'] = cs.affectedAreaSize;
    if (cs.safetyRiskLevel) attributes['safety_risk_level'] = cs.safetyRiskLevel;
    if (cs.structuralEngineerRequired !== undefined) attributes['structural_engineer_required'] = cs.structuralEngineerRequired;
    
    // Common
    if (cs.estimatedCost) attributes['estimated_cost'] = cs.estimatedCost;
    if (cs.actualCost) attributes['actual_cost'] = cs.actualCost;
    if (cs.partsNeeded) attributes['parts_needed'] = cs.partsNeeded;
    if (cs.contractorRequired !== undefined) attributes['contractor_required'] = cs.contractorRequired;
    if (cs.workOrderNumber) attributes['work_order_number'] = cs.workOrderNumber;
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
 * Create a new maintenance request
 */
async function createMaintenanceRequest(requestData) {
  try {
    const attributes = prepareMaintenanceRequestAttributes(requestData);
    const naturalKey = `${requestData.category}-${Date.now()}`;
    
    const entityId = await eav.createEntityWithAttributes(
      ENTITY_TYPE_CODE,
      attributes,
      naturalKey
    );

    return await getMaintenanceRequestById(entityId);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    throw error;
  }
}

/**
 * Get maintenance request by ID
 */
async function getMaintenanceRequestById(id) {
  try {
    const entity = await eav.getEntity(id, ENTITY_TYPE_CODE);
    return mapMaintenanceRequestEntity(entity);
  } catch (error) {
    console.error('Error getting maintenance request:', error);
    throw error;
  }
}

/**
 * Update maintenance request
 */
async function updateMaintenanceRequest(id, requestData) {
  try {
    const attributes = prepareMaintenanceRequestAttributes(requestData);
    await eav.updateEntityAttributes(id, attributes, ENTITY_TYPE_CODE);
    
    return await getMaintenanceRequestById(id);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    throw error;
  }
}

/**
 * Delete maintenance request
 */
async function deleteMaintenanceRequest(id) {
  try {
    await eav.deleteEntity(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    throw error;
  }
}

/**
 * Get all maintenance requests with filters and pagination
 */
async function getAllMaintenanceRequests(options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      priority,
      status,
      submittedBy,
      assignedTo
    } = options;

    const filters = {};
    
    if (category) filters['category'] = category;
    if (priority) filters['priority'] = priority;
    if (status) filters['status'] = status;
    if (submittedBy) filters['submitted_by'] = submittedBy;
    if (assignedTo) filters['assigned_to'] = assignedTo;

    const result = await eav.queryEntities(ENTITY_TYPE_CODE, filters, { page, limit });

    return {
      maintenanceRequests: result.entities.map(mapMaintenanceRequestEntity),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error('Error getting all maintenance requests:', error);
    throw error;
  }
}

module.exports = {
  createMaintenanceRequest,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  getAllMaintenanceRequests
};
